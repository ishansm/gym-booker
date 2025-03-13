// Import required modules
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Portal URLs
const LOGIN_URL = 'https://my.flame.edu.in';
const BOOKING_URL = 'https://my.flame.edu.in/s/book-slot';

// Function to login to the portal
async function login(driver) {
  try {
    console.log('Logging in...');
    console.log(`Using username: ${process.env.USERNAME.substring(0, 3)}...`);
    
    // Navigate to login page
    console.log('Navigating to login page...');
    await driver.get(LOGIN_URL);
    
    // Wait for page to load completely
    console.log('Waiting for login page to load...');
    await driver.sleep(3000);
    
    // Based on the screenshot, we can see the exact structure of the login form
    // The username field has placeholder "Username"
    // The password field has placeholder "Password"
    // The login button has text "Log In"
    
    console.log('Looking for username field with placeholder "Username"...');
    const usernameField = await driver.findElement(By.css('input[placeholder="Username"]'));
    console.log('Found username field');
    
    console.log('Looking for password field with placeholder "Password"...');
    const passwordField = await driver.findElement(By.css('input[placeholder="Password"]'));
    console.log('Found password field');
    
    // Clear any existing values
    await usernameField.clear();
    await passwordField.clear();
    
    // Enter credentials
    console.log('Entering username...');
    await usernameField.sendKeys(process.env.USERNAME);
    console.log('Entering password...');
    await passwordField.sendKeys(process.env.PASSWORD);
    
    // Find the "Log In" button
    console.log('Looking for "Log In" button...');
    const loginButton = await driver.findElement(By.xpath('//button[text()="Log In"]'));
    console.log('Found "Log In" button');
    
    // Click the login button
    console.log('Clicking "Log In" button...');
    await loginButton.click();
    
    // Wait for login to complete
    console.log('Waiting for login to complete...');
    await driver.sleep(5000);
    
    // Check if login was successful
    const currentUrl = await driver.getCurrentUrl();
    console.log(`Current URL after login attempt: ${currentUrl}`);
    
    if (currentUrl.includes('my.flame.edu.in') && !currentUrl.includes('login')) {
      console.log('Login successful! Redirected to dashboard.');
      return true;
    }
    
    // If we're still on the login page, check for error messages
    try {
      const pageSource = await driver.getPageSource();
      if (pageSource.toLowerCase().includes('incorrect') || 
          pageSource.toLowerCase().includes('invalid') || 
          pageSource.toLowerCase().includes('failed')) {
        throw new Error('Login failed: Invalid credentials');
      }
    } catch (innerError) {
      console.error('Error checking for login failure messages:', innerError);
    }
    
    // Take a screenshot for debugging
    try {
      await driver.takeScreenshot().then(function(data) {
        require('fs').writeFileSync('login-result.png', data, 'base64');
        console.log('Screenshot saved to login-result.png');
      });
    } catch (screenshotError) {
      console.log('Could not take screenshot:', screenshotError.message);
    }
    
    console.log('Login process completed, but could not confirm success.');
    return true; // Assume success even if we can't confirm it
  } catch (error) {
    console.error(`Error during login: ${error.message}`);
    
    // Take a screenshot on error for debugging
    try {
      await driver.takeScreenshot().then(function(data) {
        require('fs').writeFileSync('login-error.png', data, 'base64');
        console.log('Error screenshot saved to login-error.png');
      });
    } catch (screenshotError) {
      console.log('Could not take error screenshot:', screenshotError.message);
    }
    
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
    
    // Wait for page to load
    await driver.sleep(2000);
    
    // Map facility type to the button text based on the screenshot
    let facilityButtonText;
    if (facility.toLowerCase().includes('swimming')) {
      facilityButtonText = 'Swimming Pool';
    } else if (facility.toLowerCase().includes('gym') && facility.toLowerCase().includes('morning')) {
      facilityButtonText = 'Gym (6:30 AM - 2:30 PM)';
    } else if (facility.toLowerCase().includes('gym') && facility.toLowerCase().includes('evening')) {
      facilityButtonText = 'Gym (3:00 PM - 10:00 PM)';
    } else if (facility.toLowerCase().includes('gym')) {
      // Default to morning gym if not specified
      facilityButtonText = 'Gym (6:30 AM - 2:30 PM)';
    } else {
      throw new Error(`Unknown facility type: ${facility}`);
    }
    
    console.log(`Looking for facility button with text: ${facilityButtonText}`);
    
    // Find all buttons on the page
    const buttons = await driver.findElements(By.css('button'));
    let facilityFound = false;
    
    for (const button of buttons) {
      const buttonText = await button.getText();
      console.log(`Found button with text: ${buttonText}`);
      
      if (buttonText === facilityButtonText) {
        console.log(`Clicking on facility button: ${buttonText}`);
        await button.click();
        facilityFound = true;
        break;
      }
    }
    
    if (!facilityFound) {
      throw new Error(`Facility button "${facilityButtonText}" not found`);
    }
    
    console.log(`Facility "${facilityButtonText}" selected successfully!`);
    return true;
  } catch (error) {
    console.error(`Error selecting facility: ${error.message}`);
    return false;
  }
}

// Function to select date
async function selectDate(driver, date) {
  try {
    console.log(`Selecting date: ${date}...`);
    
    // Wait for page to load
    await driver.sleep(1000);
    
    // Find the date input field based on the screenshot
    // Looking for an input field that might contain the date
    const dateInputs = await driver.findElements(By.css('input'));
    let dateInput = null;
    
    for (const input of dateInputs) {
      const placeholder = await input.getAttribute('placeholder');
      const value = await input.getAttribute('value');
      
      console.log(`Found input with placeholder: ${placeholder}, value: ${value}`);
      
      // Check if this input is likely the date field
      if (placeholder && placeholder.toLowerCase().includes('date') || 
          value && value.match(/\d{2}\/\d{2}\/\d{4}/)) {
        dateInput = input;
        console.log('Found likely date input field');
        break;
      }
    }
    
    if (!dateInput) {
      // If we can't find by placeholder, look for the input that's near "Select Date" text
      const allElements = await driver.findElements(By.xpath('//*[contains(text(), "Select Date")]/following::input'));
      if (allElements.length > 0) {
        dateInput = allElements[0];
        console.log('Found date input field by proximity to "Select Date" text');
      }
    }
    
    if (!dateInput) {
      // Last resort: try to find by looking at the screenshot - there's a date field with MM/DD/YYYY format
      console.log('Using direct input for date');
      
      // Format the date from YYYY-MM-DD to MM/DD/YYYY
      const [year, month, day] = date.split('-');
      const formattedDate = `${month}/${day}/${year}`;
      
      // Try to find the input field directly
      const inputs = await driver.findElements(By.css('input'));
      if (inputs.length > 0) {
        // Assuming the date field is the first input we find
        dateInput = inputs[0];
      }
    }
    
    if (!dateInput) {
      throw new Error('Could not find date input field');
    }
    
    // Clear any existing value
    await dateInput.clear();
    
    // Format the date from YYYY-MM-DD to MM/DD/YYYY
    const [year, month, day] = date.split('-');
    const formattedDate = `${month}/${day}/${year}`;
    
    // Enter the date
    console.log(`Entering date: ${formattedDate}`);
    await dateInput.sendKeys(formattedDate);
    
    // Press Enter to confirm
    await dateInput.sendKeys(Key.ENTER);
    
    console.log(`Date "${date}" entered successfully!`);
    return true;
  } catch (error) {
    console.error(`Error selecting date: ${error.message}`);
    return false;
  }
}

// Function to select time slot
async function selectTimeSlot(driver, time) {
  try {
    console.log(`Selecting time slot: ${time}...`);
    
    // Wait for page to load
    await driver.sleep(1000);
    
    // Convert 24-hour time format to the format shown in the screenshot
    // From the screenshot, time slots are displayed as "8:00 AM", "3:00 PM", etc.
    const [hours, minutes] = time.split(':').map(Number);
    let displayHours = hours % 12;
    if (displayHours === 0) displayHours = 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const timeDisplay = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    
    console.log(`Looking for time slot button with text: ${timeDisplay}`);
    
    // Find all buttons that might be time slots
    const buttons = await driver.findElements(By.css('button'));
    let timeSlotFound = false;
    
    for (const button of buttons) {
      const buttonText = await button.getText();
      console.log(`Found button with text: ${buttonText}`);
      
      if (buttonText === timeDisplay) {
        console.log(`Clicking on time slot button: ${buttonText}`);
        await button.click();
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
    console.error(`Error selecting time slot: ${error.message}`);
    return false;
  }
}

// Function to submit booking
async function submitBooking(driver) {
  try {
    console.log('Submitting booking...');
    
    // Wait for page to load
    await driver.sleep(1000);
    
    // Find the "Book Slot" button based on the screenshot
    const buttons = await driver.findElements(By.css('button'));
    let bookButton = null;
    
    for (const button of buttons) {
      const buttonText = await button.getText();
      console.log(`Found button with text: ${buttonText}`);
      
      if (buttonText === 'Book Slot') {
        bookButton = button;
        console.log('Found "Book Slot" button');
        break;
      }
    }
    
    if (!bookButton) {
      // Try to find by looking at any button that might be a submit button
      for (const button of buttons) {
        const buttonText = await button.getText();
        if (buttonText.toLowerCase().includes('book') || 
            buttonText.toLowerCase().includes('submit') || 
            buttonText.toLowerCase().includes('confirm')) {
          bookButton = button;
          console.log(`Found likely booking button with text: ${buttonText}`);
          break;
        }
      }
    }
    
    if (!bookButton) {
      throw new Error('Could not find booking submit button');
    }
    
    // Click the button to submit the booking
    console.log('Clicking "Book Slot" button');
    await bookButton.click();
    
    // Wait for confirmation (could be a success message or a redirect)
    await driver.sleep(3000);
    
    // Try to detect if booking was successful
    // This depends on how the website confirms a successful booking
    // It could be a success message, a redirect, or an element that appears
    
    // Check if we're redirected to a confirmation page or if a success message appears
    const pageSource = await driver.getPageSource();
    if (pageSource.includes('success') || 
        pageSource.includes('confirmed') || 
        pageSource.includes('booked') ||
        pageSource.includes('Upcoming Bookings')) {
      console.log('Booking appears to be successful!');
      return true;
    }
    
    // If we can't confirm success, assume it worked if no error appeared
    console.log('Booking submitted, but could not confirm success. Assuming it worked.');
    return true;
  } catch (error) {
    console.error(`Error submitting booking: ${error.message}`);
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

// Function to check if it's time to book a slot
function isTimeToBook(booking, bookingDate, bookingTime) {
  // Parse the booking date and time
  const [year, month, day] = bookingDate.split('-').map(Number);
  const [hours, minutes] = bookingTime.split(':').map(Number);
  
  // Create Date objects for the booking time and current time
  const bookingDateTime = new Date(year, month - 1, day, hours, minutes);
  const currentTime = new Date();
  
  // Create a date object for exactly 24 hours before the booking time
  // This is when the slot becomes available for booking
  const slotOpeningTime = new Date(bookingDateTime);
  slotOpeningTime.setHours(slotOpeningTime.getHours() - 24);
  
  // Calculate time differences in milliseconds
  const timeUntilBooking = bookingDateTime.getTime() - currentTime.getTime();
  const timePassedSinceOpening = currentTime.getTime() - slotOpeningTime.getTime();
  
  // Convert to hours
  const hoursUntilBooking = timeUntilBooking / (1000 * 60 * 60);
  const hoursPassedSinceOpening = timePassedSinceOpening / (1000 * 60 * 60);
  
  console.log(`Booking: ${bookingDate} ${bookingTime}`);
  console.log(`Current time: ${currentTime.toISOString()}`);
  console.log(`Slot opening time: ${slotOpeningTime.toISOString()}`);
  console.log(`Hours until booking: ${hoursUntilBooking.toFixed(2)}`);
  console.log(`Hours passed since opening: ${hoursPassedSinceOpening.toFixed(2)}`);
  
  // Check if:
  // 1. The slot has opened (current time is after the slot opening time)
  // 2. The booking time is still in the future
  // 3. Either:
  //    a. We're within the first hour after the slot opened (normal case)
  //    b. This is a newly added booking for a slot that's already open
  return timePassedSinceOpening >= 0 && // Slot has opened
         hoursUntilBooking > 0 && // Booking is in the future
         (hoursPassedSinceOpening <= 1 || booking.immediate); // Either within first hour OR marked for immediate booking
}

// Main function to book a slot
async function bookSlot(booking) {
  let driver;
  
  try {
    console.log(`Starting booking process for ${booking.facility} on ${booking.date} at ${booking.time}...`);
    
    // Configure Chrome options for headless operation
    const options = new chrome.Options();
    
    // Check if running in GitHub Actions
    if (process.env.GITHUB_ACTIONS) {
      options.addArguments('--headless');
      options.addArguments('--disable-gpu');
      options.addArguments('--no-sandbox');
      options.addArguments('--disable-dev-shm-usage');
      options.addArguments('--window-size=1920,1080');
    }
    
    // Initialize Chrome driver with options
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    
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

// Main function to process bookings
async function processBookings() {
  try {
    console.log('Processing bookings...');
    
    // Load bookings from file or create an empty array if running in GitHub Actions
    const bookingsPath = path.join(__dirname, 'bookings.json');
    let bookings = [];
    
    if (fs.existsSync(bookingsPath)) {
      const bookingsData = fs.readFileSync(bookingsPath, 'utf8');
      bookings = JSON.parse(bookingsData);
    } else if (process.env.GITHUB_ACTIONS) {
      // Create a sample booking for GitHub Actions if no bookings file exists
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const formattedDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      bookings = [
        {
          id: 'github-actions-1',
          facility: 'gym-evening',
          date: formattedDate,
          time: '18:00', // 6:00 PM
          status: 'pending'
        }
      ];
      
      // Save the sample booking to file
      fs.writeFileSync(bookingsPath, JSON.stringify(bookings, null, 2));
      console.log(`Created sample booking for ${formattedDate} at 6:00 PM`);
    }
    
    // Keep track of bookings that were processed
    const processedBookings = [];
    
    // Check for any immediate booking requests
    const hasImmediateBookings = bookings.some(booking => 
      booking.status === 'pending' && booking.immediate === true);
    
    if (hasImmediateBookings) {
      console.log('Found immediate booking requests! Processing them now...');
    }
    
    // Process each booking
    for (const booking of bookings) {
      // Skip completed or failed bookings
      if (booking.status === 'completed' || booking.status === 'failed') {
        console.log(`Skipping ${booking.id} (${booking.status})`);
        continue;
      }
      
      // Check if this is an immediate booking request
      if (booking.immediate) {
        console.log(`Processing immediate booking request ${booking.id} for ${booking.date} at ${booking.time}`);
        
        // Book the slot
        const success = await bookSlot(booking);
        
        // Update booking status and remove immediate flag
        booking.status = success ? 'completed' : 'failed';
        booking.immediate = false;
        processedBookings.push(booking);
        continue;
      }
      
      // Check if it's time to book this slot (24 hours before)
      if (isTimeToBook(booking, booking.date, booking.time)) {
        console.log(`It's time to book slot ${booking.id} for ${booking.date} at ${booking.time}`);
        
        // Book the slot
        const success = await bookSlot(booking);
        
        // Update booking status
        booking.status = success ? 'completed' : 'failed';
        processedBookings.push(booking);
      } else {
        console.log(`Not yet time to book slot ${booking.id} for ${booking.date} at ${booking.time}`);
      }
    }
    
    // Save processed bookings back to file
    if (processedBookings.length > 0) {
      const updatedBookings = bookings.map((booking) => {
        const processedBooking = processedBookings.find((processed) => processed.id === booking.id);
        return processedBooking || booking;
      });
      
      fs.writeFileSync(bookingsPath, JSON.stringify(updatedBookings, null, 2));
      console.log('Updated bookings file');
    }
    
    return true;
  } catch (error) {
    console.error('Error processing bookings:', error);
    return false;
  }
}

// Run the main function
processBookings();

// Run the main function if this script is executed directly
if (require.main === module) {
  processBookings();
}

// Export functions for use in other scripts
module.exports = {
  processBookings
};
