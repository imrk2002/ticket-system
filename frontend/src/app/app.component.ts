import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="container">
      <h1>Bus Ticket Reservation</h1>
      <nav class="row">
        <a routerLink="/" routerLinkActive="active">Search</a>
        <a routerLink="/history" routerLinkActive="active">History</a>
      </nav>
      <router-outlet></router-outlet>
    </div>
  `,
})
export class AppComponent {}

