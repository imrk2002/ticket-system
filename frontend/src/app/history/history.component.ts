import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-history',
  template: `
    <div class="card">
      <div class="toolbar">
        <h3>Booking History</h3>
        <div class="actions">
          <button class="btn btn-secondary" (click)="refresh()">Refresh</button>
        </div>
      </div>
    </div>
    <div class="card" *ngIf="reservations?.length">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th><th>Trip</th><th>Passenger</th><th>Seats</th><th>Status</th><th *ngIf="isAdmin">Booked By</th><th style="width:1%"></th>
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
            <td *ngIf="isAdmin">{{r.booked_by || '-'}}</td>
            <td><button class="btn btn-danger" (click)="cancel(r.id)" [disabled]="r.status==='CANCELLED'">Cancel</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
})
export class HistoryComponent {
  reservations: any[] = [];
  isAdmin = false;
  constructor(private api: ApiService, private auth: AuthService) { this.isAdmin = this.auth.getRole() === 'ADMIN'; this.refresh(); }

  refresh() { this.api.listReservations().subscribe(res => this.reservations = res); }
  cancel(id: number) { this.api.cancel(id).subscribe(() => this.refresh()); }
}

