import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-search',
  template: `
    <div class="card">
      <div class="toolbar">
        <h3>Search Trips</h3>
        <div class="actions">
          <button class="btn btn-secondary" (click)="reset()">Reset</button>
          <button class="btn btn-primary" (click)="search()">Search</button>
        </div>
      </div>
      <div class="grid cols-3 mt-12">
        <div>
          <label>Origin</label>
          <input [(ngModel)]="origin" placeholder="City A" />
        </div>
        <div>
          <label>Destination</label>
          <input [(ngModel)]="destination" placeholder="City B" />
        </div>
        <div>
          <label>Date</label>
          <input type="date" [(ngModel)]="date" />
        </div>
      </div>
      <div *ngIf="error" class="mt-12" style="color:#fca5a5">{{error}}</div>
    </div>

    <div class="card" *ngIf="trips?.length">
      <table class="table">
        <thead>
          <tr>
            <th>Route</th>
            <th>Departure</th>
            <th>Seats</th>
            <th style="width:1%"></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of trips">
            <td><b>{{t.route.origin}} → {{t.route.destination}}</b></td>
            <td>{{t.departure_time | date:'medium'}}</td>
            <td>
              <span class="badge" [class.success]="t.seats_available>0" [class.danger]="t.seats_available===0">
                {{t.seats_available}} / {{t.seats_total}}
              </span>
            </td>
            <td><button class="btn btn-primary" (click)="book(t.id)">Book</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
})
export class SearchComponent {
  origin = 'City A';
  destination = 'City B';
  date = new Date().toISOString().substring(0, 10);
  trips: any[] = [];
  error = '';

  constructor(private api: ApiService, private router: Router) {}

  search() {
    this.error = '';
    this.trips = [];
    this.api.searchTrips(this.origin, this.destination, this.date).subscribe({
      next: (res) => (this.trips = res || []),
      error: (err) => (this.error = err?.error?.error || 'Search failed'),
    });
  }

  book(tripId: number) {
    this.router.navigate(['/book', tripId]);
  }
}

