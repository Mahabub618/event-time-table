import { Injectable } from '@angular/core';
import { CalendarEvent } from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private eventsCache = new Map<string, CalendarEvent[]>();
  private allVenues: string[] = [];

  constructor() {
    this.generateVenues();
  }

  private generateVenues() {
    for (let i = 1; i <= 20; i++) {
      this.allVenues.push(`Venue ${i}`);
    }
  }

  getAllVenues() { return this.allVenues; }

  getEventsForDate(date: Date): CalendarEvent[] {
      const dateKey = date.toDateString();
      if (!this.eventsCache.has(dateKey)) {
          this.generateEventsForDate(date);
      }
      return this.eventsCache.get(dateKey) || [];
  }

  private generateEventsForDate(date: Date) {
      const events: CalendarEvent[] = [];
      const eventsCount = 8 + Math.floor(Math.random() * 5); // 8-12 events
      let eventsGenerated = 0;
      let attempts = 0;

      const venueSchedule = new Map<string, {start: number, end: number}[]>();
      this.allVenues.forEach(v => venueSchedule.set(v, []));

      while (eventsGenerated < eventsCount && attempts < 100) {
        attempts++;

        // Random start time 08:00 - 18:00
        const startHour = 8 + Math.floor(Math.random() * 10);
        const startMin = Math.random() > 0.5 ? 0 : 30;
        const startTotalMinutes = startHour * 60 + startMin;

        const durations = [30, 60, 90, 120];
        const duration = durations[Math.floor(Math.random() * durations.length)];
        const endTotalMinutes = startTotalMinutes + duration;

        const maxSpan = 3;
        const span = Math.floor(Math.random() * maxSpan) + 1; // 1 to 3 venues

        let selectedStartVenueIndex = -1;
        const startVenueAttempts = 10;

        for(let k=0; k<startVenueAttempts; k++) {
            const tryIndex = Math.floor(Math.random() * (this.allVenues.length - span + 1));
            let isFree = true;
            for(let s=0; s<span; s++) {
                const venueName = this.allVenues[tryIndex + s];
                if (!this.isVenueFree(venueSchedule, venueName, startTotalMinutes, endTotalMinutes)) {
                    isFree = false;
                    break;
                }
            }

            if (isFree) {
                selectedStartVenueIndex = tryIndex;
                break;
            }
        }

        if (selectedStartVenueIndex === -1) continue;

        const eventId = `${date.getTime()}_${eventsGenerated}`;
        const title = `Event ${eventsGenerated + 1}`;
        const startTime = this.minutesToTime(startTotalMinutes);
        const endTime = this.minutesToTime(endTotalMinutes);
        const isMulti = span > 1;
        const startVenue = this.allVenues[selectedStartVenueIndex];

        events.push({
            id: eventId,
            title: title,
            date: new Date(date),
            startTime: startTime,
            endTime: endTime,
            venue: startVenue,
            span: span,
            isMultiVenue: isMulti,
            description: `${startTime} - ${endTime}`
        });

        for(let s=0; s<span; s++) {
            const venueName = this.allVenues[selectedStartVenueIndex + s];
            venueSchedule.get(venueName)?.push({start: startTotalMinutes, end: endTotalMinutes});
        }

        eventsGenerated++;
      }

      this.eventsCache.set(date.toDateString(), events);
  }

  private isVenueFree(schedule: Map<string, {start: number, end: number}[]>, venue: string, start: number, end: number): boolean {
      const slots = schedule.get(venue) || [];
      return !slots.some(slot =>
          (start < slot.end && end > slot.start)
      );
  }

  private minutesToTime(minutes: number): string {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
}
