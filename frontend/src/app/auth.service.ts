import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

interface LoginResponse { token: string; role: 'ADMIN' | 'USER'; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private protocol = window.location.protocol;
  private host = window.location.hostname;
  private reservationBase = `${this.protocol}//${this.host}:5002`;

  private tokenKey = 'auth_token';
  private roleKey = 'auth_role';

  private _isAuthenticated$ = new BehaviorSubject<boolean>(!!localStorage.getItem(this.tokenKey));
  isAuthenticated$ = this._isAuthenticated$.asObservable();

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.reservationBase}/auth/login`, { username, password }).pipe(
      tap((res) => {
        localStorage.setItem(this.tokenKey, res.token);
        localStorage.setItem(this.roleKey, res.role);
        this._isAuthenticated$.next(true);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);
    this._isAuthenticated$.next(false);
  }

  getToken(): string | null { return localStorage.getItem(this.tokenKey); }
  getRole(): 'ADMIN' | 'USER' | null { return (localStorage.getItem(this.roleKey) as any) || null; }
  isAdmin(): boolean { return this.getRole() === 'ADMIN'; }
}

