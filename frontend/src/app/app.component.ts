import { Component } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  template: `
    <div class="navbar">
      <div class="navbar-inner">
        <div class="brand">
          <div class="brand-badge"></div>
          <div>Bus Ticket Reservation</div>
        </div>
        <div class="nav-links">
          <a routerLink="/" routerLinkActive="active">Search</a>
          <a routerLink="/history" routerLinkActive="active">History</a>
          <a routerLink="/admin" routerLinkActive="active">Admin</a>
          <a routerLink="/login" routerLinkActive="active" *ngIf="!isAuthed">User Login</a>
          <a routerLink="/admin-login" routerLinkActive="active" *ngIf="!isAuthed">Admin Login</a>
          <button class="btn btn-secondary" (click)="toggleTheme()">Toggle Theme</button>
          <button class="btn btn-secondary" (click)="logout()" *ngIf="isAuthed">Logout</button>
        </div>
      </div>
    </div>
    <div class="page">
      <router-outlet></router-outlet>
    </div>
  `,
})
export class AppComponent {
  isAuthed = false;
  constructor(private auth: AuthService) {
    this.isAuthed = !!this.auth.getToken();
    this.auth.isAuthenticated$.subscribe(v => this.isAuthed = v);
  }
  logout() { this.auth.logout(); location.hash = '#/'; }
  toggleTheme() {
    const root = document.documentElement;
    const isLight = root.getAttribute('data-theme') === 'light';
    root.setAttribute('data-theme', isLight ? 'dark' : 'light');
  }
}

