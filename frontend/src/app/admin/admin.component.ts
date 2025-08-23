import { Component } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-admin',
  template: `
    <div class="card">
      <h3>Admin Dashboard</h3>
      <p>Welcome, admin. This is a placeholder for admin features.</p>
      <button (click)="logout()">Logout</button>
    </div>
  `,
})
export class AdminComponent {
  constructor(private auth: AuthService) {}
  logout() { this.auth.logout(); }
}

