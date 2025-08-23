import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-booking',
  template: `
    <div class="card">
      <div class="toolbar">
        <h3>Book Trip #{{tripId}}</h3>
        <div class="actions">
          <button class="btn btn-primary" (click)="book()">Confirm Booking</button>
        </div>
      </div>
      <div class="grid cols-2 mt-12">
        <div>
          <label>Passenger Name</label>
          <input [(ngModel)]="passenger" />
        </div>
        <div>
          <label>Seats</label>
          <input type="number" [(ngModel)]="seats" min="1" />
        </div>
      </div>
      <div *ngIf="error" class="mt-12" style="color:#fca5a5">{{error}}</div>
    </div>
  `,
})
export class BookingComponent {
  tripId = 0;
  passenger = '';
  seats = 1;
  error = '';

  constructor(private route: ActivatedRoute, private api: ApiService, private router: Router) {
    this.tripId = Number(this.route.snapshot.paramMap.get('tripId'));
  }

  book() {
    this.api.book(this.tripId, this.passenger, this.seats).subscribe({
      next: () => this.router.navigate(['/history']),
      error: (err) => (this.error = err?.error?.error || 'Booking failed'),
    });
  }
}

