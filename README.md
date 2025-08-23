# ticket-system

Bus Ticket Reservation System – two Flask microservices (Bus Schedule and Reservation), MySQL, and an Angular frontend.

Services
- Bus Schedule Service (Flask): manages routes, trips, and seat availability
- Reservation Service (Flask): bookings/cancellations, calls schedule to allocate/release seats
- MySQL 8: databases `schedule_db` and `reservation_db`
- Angular frontend: search, booking, history

Run with Docker (recommended)
1. docker compose up --build
2. Open frontend: http://localhost:4200
3. APIs: Schedule http://localhost:5001, Reservation http://localhost:5002

Run locally (no Docker)
- Requires Python 3.11+, Node 20+, and a MySQL server.
- Create databases and users (see mysql/init/01-init.sql) or adjust env vars.
- Bus Schedule Service
  export DB_HOST=127.0.0.1 DB_USER=schedule_user DB_PASSWORD=schedule_password DB_NAME=schedule_db PORT=5001
  cd services/bus_schedule_service && pip install -r requirements.txt && python app.py
- Reservation Service
  export DB_HOST=127.0.0.1 DB_USER=reservation_user DB_PASSWORD=reservation_password DB_NAME=reservation_db PORT=5002 SCHEDULE_SERVICE_URL=http://localhost:5001
  cd services/reservation_service && pip install -r requirements.txt && python app.py
- Frontend
  cd frontend && npm install && npm start

Notes
- Seed data: Bus Schedule seeds a sample route/trip on first run.
- Health endpoints: /health on both services.
