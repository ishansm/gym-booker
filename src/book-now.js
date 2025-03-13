#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const readline = require('readline');

// Path to bookings file
const BOOKINGS_FILE = path.join(__dirname, 'bookings.json');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user
const prompt = (question) => new Promise((resolve) => {
  rl.question(question, resolve);
});

// Function to validate date format (YYYY-MM-DD)
function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

// Function to validate time format (HH:MM)
function isValidTime(timeString) {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(timeString);
}

// Main function
async function main() {
  try {
    console.log('===== IMMEDIATE SLOT BOOKING =====');
    console.log('This tool will add a booking to be processed immediately.\n');
    
    // Get facility type
    const facilityType = await prompt('Enter facility type (gym/swimming): ');
    if (!['gym', 'swimming'].includes(facilityType.toLowerCase())) {
      console.error('Error: Facility type must be either "gym" or "swimming"');
      return;
    }
    
    // Get date
    const date = await prompt('Enter date (YYYY-MM-DD): ');
    if (!isValidDate(date)) {
      console.error('Error: Invalid date format. Please use YYYY-MM-DD');
      return;
    }
    
    // Get time
    const time = await prompt('Enter time (HH:MM in 24-hour format): ');
    if (!isValidTime(time)) {
      console.error('Error: Invalid time format. Please use HH:MM in 24-hour format');
      return;
    }
    
    // Get description
    const description = await prompt('Enter a description (optional): ');
    
    // Create booking object
    const booking = {
      id: `booking-${uuidv4().substring(0, 8)}`,
      facility: facilityType.toLowerCase(),
      date,
      time,
      status: 'pending',
      immediate: true,
      description: description || `${facilityType} session on ${date} at ${time}`
    };
    
    // Read existing bookings
    let bookings = [];
    try {
      const data = await fs.readFile(BOOKINGS_FILE, 'utf8');
      bookings = JSON.parse(data);
    } catch (error) {
      console.log('No existing bookings file found. Creating a new one.');
    }
    
    // Add new booking
    bookings.push(booking);
    
    // Save bookings to file
    await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
    
    console.log('\nBooking added successfully!');
    console.log(`ID: ${booking.id}`);
    console.log(`Facility: ${booking.facility}`);
    console.log(`Date: ${booking.date}`);
    console.log(`Time: ${booking.time}`);
    console.log(`Description: ${booking.description}`);
    console.log('\nThis booking will be processed immediately when the script runs.');
    
    // Run the booking script immediately
    console.log('\nWould you like to run the booking script now? (y/n)');
    const runNow = await prompt('> ');
    
    if (runNow.toLowerCase() === 'y' || runNow.toLowerCase() === 'yes') {
      console.log('\nRunning booking script...');
      const { processBookings } = require('./selenium');
      await processBookings();
      console.log('Booking process completed!');
    } else {
      console.log('\nBooking will be processed the next time the script runs.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run the main function
main();
