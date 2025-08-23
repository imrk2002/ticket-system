import os
import time
from datetime import datetime, date, timedelta
from typing import Any, Dict

from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import and_

from models import db, Route, Trip
from sqlalchemy import text


def wait_for_db(retries: int = 30, delay_seconds: float = 2.0) -> None:
    for attempt in range(1, retries + 1):
        try:
            db.session.execute(text("SELECT 1"))
            return
        except Exception:
            time.sleep(delay_seconds)
    # last try: raise to let container restart
    db.session.execute(text("SELECT 1"))


def create_app() -> Flask:
    app = Flask(__name__)

    db_user = os.environ.get("DB_USER", "schedule_user")
    db_password = os.environ.get("DB_PASSWORD", "schedule_password")
    db_host = os.environ.get("DB_HOST", "127.0.0.1")
    db_port = os.environ.get("DB_PORT", "3306")
    db_name = os.environ.get("DB_NAME", "schedule_db")

    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    CORS(app)
    db.init_app(app)

    with app.app_context():
        wait_for_db()
        db.create_all()
        seed_if_empty()

    register_routes(app)
    return app


def seed_if_empty() -> None:
    if Route.query.count() > 0:
        return
    route_pairs = [
        ("City A", "City B"),
        ("City A", "City C"),
        ("City B", "City C"),
    ]
    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    for origin, destination in route_pairs:
        route = Route(origin=origin, destination=destination)
        db.session.add(route)
        db.session.flush()
        for h in [2, 6, 10]:
            trip = Trip(
                route_id=route.id,
                departure_time=now + timedelta(hours=h),
                seats_total=40,
                seats_available=40,
            )
            db.session.add(trip)
    db.session.commit()


def register_routes(app: Flask) -> None:
    @app.get("/health")
    def health() -> Any:
        try:
            db.session.execute(text("SELECT 1"))
            return jsonify({"status": "ok"})
        except Exception as exc:
            return jsonify({"status": "degraded", "error": str(exc)}), 500

    @app.post("/routes")
    def create_route() -> Any:
        data = request.get_json(force=True)
        origin = (data or {}).get("origin")
        destination = (data or {}).get("destination")
        if not origin or not destination:
            return jsonify({"error": "origin and destination are required"}), 400
        route = Route(origin=origin, destination=destination)
        db.session.add(route)
        db.session.commit()
        return jsonify({"id": route.id, "origin": route.origin, "destination": route.destination}), 201

    @app.get("/routes")
    def list_routes() -> Any:
        routes = Route.query.all()
        return jsonify([
            {"id": r.id, "origin": r.origin, "destination": r.destination} for r in routes
        ])

    @app.post("/trips")
    def create_trip() -> Any:
        data = request.get_json(force=True)
        try:
            route_id = int(data.get("route_id"))
            departure_time = datetime.fromisoformat(data.get("departure_time"))
            seats_total = int(data.get("seats_total"))
        except Exception:
            return jsonify({"error": "route_id, departure_time (ISO), seats_total required"}), 400

        route = Route.query.get(route_id)
        if route is None:
            return jsonify({"error": "route not found"}), 404

        trip = Trip(
            route_id=route_id,
            departure_time=departure_time,
            seats_total=seats_total,
            seats_available=seats_total,
        )
        db.session.add(trip)
        db.session.commit()
        return jsonify(serialize_trip(trip)), 201

    @app.get("/trips/search")
    def search_trips() -> Any:
        origin = request.args.get("origin")
        destination = request.args.get("destination")
        date_str = request.args.get("date")  # YYYY-MM-DD

        if not (origin and destination and date_str):
            return jsonify({"error": "origin, destination, and date are required"}), 400

        try:
            search_date = date.fromisoformat(date_str)
        except Exception:
            return jsonify({"error": "invalid date format"}), 400

        start_dt = datetime.combine(search_date, datetime.min.time())
        end_dt = datetime.combine(search_date, datetime.max.time())

        trips = (
            Trip.query.join(Route)
            .filter(
                and_(
                    Route.origin == origin,
                    Route.destination == destination,
                    Trip.departure_time >= start_dt,
                    Trip.departure_time <= end_dt,
                )
            )
            .all()
        )
        return jsonify([serialize_trip(t) for t in trips])

    @app.get("/trips/<int:trip_id>")
    def get_trip(trip_id: int) -> Any:
        trip = Trip.query.get(trip_id)
        if trip is None:
            return jsonify({"error": "trip not found"}), 404
        return jsonify(serialize_trip(trip))

    @app.get("/trips/<int:trip_id>/availability")
    def trip_availability(trip_id: int) -> Any:
        trip = Trip.query.get(trip_id)
        if trip is None:
            return jsonify({"error": "trip not found"}), 404
        return jsonify({"trip_id": trip.id, "seats_available": trip.seats_available})

    @app.post("/trips/<int:trip_id>/allocate")
    def allocate_seats(trip_id: int) -> Any:
        data = request.get_json(force=True) or {}
        try:
            count = int(data.get("count", 0))
        except Exception:
            return jsonify({"error": "count must be integer"}), 400
        if count <= 0:
            return jsonify({"error": "count must be positive"}), 400

        # Transaction with row-level lock
        trip = (
            db.session.query(Trip)
            .filter(Trip.id == trip_id)
            .with_for_update()
            .one_or_none()
        )
        if trip is None:
            return jsonify({"error": "trip not found"}), 404
        if trip.seats_available < count:
            return jsonify({"error": "insufficient_seats", "available": trip.seats_available}), 409
        trip.seats_available -= count
        db.session.commit()
        return jsonify({"trip_id": trip.id, "allocated": count, "seats_available": trip.seats_available})

    @app.post("/trips/<int:trip_id>/release")
    def release_seats(trip_id: int) -> Any:
        data = request.get_json(force=True) or {}
        try:
            count = int(data.get("count", 0))
        except Exception:
            return jsonify({"error": "count must be integer"}), 400
        if count <= 0:
            return jsonify({"error": "count must be positive"}), 400

        trip = (
            db.session.query(Trip)
            .filter(Trip.id == trip_id)
            .with_for_update()
            .one_or_none()
        )
        if trip is None:
            return jsonify({"error": "trip not found"}), 404
        # Do not exceed seats_total
        new_available = min(trip.seats_total, trip.seats_available + count)
        actually_released = new_available - trip.seats_available
        trip.seats_available = new_available
        db.session.commit()
        return jsonify({"trip_id": trip.id, "released": actually_released, "seats_available": trip.seats_available})


def serialize_trip(trip: Trip) -> Dict[str, Any]:
    route = trip.route
    return {
        "id": trip.id,
        "route": {
            "id": route.id,
            "origin": route.origin,
            "destination": route.destination,
        },
        "departure_time": trip.departure_time.isoformat(),
        "seats_total": trip.seats_total,
        "seats_available": trip.seats_available,
    }


if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", "5001"))
    app.run(host="0.0.0.0", port=port)

