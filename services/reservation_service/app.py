import os
import time
from typing import Any, Dict, Optional

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

from models import db, Reservation, User
from sqlalchemy import text


def wait_for_db(retries: int = 30, delay_seconds: float = 2.0) -> None:
    for attempt in range(1, retries + 1):
        try:
            db.session.execute(text("SELECT 1"))
            return
        except Exception:
            time.sleep(delay_seconds)
    db.session.execute(text("SELECT 1"))


def seed_users() -> None:
    from hashlib import sha256

    if User.query.filter_by(username="admin").first() is None:
        admin = User(username="admin", password_hash=sha256("Admin@123".encode()).hexdigest(), role="ADMIN")
        db.session.add(admin)
    if User.query.filter_by(username="user").first() is None:
        usr = User(username="user", password_hash=sha256("User@123".encode()).hexdigest(), role="USER")
        db.session.add(usr)
    db.session.commit()


def seed_reservations() -> None:
    import requests as rq
    from random import randint
    from datetime import date as _d

    if Reservation.query.count() > 0:
        return
    schedule_base = os.environ.get("SCHEDULE_SERVICE_URL", "http://localhost:5001")
    try:
        q = rq.get(f"{schedule_base}/trips/search", params={"origin": "City A", "destination": "City B", "date": _d.today().isoformat()}, timeout=5)
        trips = q.json() if q.status_code == 200 else []
        for t in trips[:2]:
            rq.post(f"{schedule_base}/trips/{t['id']}/allocate", json={"count": 2}, timeout=5)
            r = Reservation(trip_id=t['id'], passenger_name=f"Demo User {randint(100,999)}", seats_booked=2, status="BOOKED")
            db.session.add(r)
        db.session.commit()
    except Exception:
        db.session.rollback()


def create_app() -> Flask:
    app = Flask(__name__)

    db_user = os.environ.get("DB_USER", "reservation_user")
    db_password = os.environ.get("DB_PASSWORD", "reservation_password")
    db_host = os.environ.get("DB_HOST", "127.0.0.1")
    db_port = os.environ.get("DB_PORT", "3306")
    db_name = os.environ.get("DB_NAME", "reservation_db")
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET"] = os.environ.get("JWT_SECRET", "dev_secret_change_me")

    CORS(app)
    db.init_app(app)

    with app.app_context():
        wait_for_db()
        db.create_all()
        seed_users()
        seed_reservations()

    register_routes(app)
    return app


def register_routes(app: Flask) -> None:
    schedule_base = os.environ.get("SCHEDULE_SERVICE_URL", "http://localhost:5001")

    @app.get("/health")
    def health() -> Any:
        try:
            db.session.execute(text("SELECT 1"))
            return jsonify({"status": "ok"})
        except Exception as exc:
            return jsonify({"status": "degraded", "error": str(exc)}), 500

    @app.post("/auth/login")
    def login() -> Any:
        from hashlib import sha256
        import jwt

        data = request.get_json(force=True) or {}
        username = str(data.get("username", "")).strip()
        password = str(data.get("password", ""))
        if not username or not password:
            return jsonify({"error": "username and password required"}), 400

        user: Optional[User] = User.query.filter_by(username=username).first()
        if user is None:
            return jsonify({"error": "invalid_credentials"}), 401
        if user.password_hash != sha256(password.encode()).hexdigest():
            return jsonify({"error": "invalid_credentials"}), 401

        token = jwt.encode({"sub": user.username, "role": user.role}, app.config["JWT_SECRET"], algorithm="HS256")
        return jsonify({"token": token, "role": user.role})

    @app.post("/reservations")
    def create_reservation() -> Any:
        data = request.get_json(force=True) or {}
        try:
            trip_id = int(data.get("trip_id"))
            passenger_name = str(data.get("passenger_name"))
            seats = int(data.get("seats", 1))
        except Exception:
            return jsonify({"error": "trip_id, passenger_name, seats required"}), 400

        # Check availability
        avail_resp = requests.get(f"{schedule_base}/trips/{trip_id}/availability", timeout=5)
        if avail_resp.status_code != 200:
            return jsonify({"error": "trip_not_found_or_service_unavailable"}), 502
        available = avail_resp.json().get("seats_available", 0)
        if available < seats:
            return jsonify({"error": "insufficient_seats", "available": available}), 409

        # Allocate seats atomically on schedule service
        alloc_resp = requests.post(
            f"{schedule_base}/trips/{trip_id}/allocate",
            json={"count": seats},
            timeout=5,
        )
        if alloc_resp.status_code != 200:
            # Pass through error
            try:
                return jsonify(alloc_resp.json()), alloc_resp.status_code
            except Exception:
                return jsonify({"error": "allocation_failed"}), 502

        reservation = Reservation(
            trip_id=trip_id,
            passenger_name=passenger_name,
            seats_booked=seats,
            status="BOOKED",
        )
        db.session.add(reservation)
        db.session.commit()
        return jsonify(serialize_reservation(reservation)), 201

    @app.post("/reservations/<int:reservation_id>/cancel")
    def cancel_reservation(reservation_id: int) -> Any:
        reservation = Reservation.query.get(reservation_id)
        if reservation is None:
            return jsonify({"error": "reservation_not_found"}), 404
        if reservation.status == "CANCELLED":
            return jsonify(serialize_reservation(reservation))

        # Release seats back to schedule service
        release_resp = requests.post(
            f"{schedule_base}/trips/{reservation.trip_id}/release",
            json={"count": reservation.seats_booked},
            timeout=5,
        )
        if release_resp.status_code != 200:
            try:
                return jsonify(release_resp.json()), release_resp.status_code
            except Exception:
                return jsonify({"error": "release_failed"}), 502

        reservation.status = "CANCELLED"
        db.session.commit()
        return jsonify(serialize_reservation(reservation))

    @app.get("/reservations")
    def list_reservations() -> Any:
        items = Reservation.query.order_by(Reservation.id.desc()).all()
        return jsonify([serialize_reservation(r) for r in items])

    @app.get("/reservations/<int:reservation_id>")
    def get_reservation(reservation_id: int) -> Any:
        reservation = Reservation.query.get(reservation_id)
        if reservation is None:
            return jsonify({"error": "reservation_not_found"}), 404
        return jsonify(serialize_reservation(reservation))


def serialize_reservation(r: Reservation) -> Dict[str, Any]:
    return {
        "id": r.id,
        "trip_id": r.trip_id,
        "passenger_name": r.passenger_name,
        "seats_booked": r.seats_booked,
        "status": r.status,
        "created_at": r.created_at.isoformat(),
    }


if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", "5002"))
    app.run(host="0.0.0.0", port=port)