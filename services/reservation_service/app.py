import os
import time
from typing import Any, Dict

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

from models import db, Reservation
from sqlalchemy import text


def wait_for_db(retries: int = 30, delay_seconds: float = 2.0) -> None:
    for attempt in range(1, retries + 1):
        try:
            db.session.execute(text("SELECT 1"))
            return
        except Exception:
            time.sleep(delay_seconds)
    db.session.execute(text("SELECT 1"))


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

    CORS(app)
    db.init_app(app)

    with app.app_context():
        wait_for_db()
        db.create_all()

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

