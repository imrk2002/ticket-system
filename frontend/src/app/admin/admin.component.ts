import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-admin',
  template: `
    <div class="card">
      <div class="toolbar">
        <h3>Admin Dashboard</h3>
        <div class="actions">
          <button class="btn btn-secondary" (click)="refresh()">Refresh</button>
          <button class="btn btn-secondary" (click)="logout()">Logout</button>
        </div>
      </div>
      <p class="muted mt-12">All bookings across users</p>
    </div>

    <div class="card" *ngIf="reservations?.length">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Trip</th>
            <th>Passenger</th>
            <th>Seats</th>
            <th>Status</th>
            <th>Booked By</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of reservations">
            <td>#{{r.id}}</td>
            <td>{{r.trip_id}}</td>
            <td>{{r.passenger_name}}</td>
            <td>{{r.seats_booked}}</td>
            <td>
              <span class="badge" [class.success]="r.status==='BOOKED'" [class.warn]="r.status!=='BOOKED'">{{r.status}}</span>
            </td>
            <td>{{r.booked_by || '-'}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
})
export class AdminComponent {
  reservations: any[] = [];
  constructor(private auth: AuthService, private api: ApiService) { this.refresh(); }
  logout() { this.auth.logout(); location.hash = '#/'; }
  refresh() { this.api.listReservations().subscribe(res => this.reservations = res || []); }
}

