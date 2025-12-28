import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
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
  @ViewChild('dateScrollContainer') dateScrollContainer!: ElementRef;
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

  selectedDate: Date = new Date('2024-12-01');
  isLoadingDays = false;

  // For infinite scroll of days
  private readonly DAY_BATCH_SIZE = 14;
  private readonly SCROLL_THRESHOLD = 100;

  constructor(private eventDataService: EventDataService) { }

  ngOnInit(): void {
    this.initializeDays();
    this.fetchTimeSlots();
    this.loadVenues();
  }

  ngAfterViewInit() {
    // Center the selected date if possible, or just ensure it's visible
  }

  initializeDays() {
    // Load some past days and some future days.
    // Let's start 7 days before selectedDate
    const startDate = new Date(this.selectedDate);
    startDate.setDate(startDate.getDate() - 7);

    this.isLoadingDays = true;
    this.eventDataService.getDays(startDate, this.DAY_BATCH_SIZE).subscribe(data => {
      this.days = data;
      this.isLoadingDays = false;
      // After view updates, we might want to scroll to the selected date
      setTimeout(() => this.scrollToSelectedDate(), 0);
    });
  }

  scrollToSelectedDate() {
    if (!this.dateScrollContainer) return;
    const container = this.dateScrollContainer.nativeElement;
    // Simple logic: find the index of selected date and scroll there
    // This assumes each day item has a fixed width or we can find the element
    // For now, let's just scroll to center roughly if we can't find the element easily without more DOM queries
    // Better: find the element in the list.
    // We can use a data attribute on the day elements.
    const selectedEl = container.querySelector('.date-item.selected');
    if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
    }
  }

  onDateScroll(event: any) {
    const element = event.target;
    if (this.isLoadingDays) return;

    if (element.scrollLeft < this.SCROLL_THRESHOLD) {
      this.loadPreviousDays();
    } else if (element.scrollWidth - element.scrollLeft - element.clientWidth < this.SCROLL_THRESHOLD) {
      this.loadNextDays();
    }
  }

  loadPreviousDays() {
    if (this.days.length === 0) return;
    this.isLoadingDays = true;
    const firstDay = this.days[0].date;
    const newStartDate = new Date(firstDay);
    newStartDate.setDate(newStartDate.getDate() - this.DAY_BATCH_SIZE);

    this.eventDataService.getDays(newStartDate, this.DAY_BATCH_SIZE).subscribe(newDays => {
      const oldScrollWidth = this.dateScrollContainer.nativeElement.scrollWidth;
      const oldScrollLeft = this.dateScrollContainer.nativeElement.scrollLeft;

      this.days = [...newDays, ...this.days];
      this.isLoadingDays = false;

      // Adjust scroll position to maintain visual stability
      setTimeout(() => {
        const newScrollWidth = this.dateScrollContainer.nativeElement.scrollWidth;
        this.dateScrollContainer.nativeElement.scrollLeft = oldScrollLeft + (newScrollWidth - oldScrollWidth);
      }, 0);
    });
  }

  loadNextDays() {
    if (this.days.length === 0) return;
    this.isLoadingDays = true;
    const lastDay = this.days[this.days.length - 1].date;
    const newStartDate = new Date(lastDay);
    newStartDate.setDate(newStartDate.getDate() + 1);

    this.eventDataService.getDays(newStartDate, this.DAY_BATCH_SIZE).subscribe(newDays => {
      this.days = [...this.days, ...newDays];
      this.isLoadingDays = false;
    });
  }

  selectDate(day: Day) {
    this.selectedDate = day.date;
    // Here we would reload events for the selected date if the view depends on it
    // Currently the view seems to show venues and events.
    // If events are date-specific, we should filter or fetch them here.
    // The current implementation of getEventsForVenue doesn't seem to filter by date in the component,
    // but usually it should. Assuming events are loaded for the view.
    // For this task, I'll just update the selectedDate.
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
