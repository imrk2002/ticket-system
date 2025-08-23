from __future__ import annotations

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class Reservation(db.Model):
    __tablename__ = "reservations"

    id = db.Column(db.Integer, primary_key=True)
    trip_id = db.Column(db.Integer, nullable=False, index=True)
    passenger_name = db.Column(db.String(120), nullable=False)
    seats_booked = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="BOOKED")  # BOOKED/CANCELLED
    booked_by = db.Column(db.String(80), nullable=True, index=True)  # username who booked
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="USER")  # ADMIN or USER
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

