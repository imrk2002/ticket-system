import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-booking',
  template: `
    <div class="card">
      <h3>Book Trip #{{tripId}}</h3>
      <div class="row">
        <div>
          <label>Passenger Name</label>
          <input [(ngModel)]="passenger" />
        </div>
        <div>
          <label>Seats</label>
          <input type="number" [(ngModel)]="seats" min="1" />
        </div>
      </div>
      <button (click)="book()">Confirm Booking</button>
      <div *ngIf="error" style="color:red">{{error}}</div>
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

