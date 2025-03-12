// Import required modules
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const schedule = require('node-schedule');
const dotenv = require('dotenv');
const { bookSlot } = require('./selenium');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Store for scheduled jobs
const scheduledJobs = {};

// Path to bookings.json
const bookingsFilePath = path.join(__dirname, 'bookings.json');

// Helper function to read bookings from file
async function readBookings() {
  try {
    const data = await fs.readFile(bookingsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is invalid, return empty array
    return [];
  }
}

// Helper function to write bookings to file
async function writeBookings(bookings) {
  await fs.writeFile(bookingsFilePath, JSON.stringify(bookings, null, 2), 'utf8');
}

// Calculate trigger time (24 hours before slot time)
function calculateTriggerTime(date, time) {
  const [hours, minutes] = time.split(':').map(Number);
  const triggerDate = new Date(date);
  triggerDate.setHours(hours, minutes, 0, 0);
  triggerDate.setDate(triggerDate.getDate() - 1); // 24 hours before
  return triggerDate;
}

// Schedule a booking job
function scheduleBookingJob(booking) {
  const triggerTime = calculateTriggerTime(booking.date, booking.time);
  
  // Don't schedule if the trigger time is in the past
  if (triggerTime <= new Date()) {
    console.log(`Trigger time for booking ${booking.id} is in the past, not scheduling`);
    return;
  }
  
  console.log(`Scheduling booking ${booking.id} for ${booking.facility} at ${booking.time} on ${booking.date} to trigger at ${triggerTime}`);
  
  // Schedule the job
  const job = schedule.scheduleJob(triggerTime, async function() {
    try {
      console.log(`Executing booking ${booking.id} for ${booking.facility} at ${booking.time} on ${booking.date}`);
      
      // Attempt to book the slot
      const success = await bookSlot(booking);
      
      // Update booking status
      const bookings = await readBookings();
      const index = bookings.findIndex(b => b.id === booking.id);
      
      if (index !== -1) {
        bookings[index].status = success ? 'confirmed' : 'failed';
        await writeBookings(bookings);
      }
      
      console.log(`Booking ${booking.id} ${success ? 'confirmed' : 'failed'}`);
    } catch (error) {
      console.error(`Error executing booking ${booking.id}:`, error);
    }
  });
  
  // Store the job reference
  scheduledJobs[booking.id] = job;
  
  return job;
}

// API Routes
// Get all bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await readBookings();
    res.json(bookings);
  } catch (error) {
    console.error('Error getting bookings:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// Create a new booking
app.post('/api/bookings', async (req, res) => {
  try {
    const booking = req.body;
    
    // Validate booking
    if (!booking.facility || !booking.date || !booking.time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Read existing bookings
    const bookings = await readBookings();
    
    // Add new booking
    bookings.push(booking);
    
    // Save bookings
    await writeBookings(bookings);
    
    // Schedule the booking job
    scheduleBookingJob(booking);
    
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Update a booking
app.put('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBooking = req.body;
    
    // Read existing bookings
    const bookings = await readBookings();
    
    // Find booking index
    const index = bookings.findIndex(booking => booking.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Cancel existing scheduled job
    if (scheduledJobs[id]) {
      scheduledJobs[id].cancel();
      delete scheduledJobs[id];
    }
    
    // Update booking
    bookings[index] = { ...bookings[index], ...updatedBooking };
    
    // Save bookings
    await writeBookings(bookings);
    
    // Schedule new job
    scheduleBookingJob(bookings[index]);
    
    res.json(bookings[index]);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Serve the frontend for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  // Schedule existing bookings on startup
  readBookings().then(bookings => {
    bookings.forEach(booking => {
      if (booking.status === 'pending') {
        scheduleBookingJob(booking);
      }
    });
  }).catch(error => {
    console.error('Error loading bookings on startup:', error);
  });
});
