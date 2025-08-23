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

