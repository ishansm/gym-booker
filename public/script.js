// Constants for time slots based on facility
const TIME_SLOTS = {
  'gym-evening': [
    { time: '15:00', label: '3:00 PM' },
    { time: '16:00', label: '4:00 PM' },
    { time: '17:00', label: '5:00 PM' },
    { time: '18:00', label: '6:00 PM' },
    { time: '19:00', label: '7:00 PM' },
    { time: '20:00', label: '8:00 PM' },
    { time: '21:00', label: '9:00 PM' },
    { time: '22:00', label: '10:00 PM' }
  ],
  'gym-morning': [
    { time: '06:30', label: '6:30 AM' },
    { time: '07:30', label: '7:30 AM' },
    { time: '08:30', label: '8:30 AM' },
    { time: '09:30', label: '9:30 AM' },
    { time: '10:30', label: '10:30 AM' },
    { time: '12:30', label: '12:30 PM' },
    { time: '13:30', label: '1:30 PM' },
    { time: '14:30', label: '2:30 PM' }
  ],
  'swimming': [
    { time: '07:00', label: '7:00 AM' },
    { time: '08:00', label: '8:00 AM' },
    { time: '09:00', label: '9:00 AM' },
    { time: '10:00', label: '10:00 AM' },
    { time: '15:00', label: '3:00 PM' },
    { time: '16:00', label: '4:00 PM' },
    { time: '17:00', label: '5:00 PM' },
    { time: '18:00', label: '6:00 PM' },
    { time: '19:00', label: '7:00 PM' },
    { time: '20:00', label: '8:00 PM' }
  ]
};

// Facility display names
const FACILITY_NAMES = {
  'gym-evening': 'Gym (Evening)',
  'gym-morning': 'Gym (Morning)',
  'swimming': 'Swimming Pool'
};

// Store bookings
let bookings = [];

// DOM elements
document.addEventListener('DOMContentLoaded', () => {
  // Tab switching
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const tabId = tab.dataset.tab;
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
  
  // Facility selection
  const facilityBtns = document.querySelectorAll('.facility-btn');
  
  facilityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Find all facility buttons in the same toggle group
      const toggleGroup = btn.closest('.facility-toggle');
      toggleGroup.querySelectorAll('.facility-btn').forEach(b => {
        b.classList.remove('active');
      });
      
      // Add active class to clicked button
      btn.classList.add('active');
      
      // Update time slots based on selected facility
      const facility = btn.dataset.facility;
      updateTimeSlots(facility);
      updateBulkTimeSlots(facility);
    });
  });
  
  // Weekday selection
  const weekdayBtns = document.querySelectorAll('.weekday-btn');
  
  weekdayBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
    });
  });
  
  // Set min date for date inputs to today
  const today = new Date();
  const todayStr = formatDateForInput(today);
  
  document.getElementById('booking-date').min = todayStr;
  document.getElementById('start-date').min = todayStr;
  document.getElementById('end-date').min = todayStr;
  
  // Form submissions
  const singleBookingForm = document.getElementById('single-booking-form');
  const bulkBookingForm = document.getElementById('bulk-booking-form');
  
  singleBookingForm.addEventListener('submit', handleSingleBooking);
  bulkBookingForm.addEventListener('submit', handleBulkBooking);
  
  // Close notification
  document.getElementById('notification-close').addEventListener('click', () => {
    document.getElementById('notification').classList.remove('show');
  });
  
  // Load bookings from localStorage
  loadBookings();
  
  // Initialize time slots for default facility
  updateTimeSlots('gym-evening');
  updateBulkTimeSlots('gym-evening');
});

// Update time slots based on selected facility
function updateTimeSlots(facility) {
  const timeSlotsContainer = document.getElementById('time-slots');
  const bookingDate = document.getElementById('booking-date').value;
  
  // Clear existing time slots
  timeSlotsContainer.innerHTML = '';
  
  if (!bookingDate) {
    timeSlotsContainer.innerHTML = '<div class="time-slot-message">Please select a date first</div>';
    return;
  }
  
  // Get time slots for selected facility
  const slots = TIME_SLOTS[facility];
  
  // Create time slot buttons
  slots.forEach(slot => {
    const timeSlot = document.createElement('button');
    timeSlot.type = 'button';
    timeSlot.className = 'time-slot';
    timeSlot.dataset.time = slot.time;
    timeSlot.textContent = slot.label;
    
    // Check if slot is already booked
    const isBooked = isSlotBooked(facility, bookingDate, slot.time);
    if (isBooked) {
      timeSlot.classList.add('disabled');
      timeSlot.disabled = true;
    } else {
      timeSlot.addEventListener('click', () => {
        // Remove active class from all time slots
        document.querySelectorAll('.time-slot').forEach(ts => {
          ts.classList.remove('active');
        });
        
        // Add active class to clicked time slot
        timeSlot.classList.add('active');
      });
    }
    
    timeSlotsContainer.appendChild(timeSlot);
  });
}

// Update bulk booking time slots
function updateBulkTimeSlots(facility) {
  const bulkTimeSlotsContainer = document.getElementById('bulk-time-slots');
  
  // Clear existing time slots
  bulkTimeSlotsContainer.innerHTML = '';
  
  // Get time slots for selected facility
  const slots = TIME_SLOTS[facility];
  
  if (!slots || slots.length === 0) {
    bulkTimeSlotsContainer.innerHTML = '<div class="time-slot-message">No time slots available for this facility</div>';
    return;
  }
  
  // Create time slot buttons
  slots.forEach(slot => {
    const timeSlot = document.createElement('button');
    timeSlot.type = 'button';
    timeSlot.className = 'time-slot';
    timeSlot.dataset.time = slot.time;
    timeSlot.textContent = slot.label;
    
    timeSlot.addEventListener('click', () => {
      // Remove active class from all time slots in this container
      bulkTimeSlotsContainer.querySelectorAll('.time-slot').forEach(ts => {
        ts.classList.remove('active');
      });
      
      // Add active class to clicked time slot
      timeSlot.classList.add('active');
    });
    
    bulkTimeSlotsContainer.appendChild(timeSlot);
  });
}

// Handle single booking form submission
function handleSingleBooking(event) {
  event.preventDefault();
  
  // Get form values
  const facilityBtn = document.querySelector('#single-booking-form .facility-btn.active');
  const facility = facilityBtn.dataset.facility;
  const bookingDate = document.getElementById('booking-date').value;
  const timeSlot = document.querySelector('.time-slot.active');
  
  if (!timeSlot) {
    showNotification('Please select a time slot', 'error');
    return;
  }
  
  const time = timeSlot.dataset.time;
  
  // Create booking object
  const booking = {
    id: generateId(),
    facility,
    date: bookingDate,
    time,
    status: 'pending'
  };
  
  // Add booking
  addBooking(booking);
  
  // Show notification
  showNotification(`Slot booked for ${FACILITY_NAMES[facility]} at ${timeSlot.textContent} on ${formatDate(bookingDate)}`, 'success');
  
  // Reset form
  document.getElementById('booking-date').value = '';
  timeSlotsContainer.innerHTML = '<div class="time-slot-message">Please select a date first</div>';
}

// Handle bulk booking form submission
function handleBulkBooking(event) {
  event.preventDefault();
  
  // Get form values
  const facilityBtn = document.querySelector('#bulk-booking-form .facility-btn.active');
  const facility = facilityBtn.dataset.facility;
  const timeSlot = document.querySelector('#bulk-time-slots .time-slot.active');
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  
  if (!timeSlot) {
    showNotification('Please select a time slot', 'error');
    return;
  }
  
  const time = timeSlot.dataset.time;
  
  if (!startDate || !endDate) {
    showNotification('Please select start and end dates', 'error');
    return;
  }
  
  if (new Date(startDate) > new Date(endDate)) {
    showNotification('End date must be after start date', 'error');
    return;
  }
  
  // Generate dates based on selected days
  const dates = generateDates(startDate, endDate);
  
  if (dates.length === 0) {
    showNotification('No valid dates found for the selected days', 'error');
    return;
  }
  
  // Generate bulk ID
  const bulkId = generateId();
  
  // Create booking objects
  const newBookings = dates.map(date => ({
    id: generateId(),
    facility,
    date: formatDateForInput(date),
    time,
    status: 'pending',
    bulkId
  }));
  
  // Add bookings
  newBookings.forEach(booking => {
    addBooking(booking);
  });
  
  // Show notification
  showNotification(`${newBookings.length} slots booked for ${FACILITY_NAMES[facility]}`, 'success');
  
  // Reset form
  document.getElementById('start-date').value = '';
  document.getElementById('end-date').value = '';
  document.querySelectorAll('.weekday-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelectorAll('#bulk-time-slots .time-slot').forEach(ts => {
    ts.classList.remove('active');
  });
}

// Generate dates based on selected days
function generateDates(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates = [];
  
  // Get selected days
  const selectedDays = [];
  document.querySelectorAll('.weekday-btn.active').forEach(btn => {
    selectedDays.push(parseInt(btn.dataset.day));
  });
  
  // If no days selected, return empty array
  if (selectedDays.length === 0) {
    return dates;
  }
  
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    if (selectedDays.includes(dayOfWeek)) {
      dates.push(new Date(current));
    }
    
    // Move to next day
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// Add booking to list and localStorage
function addBooking(booking) {
  // Add booking to list
  bookings.push(booking);
  
  // Save bookings
  saveBookings();
  
  // Render bookings
  renderBookings();
  
  // Schedule booking with server
  scheduleBooking(booking);
}

// Save bookings to localStorage
function saveBookings() {
  localStorage.setItem('bookings', JSON.stringify(bookings));
}

// Load bookings from localStorage
function loadBookings() {
  const storedBookings = localStorage.getItem('bookings');
  
  if (storedBookings) {
    bookings = JSON.parse(storedBookings);
    renderBookings();
  } else {
    // Fetch bookings from server
    fetchBookings();
  }
}

// Render bookings in UI
function renderBookings() {
  const bookingsList = document.getElementById('bookings-list');
  
  // Clear existing bookings
  bookingsList.innerHTML = '';
  
  if (bookings.length === 0) {
    bookingsList.innerHTML = '<div class="no-bookings">No bookings yet</div>';
    return;
  }
  
  // Sort bookings by date and time
  const sortedBookings = [...bookings].sort((a, b) => {
    const dateA = new Date(a.date + 'T' + a.time);
    const dateB = new Date(b.date + 'T' + b.time);
    return dateA - dateB;
  });
  
  // Group bookings by date
  const bookingsByDate = {};
  
  sortedBookings.forEach(booking => {
    if (!bookingsByDate[booking.date]) {
      bookingsByDate[booking.date] = [];
    }
    
    bookingsByDate[booking.date].push(booking);
  });
  
  // Create booking items
  for (const date in bookingsByDate) {
    const dateGroup = document.createElement('div');
    dateGroup.className = 'booking-date-group';
    
    const dateHeader = document.createElement('div');
    dateHeader.className = 'booking-date-header';
    dateHeader.textContent = formatDate(date);
    
    dateGroup.appendChild(dateHeader);
    
    bookingsByDate[date].forEach(booking => {
      const bookingItem = document.createElement('div');
      bookingItem.className = 'booking-item';
      
      // Add status class
      bookingItem.classList.add(`status-${booking.status}`);
      
      const facilityName = document.createElement('div');
      facilityName.className = 'booking-facility';
      facilityName.textContent = FACILITY_NAMES[booking.facility];
      
      const timeSlot = document.createElement('div');
      timeSlot.className = 'booking-time';
      
      // Find time label
      const timeLabel = TIME_SLOTS[booking.facility].find(slot => slot.time === booking.time)?.label || booking.time;
      timeSlot.textContent = timeLabel;
      
      const status = document.createElement('div');
      status.className = 'booking-status';
      status.textContent = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
      
      const actions = document.createElement('div');
      actions.className = 'booking-actions';
      
      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => {
        editBooking(booking.id);
      });
      
      actions.appendChild(editBtn);
      
      bookingItem.appendChild(facilityName);
      bookingItem.appendChild(timeSlot);
      bookingItem.appendChild(status);
      bookingItem.appendChild(actions);
      
      dateGroup.appendChild(bookingItem);
    });
    
    bookingsList.appendChild(dateGroup);
  }
}

// Edit booking
function editBooking(bookingId) {
  // Find booking
  const booking = bookings.find(b => b.id === bookingId);
  
  if (!booking) {
    showNotification('Booking not found', 'error');
    return;
  }
  
  // TODO: Implement edit functionality
  
  // For now, just show a notification
  showNotification('Edit functionality coming soon', 'info');
}

// Check if a slot is already booked
function isSlotBooked(facility, date, time) {
  return bookings.some(booking => 
    booking.facility === facility && 
    booking.date === date && 
    booking.time === time
  );
}

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  const notificationMessage = document.getElementById('notification-message');
  const notificationIcon = document.getElementById('notification-icon');
  
  // Set message
  notificationMessage.textContent = message;
  
  // Set icon based on type
  if (type === 'success') {
    notificationIcon.innerHTML = '✓';
    notificationIcon.className = 'notification-icon success';
  } else if (type === 'error') {
    notificationIcon.innerHTML = '✗';
    notificationIcon.className = 'notification-icon error';
  } else {
    notificationIcon.innerHTML = 'ℹ';
    notificationIcon.className = 'notification-icon info';
  }
  
  // Show notification
  notification.classList.add('show');
  
  // Hide notification after 5 seconds
  setTimeout(() => {
    notification.classList.remove('show');
  }, 5000);
}

// Format date for display
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  return date.toLocaleDateString('en-US', options);
}

// Format date for input value
function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// API functions
function fetchBookings() {
  fetch('/api/bookings')
    .then(response => response.json())
    .then(data => {
      bookings = data;
      saveBookings();
      renderBookings();
    })
    .catch(error => {
      console.error('Error fetching bookings:', error);
      showNotification('Failed to fetch bookings from server', 'error');
    });
}

function scheduleBooking(booking) {
  fetch('/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(booking)
  })
    .then(response => response.json())
    .then(data => {
      console.log('Booking scheduled:', data);
    })
    .catch(error => {
      console.error('Error scheduling booking:', error);
      showNotification('Failed to schedule booking with server', 'error');
    });
}

function updateBooking(booking) {
  fetch(`/api/bookings/${booking.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(booking)
  })
    .then(response => response.json())
    .then(data => {
      console.log('Booking updated:', data);
    })
    .catch(error => {
      console.error('Error updating booking:', error);
      showNotification('Failed to update booking with server', 'error');
    });
}

// Update time slots when date changes
document.addEventListener('DOMContentLoaded', () => {
  const bookingDate = document.getElementById('booking-date');
  bookingDate.addEventListener('change', () => {
    const facilityBtn = document.querySelector('#single-booking-form .facility-btn.active');
    const facility = facilityBtn.dataset.facility;
    updateTimeSlots(facility);
  });
});
