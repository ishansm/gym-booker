# Automated Slot Booker

A web-based tool to automate booking Sports Facilities slots (Gym and Swimming Pool) on the FLAME University portal.

## Features

- Schedule bookings for Gym and Swimming Pool slots up to a month in advance
- Book slots one at a time or in bulk (e.g., every Monday)
- Edit bulk bookings if plans change
- Automatic booking exactly 24 hours before the desired time
- Notifications for successful bookings

## Setup

1. Install Node.js and npm
2. Install dependencies: `npm install`
3. Create a `.env` file with your credentials:
   ```
   USERNAME=your_username
   PASSWORD=your_password
   ```
4. Start the application: `npm start`
5. Open your browser and navigate to `http://localhost:3000`

## Project Structure

- `public/`: Frontend files
- `src/`: Backend Node.js files
- `src/bookings.json`: Saved bookings data

## Technologies

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Automation: Selenium WebDriver
- Scheduling: node-schedule
