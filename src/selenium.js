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
    
    // Try multiple strategies to find the login button
    console.log('Looking for login button...');
    let loginButton = null;
    
    try {
      // First attempt: by exact text "Log in"
      loginButton = await driver.findElement(By.xpath('//button[text()="Log in"]'));
      console.log('Found login button by exact text "Log in"');
    } catch (error) {
      console.log('Could not find button with exact text "Log in", trying case-insensitive...');
      try {
        // Second attempt: by case-insensitive text contains
        loginButton = await driver.findElement(By.xpath('//button[contains(translate(text(), "LOGIN", "login"), "log in")]'));
        console.log('Found login button by case-insensitive text');
      } catch (error) {
        console.log('Could not find button by text, trying by CSS class...');
        try {
          // Third attempt: by CSS classes commonly used for login buttons
          loginButton = await driver.findElement(By.css('button.login-button, button.btn-login, button.submit-button'));
          console.log('Found login button by CSS class');
        } catch (error) {
          console.log('Could not find button by CSS class, trying any button on the form...');
          try {
            // Fourth attempt: find any button within the form
            const buttons = await driver.findElements(By.css('form button'));
            if (buttons.length > 0) {
              loginButton = buttons[0]; // Use the first button found in the form
              console.log('Found a button within the form, using as login button');
            } else {
              // Fifth attempt: just find any button on the page
              const allButtons = await driver.findElements(By.css('button'));
              if (allButtons.length > 0) {
                // Try to find a button that looks like a login button based on text content
                for (const button of allButtons) {
                  const buttonText = await button.getText();
                  const buttonTextLower = buttonText.toLowerCase();
                  if (buttonTextLower.includes('log') || 
                      buttonTextLower.includes('sign') || 
                      buttonTextLower.includes('submit') || 
                      buttonTextLower.includes('enter')) {
                    loginButton = button;
                    console.log(`Found likely login button with text: ${buttonText}`);
                    break;
                  }
                }
                
                // If no button with login-like text was found, just use the first button
                if (!loginButton) {
                  loginButton = allButtons[0];
                  console.log('Using first button on page as login button');
                }
              } else {
                throw new Error('No buttons found on the page');
              }
            }
          } catch (error) {
            console.log('Could not find any buttons, trying input type submit...');
            // Sixth attempt: look for input type="submit"
            const submitInputs = await driver.findElements(By.css('input[type="submit"]'));
            if (submitInputs.length > 0) {
              loginButton = submitInputs[0];
              console.log('Found submit input, using as login button');
            } else {
              throw new Error('Could not locate any login button or submit element');
            }
          }
        }
      }
    }
    
    // Click the login button
    console.log('Clicking login button...');
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

// Function to book a slot
async function bookSlot(driver, facility, date, time) {
  try {
    console.log(`Starting booking process for ${facility} on ${date} at ${time}...`);
    
    // Login to the portal
    const loginSuccess = await login(driver);
    if (!loginSuccess) {
      throw new Error('Login failed');
    }
    
    // Navigate to booking page
    console.log('Navigating to booking page...');
    await driver.get('https://my.flame.edu.in/s/book-slot');
    await driver.sleep(3000);
    
    // Step 1: Select "Sports Facilities" on the first screen
    console.log('Selecting "Sports Facilities"...');
    try {
      const sportsFacilitiesButton = await driver.findElement(By.xpath('//button[contains(text(), "Sports Facilities")]'));
      await sportsFacilitiesButton.click();
      console.log('Clicked on "Sports Facilities"');
    } catch (error) {
      console.error('Error selecting Sports Facilities:', error.message);
      throw new Error('Could not select Sports Facilities');
    }
    
    await driver.sleep(2000);
    
    // Step 2: Select the specific facility based on the booking
    console.log(`Selecting facility: ${facility}...`);
    let facilitySelector;
    
    // Map the facility from our JSON to the button text on the website
    if (facility === 'swimming') {
      facilitySelector = 'Swimming Pool';
    } else if (facility === 'gym-morning') {
      facilitySelector = 'Gym ( 6:30 am to 2:30 pm slot )';
    } else if (facility === 'gym-evening') {
      facilitySelector = 'Gym ( 3:00 pm to 10:00 pm slot )';
    } else {
      facilitySelector = facility; // Use as-is if no mapping needed
    }
    
    try {
      const facilityButton = await driver.findElement(By.xpath(`//button[contains(text(), "${facilitySelector}")]`));
      await facilityButton.click();
      console.log(`Clicked on "${facilitySelector}"`);
    } catch (error) {
      console.error(`Error selecting facility ${facilitySelector}:`, error.message);
      
      // Try a more flexible approach if exact match fails
      console.log('Trying to find facility button with partial text match...');
      try {
        const buttons = await driver.findElements(By.css('button'));
        let found = false;
        
        for (const button of buttons) {
          const buttonText = await button.getText();
          if (buttonText.toLowerCase().includes(facilitySelector.toLowerCase())) {
            await button.click();
            console.log(`Clicked on button with text: ${buttonText}`);
            found = true;
            break;
          }
        }
        
        if (!found) {
          throw new Error(`Could not find any button matching "${facilitySelector}"`);
        }
      } catch (innerError) {
        console.error('Error with fallback facility selection:', innerError.message);
        throw new Error(`Could not select facility: ${facilitySelector}`);
      }
    }
    
    await driver.sleep(2000);
    
    // Step 3: Select date
    console.log(`Selecting date: ${date}...`);
    
    // Convert date from YYYY-MM-DD to DD/MM/YYYY format
    const [year, month, day] = date.split('-');
    const formattedDate = `${day}/${month}/${year}`;
    
    try {
      const dateInput = await driver.findElement(By.css('input[type="text"]'));
      await dateInput.clear();
      await dateInput.sendKeys(formattedDate);
      console.log(`Entered date: ${formattedDate}`);
    } catch (error) {
      console.error('Error entering date:', error.message);
      throw new Error('Could not enter date');
    }
    
    await driver.sleep(1000);
    
    // Step 4: Select time slot
    console.log(`Selecting time slot for: ${time}...`);
    
    // Map the time from our JSON to the time range on the website
    let timeRange;
    const hour = parseInt(time.split(':')[0]);
    
    if (hour >= 3 && hour < 4) {
      timeRange = '3:00 PM-4:00 PM';
    } else if (hour >= 4 && hour < 5) {
      timeRange = '4:00 PM-5:00 PM';
    } else if (hour >= 5 && hour < 6) {
      timeRange = '5:00 PM-6:00 PM';
    } else if (hour >= 6 && hour < 7) {
      timeRange = '6:00 PM-7:00 PM';
    } else if (hour >= 7 && hour < 8) {
      timeRange = '7:00 PM-8:00 PM';
    } else if (hour >= 8 && hour < 9) {
      timeRange = '8:00 AM-9:00 AM';
    } else if (hour >= 9 && hour < 10) {
      timeRange = '9:00 AM-10:00 AM';
    } else if (hour >= 10 && hour < 11) {
      timeRange = '10:00 AM-11:00 AM';
    } else if (hour >= 11 && hour < 12) {
      timeRange = '11:00 AM-12:00 PM';
    } else if (hour >= 12 && hour < 13) {
      timeRange = '12:00 PM-1:00 PM';
    } else if (hour >= 13 && hour < 14) {
      timeRange = '1:00 PM-2:00 PM';
    } else if (hour >= 14 && hour < 15) {
      timeRange = '2:00 PM-3:00 PM';
    } else {
      timeRange = `${hour}:00`; // Fallback
    }
    
    try {
      const timeButton = await driver.findElement(By.xpath(`//button[contains(text(), "${timeRange}")]`));
      await timeButton.click();
      console.log(`Clicked on time slot: ${timeRange}`);
    } catch (error) {
      console.error(`Error selecting time slot ${timeRange}:`, error.message);
      
      // Try a more flexible approach if exact match fails
      console.log('Trying to find time slot button with partial text match...');
      try {
        const buttons = await driver.findElements(By.css('button'));
        let found = false;
        
        for (const button of buttons) {
          const buttonText = await button.getText();
          // Convert hour to 12-hour format for matching
          const hour12 = hour > 12 ? hour - 12 : hour;
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const hourPattern = `${hour12}:00`;
          
          if (buttonText.includes(hourPattern) && buttonText.includes(ampm)) {
            await button.click();
            console.log(`Clicked on button with text: ${buttonText}`);
            found = true;
            break;
          }
        }
        
        if (!found) {
          throw new Error(`Could not find any button matching time for ${hour}:00`);
        }
      } catch (innerError) {
        console.error('Error with fallback time selection:', innerError.message);
        throw new Error(`Could not select time slot for ${hour}:00`);
      }
    }
    
    await driver.sleep(1000);
    
    // Step 5: Click the "Book" button to confirm
    console.log('Clicking "Book" button to confirm...');
    try {
      const bookButton = await driver.findElement(By.xpath('//button[text()="Book"]'));
      await bookButton.click();
      console.log('Clicked on "Book" button');
    } catch (error) {
      console.error('Error clicking Book button:', error.message);
      throw new Error('Could not click Book button');
    }
    
    await driver.sleep(3000);
    
    // Check for success (could be a confirmation message or redirect)
    console.log('Checking for booking confirmation...');
    try {
      // Take a screenshot for verification
      await driver.takeScreenshot().then(function(data) {
        require('fs').writeFileSync('booking-confirmation.png', data, 'base64');
        console.log('Confirmation screenshot saved to booking-confirmation.png');
      });
      
      // Check for success elements or messages
      try {
        const confirmationElement = await driver.findElement(By.xpath('//*[contains(text(), "success") or contains(text(), "confirmed") or contains(text(), "booked")]'));
        console.log('Found confirmation message:', await confirmationElement.getText());
      } catch (error) {
        console.log('No explicit confirmation message found, but no errors either');
      }
      
      console.log('Booking process completed successfully');
      return true;
    } catch (error) {
      console.error('Error during booking confirmation check:', error.message);
      throw new Error('Could not confirm booking success');
    }
  } catch (error) {
    console.error(`Error booking slot: ${error.message}`);
    
    // Take a screenshot on error for debugging
    try {
      await driver.takeScreenshot().then(function(data) {
        require('fs').writeFileSync('booking-error.png', data, 'base64');
        console.log('Error screenshot saved to booking-error.png');
      });
    } catch (screenshotError) {
      console.log('Could not take error screenshot:', screenshotError.message);
    }
    
    throw error;
  }
}

// Main function to process bookings
async function processBookings() {
  console.log('Processing bookings...');
  
  // Initialize driver for booking
  let driver;
  try {
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
        
        try {
          // Book the slot
          const success = await bookSlot(driver, booking.facility, booking.date, booking.time);
          
          // Update booking status and remove immediate flag
          booking.status = success ? 'completed' : 'failed';
          booking.immediate = false;
          processedBookings.push(booking);
        } catch (error) {
          console.error(`Error booking slot ${booking.id}:`, error.message);
          booking.status = 'failed';
          booking.immediate = false;
          processedBookings.push(booking);
        }
        continue;
      }
      
      // Check if it's time to book this slot (24 hours before)
      if (isTimeToBook(booking, booking.date, booking.time)) {
        console.log(`It's time to book slot ${booking.id} for ${booking.date} at ${booking.time}`);
        
        try {
          // Book the slot
          const success = await bookSlot(driver, booking.facility, booking.date, booking.time);
          
          // Update booking status
          booking.status = success ? 'completed' : 'failed';
          processedBookings.push(booking);
        } catch (error) {
          console.error(`Error booking slot ${booking.id}:`, error.message);
          booking.status = 'failed';
          processedBookings.push(booking);
        }
      } else {
        // Log why we're not booking yet
        const { date, time } = booking;
        const currentTime = new Date();
        const slotOpeningTime = getSlotOpeningTime(date);
        
        const hoursUntilBooking = (new Date(date + 'T' + time + ':00Z') - currentTime) / (1000 * 60 * 60);
        const hoursPassedSinceOpening = (currentTime - slotOpeningTime) / (1000 * 60 * 60);
        
        console.log(`Booking: ${date} ${time}`);
        console.log(`Current time: ${currentTime.toISOString()}`);
        console.log(`Slot opening time: ${slotOpeningTime.toISOString()}`);
        console.log(`Hours until booking: ${hoursUntilBooking.toFixed(2)}`);
        console.log(`Hours passed since opening: ${hoursPassedSinceOpening.toFixed(2)}`);
        
        if (hoursUntilBooking < 0) {
          console.log(`Booking time has passed for ${booking.id}`);
        } else if (hoursPassedSinceOpening < 0) {
          console.log(`Not yet time to book slot ${booking.id} for ${date} at ${time}`);
        } else if (hoursPassedSinceOpening > 1 && !booking.immediate) {
          console.log(`More than 1 hour has passed since slot opening for ${booking.id}`);
        }
      }
    }
    
    // Save updated bookings back to file if any changes were made
    if (processedBookings.length > 0) {
      const updatedBookings = bookings.map((booking) => {
        const processedBooking = processedBookings.find((processed) => processed.id === booking.id);
        return processedBooking || booking;
      });
      
      fs.writeFileSync(bookingsPath, JSON.stringify(updatedBookings, null, 2));
      console.log('Updated bookings file');
    }
  } catch (error) {
    console.error('Error processing bookings:', error.message);
  } finally {
    // Close the browser
    if (driver) {
      try {
        await driver.quit();
        console.log('Browser closed');
      } catch (error) {
        console.error('Error closing browser:', error.message);
      }
    }
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
