import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EventTimetableComponent } from './event-timetable/event-timetable.component';

const routes: Routes = [
  { path: '', component: EventTimetableComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
