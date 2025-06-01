import { Page, Locator, expect } from '@playwright/test';

export class RegistrationPage {
  readonly page: Page;
  
  // Form container and navigation
  readonly formContainer: Locator;
  readonly stepIndicator: Locator;
  readonly nextButton: Locator;
  readonly backButton: Locator;
  readonly submitButton: Locator;

  // Step 1: Participant Information
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly addParticipantButton: Locator;
  readonly groupRegistrationToggle: Locator;

  // Step 2: Ticket Selection
  readonly ticketTypeCards: Locator;
  readonly ticketQuantityInputs: Locator;
  readonly totalAmountDisplay: Locator;

  // Step 3: Review & Submit
  readonly reviewSection: Locator;
  readonly termsCheckbox: Locator;
  readonly confirmationMessage: Locator;
  readonly confirmationCode: Locator;

  // Error messages
  readonly errorMessages: Locator;
  readonly fieldErrors: Locator;

  // File upload
  readonly fileUploadInputs: Locator;
  readonly uploadedFilesList: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Form container and navigation
    this.formContainer = page.locator('[data-testid="registration-form"]');
    this.stepIndicator = page.locator('[data-testid="step-indicator"]');
    this.nextButton = page.locator('button:has-text("Next")');
    this.backButton = page.locator('button:has-text("Back")');
    this.submitButton = page.locator('button:has-text("Submit Registration")');

    // Step 1: Participant Information
    this.firstNameInput = page.locator('input[name="primaryParticipant.firstName"]');
    this.lastNameInput = page.locator('input[name="primaryParticipant.lastName"]');
    this.emailInput = page.locator('input[name="primaryParticipant.email"]');
    this.phoneInput = page.locator('input[name="primaryParticipant.phone"]');
    this.addParticipantButton = page.locator('button:has-text("Add Participant")');
    this.groupRegistrationToggle = page.locator('[data-testid="group-registration-toggle"]');

    // Step 2: Ticket Selection
    this.ticketTypeCards = page.locator('[data-testid="ticket-type-card"]');
    this.ticketQuantityInputs = page.locator('input[type="number"][name*="quantity"]');
    this.totalAmountDisplay = page.locator('[data-testid="total-amount"]');

    // Step 3: Review & Submit
    this.reviewSection = page.locator('[data-testid="review-section"]');
    this.termsCheckbox = page.locator('input[name="agreeToTerms"]');
    this.confirmationMessage = page.locator('[data-testid="confirmation-message"]');
    this.confirmationCode = page.locator('[data-testid="confirmation-code"]');

    // Error messages
    this.errorMessages = page.locator('[role="alert"]');
    this.fieldErrors = page.locator('.error-message');

    // File upload
    this.fileUploadInputs = page.locator('input[type="file"]');
    this.uploadedFilesList = page.locator('[data-testid="uploaded-files"]');
  }

  async goto(eventId: string) {
    await this.page.goto(`/event/${eventId}/register`);
    await this.page.waitForLoadState('networkidle');
  }

  async verifyFormLoaded() {
    await expect(this.formContainer).toBeVisible();
    await expect(this.stepIndicator).toBeVisible();
    await expect(this.firstNameInput).toBeVisible();
  }

  async fillParticipantInfo(participant: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    customFields?: Record<string, string>;
  }) {
    await this.firstNameInput.fill(participant.firstName);
    await this.lastNameInput.fill(participant.lastName);
    await this.emailInput.fill(participant.email);
    
    if (participant.phone) {
      await this.phoneInput.fill(participant.phone);
    }

    // Fill custom fields if provided
    if (participant.customFields) {
      for (const [fieldName, value] of Object.entries(participant.customFields)) {
        const customField = this.page.locator(`input[name="primaryParticipant.customFieldValues.${fieldName}"]`);
        await customField.fill(value);
      }
    }
  }

  async addAdditionalParticipant(participant: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }) {
    await this.addParticipantButton.click();
    
    // Find the last participant form (newly added)
    const participantForms = this.page.locator('[data-testid="additional-participant"]');
    const lastForm = participantForms.last();
    
    await lastForm.locator('input[name*="firstName"]').fill(participant.firstName);
    await lastForm.locator('input[name*="lastName"]').fill(participant.lastName);
    await lastForm.locator('input[name*="email"]').fill(participant.email);
    
    if (participant.phone) {
      await lastForm.locator('input[name*="phone"]').fill(participant.phone);
    }
  }

  async proceedToTicketSelection() {
    await this.nextButton.click();
    await this.page.waitForLoadState('networkidle');
    await expect(this.ticketTypeCards.first()).toBeVisible();
  }

  async selectTickets(ticketSelections: Array<{ ticketTypeId: string; quantity: number }>) {
    for (const selection of ticketSelections) {
      const ticketCard = this.page.locator(`[data-testid="ticket-${selection.ticketTypeId}"]`);
      const quantityInput = ticketCard.locator('input[type="number"]');
      
      await quantityInput.fill(selection.quantity.toString());
      await this.page.waitForTimeout(500); // Wait for price calculation
    }
  }

  async verifyTotalAmount(expectedAmount: number) {
    await expect(this.totalAmountDisplay).toContainText(`$${expectedAmount}`);
  }

  async proceedToReview() {
    await this.nextButton.click();
    await this.page.waitForLoadState('networkidle');
    await expect(this.reviewSection).toBeVisible();
  }

  async reviewAndSubmit() {
    // Verify review section shows correct information
    await expect(this.reviewSection).toBeVisible();
    
    // Accept terms and conditions
    await this.termsCheckbox.check();
    
    // Submit the registration
    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async verifySuccessfulRegistration() {
    await expect(this.confirmationMessage).toBeVisible();
    await expect(this.confirmationCode).toBeVisible();
    
    // Get the confirmation code for verification
    const confirmationCodeText = await this.confirmationCode.textContent();
    expect(confirmationCodeText).toMatch(/[A-Z0-9]{8}/);
    
    return confirmationCodeText;
  }

  async uploadFile(filePath: string, fieldName?: string) {
    const fileInput = fieldName 
      ? this.page.locator(`input[type="file"][name*="${fieldName}"]`)
      : this.fileUploadInputs.first();
    
    await fileInput.setInputFiles(filePath);
    await this.page.waitForTimeout(1000); // Wait for upload to process
  }

  async verifyFileUploaded(fileName: string) {
    await expect(this.uploadedFilesList).toContainText(fileName);
  }

  async verifyValidationError(fieldName: string, expectedError: string) {
    const fieldError = this.page.locator(`[data-testid="${fieldName}-error"]`);
    await expect(fieldError).toContainText(expectedError);
  }

  async verifyCurrentStep(stepNumber: number) {
    const activeStep = this.stepIndicator.locator('.active');
    await expect(activeStep).toContainText(stepNumber.toString());
  }

  async goBackToPreviousStep() {
    await this.backButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async verifyFormValidation() {
    // Try to proceed without filling required fields
    await this.nextButton.click();
    
    // Should see validation errors
    await expect(this.fieldErrors.first()).toBeVisible();
  }

  async verifyResponsiveDesign() {
    // Test mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });
    await expect(this.formContainer).toBeVisible();
    
    // Test tablet viewport
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await expect(this.formContainer).toBeVisible();
    
    // Reset to desktop
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  async verifyAccessibility() {
    // Check for proper ARIA labels and roles
    await expect(this.formContainer).toHaveAttribute('role', 'form');
    
    // Check that form fields have proper labels
    await expect(this.firstNameInput).toHaveAttribute('aria-label');
    await expect(this.emailInput).toHaveAttribute('aria-label');
    
    // Check that error messages are properly associated
    const firstNameError = this.page.locator('[data-testid="firstName-error"]');
    if (await firstNameError.isVisible()) {
      const errorId = await firstNameError.getAttribute('id');
      if (errorId) {
        await expect(this.firstNameInput).toHaveAttribute('aria-describedby', errorId);
      }
    }
  }
} 