# Event Time Table

An interactive event timetable application built with Angular 16 and Angular Material. This application allows users to view event schedules across multiple venues and dates with a smooth, responsive interface.

## 🚀 Live Demo

Check out the live application here: [https://event-time-table-delta.vercel.app/](https://event-time-table-delta.vercel.app/)

## ✨ Features

- **Dynamic Timetable**: View events organized by time slots and venues.
- **Date Navigation**: Scroll through dates to see past and upcoming events.
- **Venue Management**: Horizontal scrolling for venues to handle large numbers of locations.
- **Responsive Design**: Built with Angular Material for a consistent look and feel.
- **Smooth Animations**: Transitions for date changes and interactions.

## 🛠️ Tech Stack

- **Framework**: [Angular 16](https://angular.io/)
- **UI Component Library**: [Angular Material](https://material.angular.io/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: SCSS
- **Animations**: Angular Animations

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/event-time-table.git
   cd event-time-table
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   ng serve
   ```
   Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## 🔨 Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## 📂 Project Structure

```
src/
  app/
    event-timetable/    # Main component for the timetable view
    models/             # TypeScript interfaces (Event, Day, etc.)
    services/           # Data services (EventDataService)
```
