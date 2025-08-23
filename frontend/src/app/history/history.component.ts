import { Component } from '@angular/core';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-history',
  template: `
    <div class="card">
      <button (click)="refresh()">Refresh</button>
    </div>
    <div *ngFor="let r of reservations" class="card">
      <div class="row">
        <div>
          <div><b>Reservation #{{r.id}}</b></div>
          <div>Trip: {{r.trip_id}}</div>
          <div>Passenger: {{r.passenger_name}}</div>
          <div>Seats: {{r.seats_booked}}</div>
          <div>Status: {{r.status}}</div>
        </div>
        <div>
          <button (click)="cancel(r.id)" [disabled]="r.status==='CANCELLED'">Cancel</button>
        </div>
      </div>
    </div>
  `,
})
export class HistoryComponent {
  reservations: any[] = [];
  constructor(private api: ApiService) { this.refresh(); }

  refresh() { this.api.listReservations().subscribe(res => this.reservations = res); }
  cancel(id: number) { this.api.cancel(id).subscribe(() => this.refresh()); }
}

