import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { SearchComponent } from './search/search.component';
import { BookingComponent } from './booking/booking.component';
import { HistoryComponent } from './history/history.component';
import { LoginComponent } from './login/login.component';
import { AdminLoginComponent } from './login/admin-login.component';
import { AdminComponent } from './admin/admin.component';
import { AuthGuard, AdminGuard } from './auth.guard';
import { AuthInterceptor } from './auth.interceptor';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'admin-login', component: AdminLoginComponent },
  { path: '', component: SearchComponent },
  { path: 'book/:tripId', component: BookingComponent, canActivate: [AuthGuard] },
  { path: 'history', component: HistoryComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [AdminGuard] },
];

@NgModule({
  declarations: [AppComponent, SearchComponent, BookingComponent, HistoryComponent, LoginComponent, AdminComponent, AdminLoginComponent],
  imports: [BrowserModule, FormsModule, HttpClientModule, RouterModule.forRoot(routes, { useHash: true })],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent],
})
export class AppModule {}

