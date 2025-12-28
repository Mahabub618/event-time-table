import { Pipe, PipeTransform } from '@angular/core';
import { CalendarEvent } from '../../models/event.model';

@Pipe({
  name: 'eventStyle',
  pure: true
})
export class EventStylePipe implements PipeTransform {

  transform(event: CalendarEvent, firstVisibleSlot: string): { [key: string]: string | number } {
    if (!event) {
      return {};
    }

    // Default to '08:00' if firstVisibleSlot is not provided
    const baseSlot = firstVisibleSlot || '08:00';

    const startMinutes = this.parseTimeToMinutes(event.startTime);
    const endMinutes = this.parseTimeToMinutes(event.endTime);
    const duration = endMinutes - startMinutes;

    const baseStartMinutes = this.parseTimeToMinutes(baseSlot);

    const offsetMinutes = startMinutes - baseStartMinutes;

    const pxPerMinute = 60 / 15;

    const span = event.span || 1;
    // Width calculation: 100% per column
    const width = `${span * 100}%`;

    return {
      'top': `${offsetMinutes * pxPerMinute}px`,
      'height': `${duration * pxPerMinute}px`,
      'width': width,
      'z-index': span > 1 ? 20 : 10
    };
  }

  private parseTimeToMinutes(time: string): number {
    const parts = time.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
}

