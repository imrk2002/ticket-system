import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-admin-login',
  template: `
    <div class="center">
      <div class="card" style="max-width:460px; width:100%">
        <h3>Admin Sign in</h3>
        <div class="grid cols-1 mt-12">
          <div>
            <label>Username</label>
            <input [(ngModel)]="username" placeholder="admin" />
          </div>
          <div>
            <label>Password</label>
            <input type="password" [(ngModel)]="password" placeholder="••••••••" />
          </div>
        </div>
        <div class="mt-12">
          <button class="btn btn-primary" (click)="login()">Login</button>
        </div>
        <div *ngIf="error" class="mt-12" style="color:#fca5a5">{{error}}</div>
      </div>
    </div>
  `,
})
export class AdminLoginComponent {
  username = '';
  password = '';
  error = '';
  constructor(private auth: AuthService, private router: Router) {}
  login() {
    this.error = '';
    this.auth.login(this.username, this.password).subscribe({
      next: (res) => {
        if (res.role !== 'ADMIN') { this.error = 'Admin role required'; return; }
        this.router.navigate(['/admin']);
      },
      error: (err) => this.error = err?.error?.error || 'Login failed',
    });
  }
}

