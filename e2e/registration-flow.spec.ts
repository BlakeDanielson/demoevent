import { test, expect } from '@playwright/test';
import { EventPage } from './pages/EventPage';
import { RegistrationPage } from './pages/RegistrationPage';

test.describe('Event Registration Flow', () => {
  let eventPage: EventPage;
  let registrationPage: RegistrationPage;

  test.beforeEach(async ({ page }) => {
    eventPage = new EventPage(page);
    registrationPage = new RegistrationPage(page);
  });

  test('should complete single participant registration successfully', async ({ page }) => {
    // Navigate to event page
    await eventPage.goto('test-event-1');
    await eventPage.verifyPageLoaded();
    
    // Click register button
    await eventPage.clickRegister();
    
    // Verify registration form loads
    await registrationPage.verifyFormLoaded();
    await registrationPage.verifyCurrentStep(1);
    
    // Fill participant information
    await registrationPage.fillParticipantInfo({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      customFields: {
        company: 'Acme Corp'
      }
    });
    
    // Proceed to ticket selection
    await registrationPage.proceedToTicketSelection();
    await registrationPage.verifyCurrentStep(2);
    
    // Select tickets
    await registrationPage.selectTickets([
      { ticketTypeId: 'general', quantity: 1 }
    ]);
    
    // Verify total amount
    await registrationPage.verifyTotalAmount(50);
    
    // Proceed to review
    await registrationPage.proceedToReview();
    await registrationPage.verifyCurrentStep(3);
    
    // Submit registration
    await registrationPage.reviewAndSubmit();
    
    // Verify successful registration
    const confirmationCode = await registrationPage.verifySuccessfulRegistration();
    expect(confirmationCode).toBeTruthy();
  });

  test('should complete group registration successfully', async ({ page }) => {
    await eventPage.goto('test-event-1');
    await eventPage.clickRegister();
    
    await registrationPage.verifyFormLoaded();
    
    // Fill primary participant
    await registrationPage.fillParticipantInfo({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+1987654321'
    });
    
    // Add additional participants
    await registrationPage.addAdditionalParticipant({
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob.johnson@example.com'
    });
    
    await registrationPage.addAdditionalParticipant({
      firstName: 'Alice',
      lastName: 'Williams',
      email: 'alice.williams@example.com'
    });
    
    // Proceed to ticket selection
    await registrationPage.proceedToTicketSelection();
    
    // Select tickets for group
    await registrationPage.selectTickets([
      { ticketTypeId: 'general', quantity: 3 }
    ]);
    
    await registrationPage.verifyTotalAmount(150); // 3 × $50
    
    // Complete registration
    await registrationPage.proceedToReview();
    await registrationPage.reviewAndSubmit();
    
    await registrationPage.verifySuccessfulRegistration();
  });

  test('should handle form validation errors correctly', async ({ page }) => {
    await eventPage.goto('test-event-1');
    await eventPage.clickRegister();
    
    await registrationPage.verifyFormLoaded();
    
    // Try to proceed without filling required fields
    await registrationPage.verifyFormValidation();
    
    // Verify specific validation errors
    await registrationPage.verifyValidationError('firstName', 'First name is required');
    await registrationPage.verifyValidationError('lastName', 'Last name is required');
    await registrationPage.verifyValidationError('email', 'Email is required');
    
    // Fill invalid email
    await registrationPage.fillParticipantInfo({
      firstName: 'John',
      lastName: 'Doe',
      email: 'invalid-email',
    });
    
    await registrationPage.proceedToTicketSelection();
    await registrationPage.verifyValidationError('email', 'Invalid email format');
  });

  test('should support file upload functionality', async ({ page }) => {
    await eventPage.goto('test-event-1');
    await eventPage.clickRegister();
    
    await registrationPage.verifyFormLoaded();
    
    // Fill basic info
    await registrationPage.fillParticipantInfo({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com'
    });
    
    // Create a test file for upload
    const testFilePath = 'e2e/fixtures/test-document.pdf';
    
    // Upload file
    await registrationPage.uploadFile(testFilePath, 'resume');
    await registrationPage.verifyFileUploaded('test-document.pdf');
    
    // Continue with registration
    await registrationPage.proceedToTicketSelection();
    await registrationPage.selectTickets([
      { ticketTypeId: 'general', quantity: 1 }
    ]);
    
    await registrationPage.proceedToReview();
    await registrationPage.reviewAndSubmit();
    
    await registrationPage.verifySuccessfulRegistration();
  });

  test('should handle navigation between steps correctly', async ({ page }) => {
    await eventPage.goto('test-event-1');
    await eventPage.clickRegister();
    
    await registrationPage.verifyFormLoaded();
    await registrationPage.verifyCurrentStep(1);
    
    // Fill participant info and go to step 2
    await registrationPage.fillParticipantInfo({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com'
    });
    
    await registrationPage.proceedToTicketSelection();
    await registrationPage.verifyCurrentStep(2);
    
    // Go back to step 1
    await registrationPage.goBackToPreviousStep();
    await registrationPage.verifyCurrentStep(1);
    
    // Verify data is preserved
    await expect(registrationPage.firstNameInput).toHaveValue('John');
    await expect(registrationPage.lastNameInput).toHaveValue('Doe');
    await expect(registrationPage.emailInput).toHaveValue('john.doe@example.com');
    
    // Go forward again
    await registrationPage.proceedToTicketSelection();
    await registrationPage.verifyCurrentStep(2);
    
    // Select tickets and go to review
    await registrationPage.selectTickets([
      { ticketTypeId: 'general', quantity: 1 }
    ]);
    
    await registrationPage.proceedToReview();
    await registrationPage.verifyCurrentStep(3);
    
    // Go back to ticket selection
    await registrationPage.goBackToPreviousStep();
    await registrationPage.verifyCurrentStep(2);
    
    // Verify ticket selection is preserved
    const quantityInput = page.locator('[data-testid="ticket-general"] input[type="number"]');
    await expect(quantityInput).toHaveValue('1');
  });

  test('should work correctly on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await eventPage.goto('test-event-1');
    await eventPage.verifyPageLoaded();
    await eventPage.clickRegister();
    
    // Verify responsive design
    await registrationPage.verifyResponsiveDesign();
    
    // Complete registration on mobile
    await registrationPage.fillParticipantInfo({
      firstName: 'Mobile',
      lastName: 'User',
      email: 'mobile.user@example.com'
    });
    
    await registrationPage.proceedToTicketSelection();
    await registrationPage.selectTickets([
      { ticketTypeId: 'general', quantity: 1 }
    ]);
    
    await registrationPage.proceedToReview();
    await registrationPage.reviewAndSubmit();
    
    await registrationPage.verifySuccessfulRegistration();
  });

  test('should meet accessibility requirements', async ({ page }) => {
    await eventPage.goto('test-event-1');
    await eventPage.clickRegister();
    
    await registrationPage.verifyFormLoaded();
    
    // Verify accessibility features
    await registrationPage.verifyAccessibility();
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(registrationPage.firstNameInput).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(registrationPage.lastNameInput).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(registrationPage.emailInput).toBeFocused();
  });

  test('should handle concurrent registrations gracefully', async ({ page, context }) => {
    // Open multiple tabs to simulate concurrent registrations
    const page2 = await context.newPage();
    const eventPage2 = new EventPage(page2);
    const registrationPage2 = new RegistrationPage(page2);
    
    // Start registration in both tabs
    await Promise.all([
      eventPage.goto('test-event-1'),
      eventPage2.goto('test-event-1')
    ]);
    
    await Promise.all([
      eventPage.clickRegister(),
      eventPage2.clickRegister()
    ]);
    
    // Fill forms simultaneously
    await Promise.all([
      registrationPage.fillParticipantInfo({
        firstName: 'User',
        lastName: 'One',
        email: 'user.one@example.com'
      }),
      registrationPage2.fillParticipantInfo({
        firstName: 'User',
        lastName: 'Two',
        email: 'user.two@example.com'
      })
    ]);
    
    // Proceed to ticket selection
    await Promise.all([
      registrationPage.proceedToTicketSelection(),
      registrationPage2.proceedToTicketSelection()
    ]);
    
    // Select same tickets (test availability handling)
    await Promise.all([
      registrationPage.selectTickets([{ ticketTypeId: 'limited', quantity: 5 }]),
      registrationPage2.selectTickets([{ ticketTypeId: 'limited', quantity: 5 }])
    ]);
    
    // Try to complete registrations
    await registrationPage.proceedToReview();
    await registrationPage.reviewAndSubmit();
    
    await registrationPage2.proceedToReview();
    // Second registration might fail due to ticket availability
    // This tests the system's handling of concurrent access
    
    await page2.close();
  });

  test('should handle network failures gracefully', async ({ page }) => {
    await eventPage.goto('test-event-1');
    await eventPage.clickRegister();
    
    await registrationPage.verifyFormLoaded();
    
    // Fill form
    await registrationPage.fillParticipantInfo({
      firstName: 'Network',
      lastName: 'Test',
      email: 'network.test@example.com'
    });
    
    await registrationPage.proceedToTicketSelection();
    await registrationPage.selectTickets([
      { ticketTypeId: 'general', quantity: 1 }
    ]);
    
    await registrationPage.proceedToReview();
    
    // Simulate network failure during submission
    await page.route('**/api/**', route => route.abort());
    
    await registrationPage.reviewAndSubmit();
    
    // Should show error message
    await expect(page.locator('[role="alert"]')).toContainText('network error');
    
    // Restore network and retry
    await page.unroute('**/api/**');
    await registrationPage.reviewAndSubmit();
    
    await registrationPage.verifySuccessfulRegistration();
  });
}); 