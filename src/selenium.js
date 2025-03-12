// Import required modules
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Portal URLs
const LOGIN_URL = 'https://my.flame.edu.in';
const BOOKING_URL = 'https://my.flame.edu.in/s/book-slot';

// Function to login to the portal
async function login(driver) {
  try {
    console.log('Navigating to login page...');
    await driver.get(LOGIN_URL);
    
    // Wait for the login form to load
    await driver.wait(until.elementLocated(By.id('username')), 10000);
    
    console.log('Entering username...');
    await driver.findElement(By.id('username')).sendKeys(process.env.USERNAME);
    
    console.log('Entering password...');
    await driver.findElement(By.id('password')).sendKeys(process.env.PASSWORD);
    
    console.log('Submitting login form...');
    await driver.findElement(By.name('login')).click();
    
    // Wait for successful login
    await driver.wait(until.urlContains('my.flame.edu.in/s/'), 10000);
    
    console.log('Login successful!');
    return true;
  } catch (error) {
    console.error('Error during login:', error);
    return false;
  }
}

// Function to navigate to booking page
async function navigateToBookingPage(driver) {
  try {
    console.log('Navigating to booking page...');
    await driver.get(BOOKING_URL);
    
    // Wait for the booking form to load
    await driver.wait(until.elementLocated(By.id('facility-select')), 10000);
    
    console.log('Booking page loaded successfully!');
    return true;
  } catch (error) {
    console.error('Error navigating to booking page:', error);
    return false;
  }
}

// Function to select facility
async function selectFacility(driver, facility) {
  try {
    console.log(`Selecting facility: ${facility}...`);
    
    // Map our facility codes to the portal's facility options
    const facilityMap = {
      'gym-evening': 'Gym (3:00 PM - 10:00 PM)',
      'gym-morning': 'Gym (6:30 AM - 2:30 PM)',
      'swimming': 'Swimming Pool'
    };
    
    const facilityName = facilityMap[facility];
    
    // Select the facility from the dropdown
    const facilitySelect = await driver.findElement(By.id('facility-select'));
    await facilitySelect.click();
    
    // Wait for dropdown options to appear
    await driver.wait(until.elementLocated(By.css('.facility-option')), 5000);
    
    // Find and click the correct facility option
    const facilityOptions = await driver.findElements(By.css('.facility-option'));
    let facilityFound = false;
    
    for (const option of facilityOptions) {
      const optionText = await option.getText();
      if (optionText === facilityName) {
        await option.click();
        facilityFound = true;
        break;
      }
    }
    
    if (!facilityFound) {
      throw new Error(`Facility "${facilityName}" not found in dropdown`);
    }
    
    console.log(`Facility "${facilityName}" selected successfully!`);
    return true;
  } catch (error) {
    console.error('Error selecting facility:', error);
    return false;
  }
}

// Function to select date
async function selectDate(driver, date) {
  try {
    console.log(`Selecting date: ${date}...`);
    
    // Click on date picker
    await driver.findElement(By.id('date-picker')).click();
    
    // Wait for date picker to open
    await driver.wait(until.elementLocated(By.css('.date-picker-calendar')), 5000);
    
    // Parse the date
    const [year, month, day] = date.split('-').map(Number);
    
    // Month in JavaScript is 0-indexed (0 = January, 11 = December)
    const monthIndex = month - 1;
    
    // Navigate to the correct month and year
    // This part is highly dependent on the actual date picker implementation
    // The following is a simplified example
    
    // Select the month and year from dropdowns if they exist
    const monthSelect = await driver.findElement(By.css('.month-select'));
    await monthSelect.click();
    await driver.findElement(By.css(`.month-option[data-month="${monthIndex}"]`)).click();
    
    const yearSelect = await driver.findElement(By.css('.year-select'));
    await yearSelect.click();
    await driver.findElement(By.css(`.year-option[data-year="${year}"]`)).click();
    
    // Find and click the correct day
    const dayElements = await driver.findElements(By.css('.day'));
    let dayFound = false;
    
    for (const dayElement of dayElements) {
      const dayText = await dayElement.getText();
      if (parseInt(dayText) === day) {
        await dayElement.click();
        dayFound = true;
        break;
      }
    }
    
    if (!dayFound) {
      throw new Error(`Day "${day}" not found in calendar`);
    }
    
    console.log(`Date "${date}" selected successfully!`);
    return true;
  } catch (error) {
    console.error('Error selecting date:', error);
    return false;
  }
}

// Function to select time slot
async function selectTimeSlot(driver, time) {
  try {
    console.log(`Selecting time slot: ${time}...`);
    
    // Convert time to display format (e.g., "15:00" to "3:00 PM")
    const timeDisplay = formatTimeForDisplay(time);
    
    // Wait for time slots to load
    await driver.wait(until.elementLocated(By.css('.time-slot')), 5000);
    
    // Find and click the correct time slot
    const timeSlots = await driver.findElements(By.css('.time-slot'));
    let timeSlotFound = false;
    
    for (const slot of timeSlots) {
      const slotText = await slot.getText();
      if (slotText === timeDisplay) {
        await slot.click();
        timeSlotFound = true;
        break;
      }
    }
    
    if (!timeSlotFound) {
      throw new Error(`Time slot "${timeDisplay}" not found or not available`);
    }
    
    console.log(`Time slot "${timeDisplay}" selected successfully!`);
    return true;
  } catch (error) {
    console.error('Error selecting time slot:', error);
    return false;
  }
}

// Function to submit booking
async function submitBooking(driver) {
  try {
    console.log('Submitting booking...');
    
    // Find and click the submit button
    await driver.findElement(By.id('book-button')).click();
    
    // Wait for confirmation message
    await driver.wait(until.elementLocated(By.css('.booking-confirmation')), 10000);
    
    console.log('Booking submitted successfully!');
    return true;
  } catch (error) {
    console.error('Error submitting booking:', error);
    return false;
  }
}

// Helper function to format time for display
function formatTimeForDisplay(time) {
  const [hours, minutes] = time.split(':').map(Number);
  
  let period = 'AM';
  let displayHours = hours;
  
  if (hours >= 12) {
    period = 'PM';
    if (hours > 12) {
      displayHours = hours - 12;
    }
  }
  
  if (displayHours === 0) {
    displayHours = 12;
  }
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Main function to book a slot
async function bookSlot(booking) {
  // Create a new Chrome driver
  const options = new chrome.Options();
  
  // Uncomment the following line to run Chrome in headless mode
  // options.addArguments('--headless');
  
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
  
  try {
    // Login to the portal
    const loginSuccess = await login(driver);
    if (!loginSuccess) {
      throw new Error('Login failed');
    }
    
    // Navigate to booking page
    const navigationSuccess = await navigateToBookingPage(driver);
    if (!navigationSuccess) {
      throw new Error('Navigation to booking page failed');
    }
    
    // Select facility
    const facilitySuccess = await selectFacility(driver, booking.facility);
    if (!facilitySuccess) {
      throw new Error('Facility selection failed');
    }
    
    // Select date
    const dateSuccess = await selectDate(driver, booking.date);
    if (!dateSuccess) {
      throw new Error('Date selection failed');
    }
    
    // Select time slot
    const timeSlotSuccess = await selectTimeSlot(driver, booking.time);
    if (!timeSlotSuccess) {
      throw new Error('Time slot selection failed');
    }
    
    // Submit booking
    const submissionSuccess = await submitBooking(driver);
    if (!submissionSuccess) {
      throw new Error('Booking submission failed');
    }
    
    return true;
  } catch (error) {
    console.error('Error booking slot:', error);
    return false;
  } finally {
    // Close the browser
    await driver.quit();
  }
}

// Export functions
module.exports = {
  bookSlot
};
