import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { SearchComponent } from './search/search.component';
import { BookingComponent } from './booking/booking.component';
import { HistoryComponent } from './history/history.component';

const routes: Routes = [
  { path: '', component: SearchComponent },
  { path: 'book/:tripId', component: BookingComponent },
  { path: 'history', component: HistoryComponent },
];

@NgModule({
  declarations: [AppComponent, SearchComponent, BookingComponent, HistoryComponent],
  imports: [BrowserModule, FormsModule, HttpClientModule, RouterModule.forRoot(routes, { useHash: true })],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

