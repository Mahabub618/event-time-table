import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { MockDataService } from './mock-data.service';

export interface Day {
    date: Date;
    label: string;
}

@Injectable({
    providedIn: 'root'
})
export class EventDataService {

    constructor(private mockDataService: MockDataService) {
    }

    getDays(startDate: Date, count: number = 7): Observable<Day[]> {
        const days: Day[] = [];

        for (let i = 0; i < count; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const label = date.toLocaleDateString('en-US', { weekday: 'long' });
            days.push({ date, label });
        }

        return of(days).pipe(delay(500));
    }

    getTimeSlots(): Observable<string[]> {
        const timeSlots: string[] = [];
        for (let i = 0; i < 96; i++) {
            const hour = Math.floor(i / 4);
            const min = (i % 4) * 15;
            const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
            timeSlots.push(time);
        }
        return of(timeSlots).pipe(delay(500));
    }

    getVenues(startIndex: number, limit: number): Observable<string[]> {
        const allVenues = this.mockDataService.getAllVenues();
        const venues = allVenues.slice(startIndex, startIndex + limit);
        return of(venues).pipe(delay(500));
    }

    getEvents(date: Date, venues?: string[]): Observable<any[]> {
        let events = this.mockDataService.getEventsForDate(date);

        if (venues && venues.length > 0) {
            events = events.filter(e => venues.includes(e.venue));
        }
        return of(events).pipe(delay(600));
    }
}
