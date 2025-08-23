import { Component } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-admin',
  template: `
    <div class="card">
      <div class="toolbar">
        <h3>Admin Dashboard</h3>
        <div class="actions">
          <button class="btn btn-secondary" (click)="logout()">Logout</button>
        </div>
      </div>
      <p class="muted mt-12">Welcome, admin. Use this area to manage routes, trips, and reservations in the future.</p>
    </div>
  `,
})
export class AdminComponent {
  constructor(private auth: AuthService) {}
  logout() { this.auth.logout(); }
}

