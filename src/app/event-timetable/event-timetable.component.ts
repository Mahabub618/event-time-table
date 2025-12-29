import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, NgZone, OnDestroy } from '@angular/core';
import { CalendarEvent } from '../models/event.model';
import { EventDataService, Day } from '../services/event-data.service';
import { Subject, fromEvent } from 'rxjs';
import { auditTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-event-timetable',
  templateUrl: './event-timetable.component.html',
  styleUrls: ['./event-timetable.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventTimetableComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dateScrollContainer') dateScrollContainer!: ElementRef;
  @ViewChild('scheduleViewport') scheduleViewport!: ElementRef;

  days: Day[] = [];
  venues: string[] = [];

  allTimeSlots: string[] = [];

  venueStartIndex = 0;
  venueLimit = 5;
  isLoadingVenues = false;
  isAllVenuesLoaded = false;

  events: CalendarEvent[] = [];
  eventsByVenue: { [venue: string]: CalendarEvent[] } = {};

  selectedDate: Date = new Date();
  isLoadingDays = false;

  private readonly DAY_BATCH_SIZE = 14;
  private readonly SCROLL_THRESHOLD = 100;
  private destroy$ = new Subject<void>();

  constructor(
      private eventDataService: EventDataService,
      private cdr: ChangeDetectorRef,
      private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    this.initializeDays();
    this.fetchTimeSlots();
    this.loadVenues();
  }

  ngAfterViewInit() {
    this.setupScrollListeners();
  }

  setupScrollListeners() {
    this.ngZone.runOutsideAngular(() => {
      if (this.dateScrollContainer) {
        fromEvent(this.dateScrollContainer.nativeElement, 'scroll').pipe(
                auditTime(50),
                takeUntil(this.destroy$)
            ).subscribe((event: any) => {
              this.handleDateScroll(event.target);
            });
      }

      if (this.scheduleViewport) {
        fromEvent(this.scheduleViewport.nativeElement, 'scroll').pipe(
                auditTime(50),
                takeUntil(this.destroy$)
            ).subscribe((event: any) => {
              this.handleScheduleScroll(event.target);
            });
      }
    });
  }

  initializeDays() {
    const startDate = new Date(this.selectedDate);
    startDate.setDate(startDate.getDate() - 7);

    this.isLoadingDays = true;
    this.eventDataService.getDays(startDate, this.DAY_BATCH_SIZE)
        .pipe(takeUntil(this.destroy$))
        .subscribe(data => {
          this.days = data;
          this.isLoadingDays = false;
          this.cdr.markForCheck();
          setTimeout(() => this.scrollToSelectedDate(), 0);
        });
  }

  scrollToSelectedDate() {
    if (!this.dateScrollContainer) return;
    const container = this.dateScrollContainer.nativeElement;
    const selectedEl = container.querySelector('.date-item.selected');
    if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
    }
  }

  onDateWheel(event: WheelEvent) {
    if (this.dateScrollContainer) {
      event.preventDefault();
      this.dateScrollContainer.nativeElement.scrollLeft += (event.deltaX - event.deltaY);
    }
  }

  handleDateScroll(element: any) {
    if (this.isLoadingDays) return;

    if (element.scrollLeft < this.SCROLL_THRESHOLD) {
      this.ngZone.run(() => this.loadPreviousDays());
    } else if (element.scrollWidth - element.scrollLeft - element.clientWidth < this.SCROLL_THRESHOLD) {
      this.ngZone.run(() => this.loadNextDays());
    }
  }

  loadPreviousDays() {
    if (this.days.length === 0) return;
    this.isLoadingDays = true;
    this.cdr.markForCheck();

    const firstDay = this.days[0].date;
    const newStartDate = new Date(firstDay);
    newStartDate.setDate(newStartDate.getDate() - this.DAY_BATCH_SIZE);

    this.eventDataService.getDays(newStartDate, this.DAY_BATCH_SIZE)
        .pipe(takeUntil(this.destroy$))
        .subscribe(newDays => {
          const oldScrollWidth = this.dateScrollContainer.nativeElement.scrollWidth;
          const oldScrollLeft = this.dateScrollContainer.nativeElement.scrollLeft;

          this.days = [...newDays, ...this.days];
          this.isLoadingDays = false;
          this.cdr.markForCheck();

          setTimeout(() => {
            const newScrollWidth = this.dateScrollContainer.nativeElement.scrollWidth;
            this.dateScrollContainer.nativeElement.scrollLeft = oldScrollLeft + (newScrollWidth - oldScrollWidth);
          }, 0);
        });
  }

  loadNextDays() {
    if (this.days.length === 0) return;
    this.isLoadingDays = true;
    this.cdr.markForCheck();

    const lastDay = this.days[this.days.length - 1].date;
    const newStartDate = new Date(lastDay);
    newStartDate.setDate(newStartDate.getDate() + 1);

    this.eventDataService.getDays(newStartDate, this.DAY_BATCH_SIZE)
        .pipe(takeUntil(this.destroy$))
        .subscribe(newDays => {
          this.days = [...this.days, ...newDays];
          this.isLoadingDays = false;
          this.cdr.markForCheck();
        });
  }

  selectDate(day: Day) {
    this.selectedDate = day.date;
    this.reloadEvents();
    this.cdr.markForCheck();
  }

  reloadEvents() {
    this.events = [];
    this.eventsByVenue = {};
    if (this.venues.length > 0) {
        this.fetchEventsForVenues(this.venues);
    }
  }

  fetchTimeSlots() {
    this.eventDataService.getTimeSlots()
        .pipe(takeUntil(this.destroy$))
        .subscribe(data => {
          this.allTimeSlots = data;
          this.cdr.markForCheck();
        });
  }

  loadVenues() {
    if (this.isLoadingVenues || this.isAllVenuesLoaded) return;

    this.isLoadingVenues = true;
    this.cdr.markForCheck();

    this.eventDataService.getVenues(this.venueStartIndex, this.venueLimit)
        .pipe(takeUntil(this.destroy$))
        .subscribe(newVenues => {
          if (newVenues.length === 0) {
            this.isAllVenuesLoaded = true;
            this.isLoadingVenues = false;
            this.cdr.markForCheck();
            return;
          }

          this.venues = [...this.venues, ...newVenues];
          this.venueStartIndex += newVenues.length;
          this.isLoadingVenues = false;

          newVenues.forEach(v => {
              if (!this.eventsByVenue[v]) this.eventsByVenue[v] = [];
          });

          this.fetchEventsForVenues(newVenues);
          this.cdr.markForCheck();
        });
  }

  fetchEventsForVenues(venues: string[]) {
    this.eventDataService.getEvents(this.selectedDate, venues)
        .pipe(takeUntil(this.destroy$))
        .subscribe(newEvents => {
          this.events = [...this.events, ...newEvents];
          this.updateEventsByVenue(newEvents);
          this.cdr.markForCheck();
        });
  }

  updateEventsByVenue(newEvents: CalendarEvent[]) {
      newEvents.forEach(event => {
          if (!this.eventsByVenue[event.venue]) {
              this.eventsByVenue[event.venue] = [];
          }
          this.eventsByVenue[event.venue].push(event);
      });
  }

  handleScheduleScroll(element: any) {
    if (element.scrollWidth - element.scrollLeft - element.clientWidth < 100) {
      this.ngZone.run(() => this.loadVenues());
    }
  }

  trackByDay(index: number, day: Day): string {
      return day.date.toISOString();
  }

  trackByVenue(index: number, venue: string): string {
      return venue;
  }

  trackByTime(index: number, time: string): string {
      return time;
  }

  trackByEvent(index: number, event: CalendarEvent): string {
      return event.id || index.toString();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
