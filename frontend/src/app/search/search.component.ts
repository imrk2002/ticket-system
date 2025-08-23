import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-search',
  template: `
    <div class="card">
      <div class="row">
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
      <button (click)="search()">Search</button>
      <div *ngIf="error" style="color:red;margin-top:8px">{{error}}</div>
    </div>

    <div *ngFor="let t of trips" class="card">
      <div class="row">
        <div>
          <div><b>{{t.route.origin}} → {{t.route.destination}}</b></div>
          <div>{{t.departure_time}}</div>
        </div>
        <div>
          <div>Seats: {{t.seats_available}} / {{t.seats_total}}</div>
          <button (click)="book(t.id)">Book</button>
        </div>
      </div>
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

