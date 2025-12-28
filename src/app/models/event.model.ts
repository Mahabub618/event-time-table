export interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    startTime: string;
    endTime: string;
    venue: string;
    span?: number;
    isMultiVenue?: boolean;
    description?: string;
}
