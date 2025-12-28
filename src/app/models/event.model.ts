export interface CalendarEvent {
    id: string;
    title: string;
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    venue: string;
    description?: string;
}
