import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { CalendarEvent } from '../models/event.model';
import { EventDataService, Day } from '../services/event-data.service';

@Component({
  selector: 'app-event-timetable',
  templateUrl: './event-timetable.component.html',
  styleUrls: ['./event-timetable.component.scss'],
  animations: [
    trigger('slideInOut', [
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX({{leaveTo}}%)', opacity: 0 }))
      ], { params: { leaveTo: '-100' } }),
      transition(':enter', [
        style({ transform: 'translateX({{enterFrom}}%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0%)', opacity: 1 }))
      ], { params: { enterFrom: '100' } })
    ])
  ]
})
export class EventTimetableComponent implements OnInit, AfterViewInit {
  @ViewChild('tabGroup', { read: ElementRef }) tabGroupRef!: ElementRef;
  @ViewChild('scheduleViewport') scheduleViewport!: ElementRef;

  days: Day[] = [];
  venues: string[] = [];

  allTimeSlots: string[] = [];

  venueStartIndex = 0;
  venueLimit = 5;
  totalVenuesLoaded = 0;
  isLoadingVenues = false;
  isAllVenuesLoaded = false;

  events: CalendarEvent[] = [];

  currentStartDate = new Date('2024-12-01');
  isLoading = false;
  direction: 'next' | 'prev' = 'next';

  constructor(private eventDataService: EventDataService) { }

  ngOnInit(): void {
    this.fetchDays();
    this.fetchTimeSlots();
    this.loadVenues();
  }

  ngAfterViewInit() {
  }

  fetchDays() {
    this.eventDataService.getDays(this.currentStartDate).subscribe(data => {
      this.days = data;
      this.isLoading = false;
    });
  }

  loadNextWeek() {
    this.direction = 'next';
    this.isLoading = true;
    this.currentStartDate.setDate(this.currentStartDate.getDate() + 7);
    this.currentStartDate = new Date(this.currentStartDate);
    this.fetchDays();
  }

  loadPreviousWeek() {
    this.direction = 'prev';
    this.isLoading = true;
    this.currentStartDate.setDate(this.currentStartDate.getDate() - 7);
    this.currentStartDate = new Date(this.currentStartDate);
    this.fetchDays();
  }

  fetchTimeSlots() {
    this.eventDataService.getTimeSlots().subscribe(data => {
      this.allTimeSlots = data;
    });
  }

  loadVenues() {
    if (this.isLoadingVenues || this.isAllVenuesLoaded) return;

    this.isLoadingVenues = true;
    this.eventDataService.getVenues(this.venueStartIndex, this.venueLimit).subscribe(newVenues => {
      if (newVenues.length === 0) {
        this.isAllVenuesLoaded = true;
        this.isLoadingVenues = false;
        return;
      }

      this.venues = [...this.venues, ...newVenues];
      this.venueStartIndex += newVenues.length;
      this.isLoadingVenues = false;

      this.fetchEventsForVenues(newVenues);
    });
  }

  fetchEventsForVenues(venues: string[]) {
    this.eventDataService.getEvents(venues).subscribe(newEvents => {
      this.events = [...this.events, ...newEvents];
    });
  }

  onScroll(event: any) {
    const element = event.target;
    if (element.scrollWidth - element.scrollLeft - element.clientWidth < 100) {
      this.loadVenues();
    }
  }

  fetchEvents() {
  }


  getEventsForVenue(venue: string): CalendarEvent[] {
    return this.events.filter(e => e.venue === venue);
  }

  getEventStyle(event: CalendarEvent): any {
    const startMinutes = this.parseTimeToMinutes(event.startTime);
    const endMinutes = this.parseTimeToMinutes(event.endTime);
    const duration = endMinutes - startMinutes;

    const firstVisibleSlot = this.allTimeSlots.length > 0 ? this.allTimeSlots[0] : '08:00';
    const baseStartMinutes = this.parseTimeToMinutes(firstVisibleSlot);

    const offsetMinutes = startMinutes - baseStartMinutes;

    const pxPerMinute = 60 / 15;

    return {
      top: `${offsetMinutes * pxPerMinute}px`,
      height: `${duration * pxPerMinute}px`
    };
  }

  parseTimeToMinutes(time: string): number {
    const parts = time.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
}
