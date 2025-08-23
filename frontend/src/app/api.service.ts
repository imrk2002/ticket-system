import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  // Auto-target same host as frontend (works for remote hosts too)
  private protocol = window.location.protocol;
  private host = window.location.hostname;
  scheduleBase = `${this.protocol}//${this.host}:5001`;
  reservationBase = `${this.protocol}//${this.host}:5002`;

  constructor(private http: HttpClient) {}

  searchTrips(origin: string, destination: string, date: string): Observable<any[]> {
    const params = new URLSearchParams({ origin, destination, date });
    return this.http.get<any[]>(`${this.scheduleBase}/trips/search?${params.toString()}`);
  }

  getAvailability(tripId: number): Observable<{ trip_id: number; seats_available: number }> {
    return this.http.get<{ trip_id: number; seats_available: number }>(`${this.scheduleBase}/trips/${tripId}/availability`);
  }

  book(tripId: number, passengerName: string, seats: number): Observable<any> {
    return this.http.post<any>(`${this.reservationBase}/reservations`, { trip_id: tripId, passenger_name: passengerName, seats });
  }

  cancel(reservationId: number): Observable<any> {
    return this.http.post<any>(`${this.reservationBase}/reservations/${reservationId}/cancel`, {});
  }

  listReservations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.reservationBase}/reservations`);
  }
}

