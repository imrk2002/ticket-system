from __future__ import annotations

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import relationship
from datetime import datetime

db = SQLAlchemy()


class Route(db.Model):
    __tablename__ = "routes"

    id = db.Column(db.Integer, primary_key=True)
    origin = db.Column(db.String(100), nullable=False, index=True)
    destination = db.Column(db.String(100), nullable=False, index=True)

    trips = relationship("Trip", back_populates="route", cascade="all, delete-orphan")


class Trip(db.Model):
    __tablename__ = "trips"

    id = db.Column(db.Integer, primary_key=True)
    route_id = db.Column(db.Integer, db.ForeignKey("routes.id"), nullable=False, index=True)
    departure_time = db.Column(db.DateTime, nullable=False, index=True)
    seats_total = db.Column(db.Integer, nullable=False)
    seats_available = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    route = relationship("Route", back_populates="trips")

