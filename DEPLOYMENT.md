## Deployment Guide

This guide covers two deployment options:
- Docker Compose (recommended)
- Bare-metal (Linux host without Docker)

Prerequisites
- A Linux host with internet access
- Domain names and DNS records if exposing publicly
- Open ports as needed (defaults: 80/443 for web via reverse proxy; 4200 frontend; 5001 schedule; 5002 reservation; 3306 MySQL if remote access is required)

Security notes
- Change default passwords in `docker-compose.yml` for production.
- Restrict MySQL external access (bind to internal network only).
- Use HTTPS via a reverse proxy (Nginx + Certbot) for public deployments.

---

## Option A: Docker Compose (Recommended)

1) Install Docker and Compose
```bash
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER" && newgrp docker
```

2) Clone and checkout the deployment branch
```bash
git clone https://github.com/imrk2002/ticket-system.git
cd ticket-system
git checkout feature/new
```

3) (Optional) Customize credentials
- Edit `docker-compose.yml` to change MySQL root password and service DB user passwords.
- Update service environment variables if needed (e.g., ports, service URLs).

4) Start the stack
```bash
docker compose up -d --build
```

5) Validate services
```bash
curl -f http://localhost:5001/health   # schedule
curl -f http://localhost:5002/health   # reservation
```

6) Open the frontend
- http://localhost:4200

7) Authentication and UI
- Frontend routes (hash-based): `#/` (home), `#/login` (user login), `#/admin-login` (admin login), `#/admin` (admin dashboard), `#/history` (bookings)
- Default credentials (dev):
  - Admin: `admin` / `Admin@123`
  - User: `user` / `User@123`
- JWT secret: configured via `JWT_SECRET` on the reservation service in `docker-compose.yml`. Change for production and redeploy that service.

7) (Optional) Reverse proxy with Nginx
Example single-domain config (serving frontend on root, APIs under `/api/...`):
```nginx
server {
    listen 80;
    server_name your.domain.com;

    location /api/schedule/ {
        proxy_pass http://127.0.0.1:5001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location /api/reservation/ {
        proxy_pass http://127.0.0.1:5002/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location / {
        proxy_pass http://127.0.0.1:4200/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
Then secure with HTTPS (Certbot):
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your.domain.com
```

8) Backups
- MySQL data is persisted in the `mysql_data` Docker volume. Snapshot volumes regularly or dump:
```bash
docker exec -i ticket_mysql mysqldump -uroot -prootpassword --databases schedule_db reservation_db > backup.sql
```

---

## Option B: Bare-metal (Without Docker)

1) Install dependencies
```bash
sudo apt-get update -y
sudo apt-get install -y python3.11 python3.11-venv python3.11-distutils build-essential \
                        mysql-server nginx nodejs npm
sudo npm i -g @angular/cli@17
```

2) Configure MySQL
```bash
sudo systemctl enable --now mysql
mysql -uroot -p < mysql/init/01-init.sql
```

3) Bus Schedule Service (Flask)
```bash
cd services/bus_schedule_service
python3.11 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
export DB_HOST=127.0.0.1 DB_PORT=3306 DB_USER=schedule_user DB_PASSWORD=schedule_password DB_NAME=schedule_db PORT=5001
python app.py &
```

4) Reservation Service (Flask)
```bash
cd services/reservation_service
python3.11 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
export DB_HOST=127.0.0.1 DB_PORT=3306 DB_USER=reservation_user DB_PASSWORD=reservation_password DB_NAME=reservation_db PORT=5002 SCHEDULE_SERVICE_URL=http://127.0.0.1:5001
python app.py &
```

5) Frontend (Angular)
```bash
cd frontend
npm install
npx ng build --configuration production
sudo rm -rf /var/www/html/*
sudo cp -r dist/bus-ticket-frontend/* /var/www/html/
sudo systemctl enable --now nginx
```

6) Nginx reverse proxy (single domain)
```nginx
server {
    listen 80;
    server_name your.domain.com;

    location /api/schedule/ { proxy_pass http://127.0.0.1:5001/; }
    location /api/reservation/ { proxy_pass http://127.0.0.1:5002/; }
    location / { root /var/www/html; try_files $uri /index.html; }
}
```
Enable and reload:
```bash
sudo tee /etc/nginx/sites-available/bus.conf >/dev/null <<'EOF'
server {
    listen 80;
    server_name your.domain.com;
    location /api/schedule/ { proxy_pass http://127.0.0.1:5001/; }
    location /api/reservation/ { proxy_pass http://127.0.0.1:5002/; }
    location / { root /var/www/html; try_files $uri /index.html; }
}
EOF
sudo ln -sf /etc/nginx/sites-available/bus.conf /etc/nginx/sites-enabled/bus.conf
sudo nginx -t && sudo systemctl reload nginx
```

7) HTTPS (Certbot)
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your.domain.com
```

8) Manage as services (optional)
Create systemd units for Python apps or use `pm2` for Node-like process management.

---

## Verification
- Schedule health: `curl http://your.domain.com/api/schedule/health`
- Reservation health: `curl http://your.domain.com/api/reservation/health`
- Frontend: visit `http(s)://your.domain.com`

## Upgrades
```bash
git pull
docker compose pull && docker compose up -d --build   # if using Docker
# or rebuild Angular and restart Python services if bare-metal
```

---

## New Features Overview

- Rich seeding of Indian city routes and trips (today/tomorrow) in the Schedule service
- JWT-based authentication in the Reservation service
- Seeded users: one admin and one standard user (dev defaults below)
- Admin dashboard to view all bookings; normal users see only their bookings
- Frontend light/dark theme toggle from the navbar

## Managing Users (Reservation DB)

Users are stored in `reservation_db.users` with fields: `username`, `password_hash` (SHA256 hex, lowercase), and `role` (`ADMIN` or `USER`).

Default (development) users are seeded on first start:
- Admin: `admin` / `Admin@123`
- User: `user` / `User@123`

Change passwords (Docker Compose example):
```bash
docker exec -it ticket_mysql \
  mysql -uroot -prootpassword -e \
  "UPDATE reservation_db.users SET password_hash=LOWER(SHA2('NewAdminPass',256)) WHERE username='admin';"

docker exec -it ticket_mysql \
  mysql -uroot -prootpassword -e \
  "UPDATE reservation_db.users SET password_hash=LOWER(SHA2('NewUserPass',256)) WHERE username='user';"
```

Create a new user (ADMIN example):
```bash
docker exec -it ticket_mysql \
  mysql -uroot -prootpassword -e \
  "INSERT INTO reservation_db.users (username,password_hash,role) VALUES ('opsadmin', LOWER(SHA2('StrongPass123',256)), 'ADMIN');"
```

List users:
```bash
docker exec -it ticket_mysql mysql -uroot -prootpassword -e "SELECT id,username,role,created_at FROM reservation_db.users;" | cat
```

Delete a user:
```bash
docker exec -it ticket_mysql mysql -uroot -prootpassword -e "DELETE FROM reservation_db.users WHERE username='someuser';"
```

Rotate JWT secret (forces re-login for everyone):
1. Edit `docker-compose.yml` under `reservation` → `JWT_SECRET: <new-strong-secret>`
2. Redeploy reservation service:
   ```bash
   docker compose up -d --build reservation
   ```

## Booking Visibility and Admin Actions

- Normal user: `/reservations` returns only their own bookings; they can cancel their own bookings.
- Admin: `/reservations` returns all bookings for all users; admin UI shows a table with a “Booked By” column.

## Seeding Data and Reseeding

Schedule service seeds routes/trips only if empty. Reservation service seeds a few demo bookings only if empty.

To reseed everything (Docker Compose):
```bash
docker exec -it ticket_mysql mysql -uroot -prootpassword -e "TRUNCATE reservation_db.reservations; TRUNCATE schedule_db.trips; TRUNCATE schedule_db.routes;"
docker compose restart bus-schedule reservation
```

## Rolling Updates / Partial Redeploys

- Backend only:
```bash
docker compose build bus-schedule reservation && docker compose up -d bus-schedule reservation
```

- Frontend only:
```bash
docker compose build frontend && docker compose up -d frontend
```

## Troubleshooting

- Services restarting:
  - Ensure MySQL is healthy: `docker compose ps` and `docker compose logs mysql | cat`
  - We set MySQL users with `mysql_native_password` and added DB wait/retry logic.
  - Rebuild images without cache if dependencies changed: `docker compose build --no-cache`

- Frontend blank page:
  - We enabled polyfills, hash routing, and Nginx SPA fallback in the frontend image.
  - Hard refresh browser (Ctrl+F5). Rebuild frontend if needed.

- Auth errors:
  - Verify `JWT_SECRET` is set and consistent across redeploys.
  - Confirm login with seeded users; rotate passwords via SQL as shown above.

