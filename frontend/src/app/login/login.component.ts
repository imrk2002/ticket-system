import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="card">
      <h3>Login</h3>
      <div class="row">
        <div>
          <label>Username</label>
          <input [(ngModel)]="username" />
        </div>
        <div>
          <label>Password</label>
          <input type="password" [(ngModel)]="password" />
        </div>
      </div>
      <button (click)="login()">Login</button>
      <div *ngIf="error" style="color:red;margin-top:8px">{{error}}</div>
    </div>
  `,
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  constructor(private auth: AuthService, private router: Router) {}
  login() {
    this.error = '';
    this.auth.login(this.username, this.password).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => this.error = err?.error?.error || 'Login failed',
    });
  }
}

