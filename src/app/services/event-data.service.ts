import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Day {
    date: Date;
    label: string;
}

@Injectable({
    providedIn: 'root'
})
export class EventDataService {

    private allEvents: any[] = [];
    private allVenues: string[] = [];

    constructor() {
        this.generateMockData();
    }

    private generateMockData() {
        // Generate 15-20 venues
        for (let i = 1; i <= 20; i++) {
            this.allVenues.push(`Venue ${i}`);
        }

        // Generate 30 events distributed among venues
        for (let i = 1; i <= 30; i++) {
            const venueIndex = (i - 1) % this.allVenues.length; // Distribute events round-robin or random
            const venue = this.allVenues[venueIndex];

            // Simple logic to vary times
            const startHour = 8 + (i % 10); // 8am to 5pm
            const startTime = `${startHour.toString().padStart(2, '0')}:00`;
            const endTime = `${(startHour + 1).toString().padStart(2, '0')}:00`;

            this.allEvents.push({
                id: i.toString(),
                title: `Event ${i}`,
                startTime: startTime,
                endTime: endTime,
                venue: venue,
                description: `${startTime} - ${endTime}`
            });
        }
    }

    getDays(startDate: Date): Observable<Day[]> {
        const days: Day[] = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const label = date.toLocaleDateString('en-US', { weekday: 'long' });
            days.push({ date, label });
        }

        // Simulate API delay
        return of(days).pipe(delay(500));
    }

    getTimeSlots(): Observable<string[]> {
        const timeSlots: string[] = [];
        for (let i = 0; i < 96; i++) { // 24 hours * 4 slots/hour = 96 slots
            const hour = Math.floor(i / 4);
            const min = (i % 4) * 15;
            const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
            timeSlots.push(time);
        }
        return of(timeSlots).pipe(delay(500));
    }

    getVenues(startIndex: number, limit: number): Observable<string[]> {
        const venues = this.allVenues.slice(startIndex, startIndex + limit);
        return of(venues).pipe(delay(500));
    }

    getEvents(venues?: string[]): Observable<any[]> {
        let events = this.allEvents;
        if (venues && venues.length > 0) {
            events = this.allEvents.filter(e => venues.includes(e.venue));
        }
        return of(events).pipe(delay(600));
    }
}
