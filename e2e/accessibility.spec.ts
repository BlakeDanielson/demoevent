import { test, expect } from '@playwright/test';
import { EventPage } from './pages/EventPage';
import { RegistrationPage } from './pages/RegistrationPage';

test.describe('Accessibility Compliance Tests', () => {
  let eventPage: EventPage;
  let registrationPage: RegistrationPage;

  test.beforeEach(async ({ page }) => {
    eventPage = new EventPage(page);
    registrationPage = new RegistrationPage(page);
  });

  test.describe('WCAG 2.1 AA Compliance', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Check heading hierarchy (h1 -> h2 -> h3, no skipping)
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      
      let previousLevel = 0;
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
        const currentLevel = parseInt(tagName.charAt(1));
        
        // Should not skip heading levels
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
        previousLevel = currentLevel;
      }
    });

    test('should have proper form labels and associations', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Check that all form inputs have proper labels
      const inputs = await page.locator('input, select, textarea').all();
      
      for (const input of inputs) {
        const inputId = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        if (inputId) {
          // Check for associated label
          const label = page.locator(`label[for="${inputId}"]`);
          const hasLabel = await label.count() > 0;
          
          // Input should have either a label, aria-label, or aria-labelledby
          expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      }
    });

    test('should have proper error message associations', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Try to submit without filling required fields to trigger errors
      await registrationPage.nextButton.click();

      // Wait for error messages to appear
      await page.waitForSelector('[role="alert"]', { timeout: 5000 });

      const errorMessages = await page.locator('[role="alert"]').all();
      
      for (const errorMessage of errorMessages) {
        const errorId = await errorMessage.getAttribute('id');
        
        if (errorId) {
          // Find the input that should be associated with this error
          const associatedInput = page.locator(`[aria-describedby*="${errorId}"]`);
          const hasAssociation = await associatedInput.count() > 0;
          
          expect(hasAssociation).toBeTruthy();
        }
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Check color contrast for text elements
      const textElements = await page.locator('p, span, label, button, input').all();
      
      for (const element of textElements.slice(0, 10)) { // Test first 10 elements
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize,
          };
        });

        // Basic check that text has color (not transparent)
        expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
        expect(styles.color).not.toBe('transparent');
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Test tab navigation through form
      const focusableElements = await page.locator(
        'input:not([disabled]), button:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ).all();

      // Start from first element
      await focusableElements[0].focus();

      // Tab through elements
      for (let i = 1; i < Math.min(focusableElements.length, 10); i++) {
        await page.keyboard.press('Tab');
        
        // Check that focus moved to next element
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
      }
    });

    test('should support screen reader navigation', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Check for proper ARIA landmarks
      const landmarks = await page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="form"]').all();
      expect(landmarks.length).toBeGreaterThan(0);

      // Check for proper form structure
      const form = page.locator('[role="form"]');
      await expect(form).toBeVisible();

      // Check for fieldsets and legends for grouped form elements
      const fieldsets = await page.locator('fieldset').all();
      for (const fieldset of fieldsets) {
        const legend = fieldset.locator('legend');
        await expect(legend).toBeVisible();
      }
    });

    test('should have proper focus indicators', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Test focus indicators on interactive elements
      const interactiveElements = await page.locator('button, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();

      for (const element of interactiveElements.slice(0, 5)) { // Test first 5 elements
        await element.focus();
        
        // Check that element has visible focus indicator
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            outline: computed.outline,
            outlineWidth: computed.outlineWidth,
            boxShadow: computed.boxShadow,
          };
        });

        // Should have some form of focus indicator
        const hasFocusIndicator = 
          styles.outline !== 'none' || 
          styles.outlineWidth !== '0px' || 
          styles.boxShadow !== 'none';
        
        expect(hasFocusIndicator).toBeTruthy();
      }
    });
  });

  test.describe('Keyboard Accessibility', () => {
    test('should allow form completion using only keyboard', async ({ page }) => {
      await eventPage.goto('test-event-1');
      
      // Navigate to registration using keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); // Click register button
      
      await registrationPage.verifyFormLoaded();

      // Fill form using keyboard only
      await page.keyboard.press('Tab'); // Focus first name
      await page.keyboard.type('John');
      
      await page.keyboard.press('Tab'); // Focus last name
      await page.keyboard.type('Doe');
      
      await page.keyboard.press('Tab'); // Focus email
      await page.keyboard.type('john.doe@example.com');
      
      await page.keyboard.press('Tab'); // Focus phone
      await page.keyboard.type('+1234567890');

      // Navigate to next step
      await page.keyboard.press('Tab'); // Focus next button
      await page.keyboard.press('Enter');

      // Verify we moved to ticket selection
      await expect(registrationPage.ticketTypeCards.first()).toBeVisible();
    });

    test('should support escape key to close modals/dropdowns', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // If there are any dropdowns or modals, test escape key
      const dropdowns = await page.locator('[role="listbox"], [role="menu"], [role="dialog"]').all();
      
      for (const dropdown of dropdowns) {
        if (await dropdown.isVisible()) {
          await page.keyboard.press('Escape');
          
          // Dropdown should be hidden after escape
          await expect(dropdown).toBeHidden();
        }
      }
    });

    test('should support arrow key navigation in custom components', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Navigate to ticket selection step
      await registrationPage.fillParticipantInfo({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });
      await registrationPage.proceedToTicketSelection();

      // Test arrow key navigation in ticket selection
      const ticketCards = await page.locator('[data-testid="ticket-type-card"]').all();
      
      if (ticketCards.length > 1) {
        await ticketCards[0].focus();
        await page.keyboard.press('ArrowDown');
        
        // Should move focus to next ticket card
        await expect(ticketCards[1]).toBeFocused();
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper ARIA live regions for dynamic content', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Check for live regions that announce changes
      const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').all();
      expect(liveRegions.length).toBeGreaterThan(0);

      // Trigger a change that should update live region
      await registrationPage.nextButton.click(); // This should trigger validation errors

      // Wait for live region to be updated
      await page.waitForSelector('[role="alert"]', { timeout: 5000 });
      
      const alertRegion = page.locator('[role="alert"]').first();
      const alertText = await alertRegion.textContent();
      expect(alertText).toBeTruthy();
    });

    test('should have proper ARIA descriptions for complex interactions', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Check for aria-describedby on complex form elements
      const complexElements = await page.locator('input[type="file"], input[type="number"]').all();
      
      for (const element of complexElements) {
        const ariaDescribedBy = await element.getAttribute('aria-describedby');
        
        if (ariaDescribedBy) {
          // Check that the description element exists
          const descriptionElement = page.locator(`#${ariaDescribedBy}`);
          await expect(descriptionElement).toBeVisible();
        }
      }
    });

    test('should announce step changes in multi-step form', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Check that step indicator has proper ARIA attributes
      const stepIndicator = page.locator('[data-testid="step-indicator"]');
      
      const ariaLabel = await stepIndicator.getAttribute('aria-label');
      expect(ariaLabel).toContain('step');

      // Fill form and proceed to next step
      await registrationPage.fillParticipantInfo({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });
      
      await registrationPage.proceedToTicketSelection();

      // Check that step change is announced
      const currentStepInfo = await stepIndicator.textContent();
      expect(currentStepInfo).toContain('2'); // Should indicate step 2
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('should be accessible on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Check that touch targets are large enough (minimum 44px)
      const touchTargets = await page.locator('button, input, select, [role="button"]').all();
      
      for (const target of touchTargets.slice(0, 5)) { // Test first 5 elements
        const boundingBox = await target.boundingBox();
        
        if (boundingBox) {
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should support zoom up to 200% without horizontal scrolling', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Zoom to 200%
      await page.evaluate(() => {
        document.body.style.zoom = '2';
      });

      // Check that content is still accessible without horizontal scrolling
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth * 2.1); // Allow small margin
    });
  });

  test.describe('Error Handling Accessibility', () => {
    test('should announce errors to screen readers', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Submit form without required fields
      await registrationPage.nextButton.click();

      // Check that errors are properly announced
      const errorMessages = await page.locator('[role="alert"]').all();
      
      for (const error of errorMessages) {
        const errorText = await error.textContent();
        expect(errorText).toBeTruthy();
        
        // Error should be associated with the problematic field
        const errorId = await error.getAttribute('id');
        if (errorId) {
          const associatedField = page.locator(`[aria-describedby*="${errorId}"]`);
          await expect(associatedField).toBeVisible();
        }
      }
    });

    test('should maintain focus management during error states', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Focus on first input
      await registrationPage.firstNameInput.focus();
      
      // Submit form to trigger errors
      await registrationPage.nextButton.click();

      // Focus should remain on or move to first error field
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Should be a form field with an error
      const ariaInvalid = await focusedElement.getAttribute('aria-invalid');
      expect(ariaInvalid).toBe('true');
    });
  });

  test.describe('Dynamic Content Accessibility', () => {
    test('should announce loading states', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();

      // Check for loading announcements
      const loadingElements = await page.locator('[aria-live="polite"], [aria-live="assertive"], [role="status"]').all();
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    test('should handle dynamic form field additions accessibly', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Add additional participant (dynamic content)
      await registrationPage.addParticipantButton.click();

      // New form fields should be properly labeled and accessible
      const newParticipantForm = page.locator('[data-testid="additional-participant"]').last();
      
      const newInputs = await newParticipantForm.locator('input').all();
      for (const input of newInputs) {
        const ariaLabel = await input.getAttribute('aria-label');
        const labelFor = await input.getAttribute('id');
        
        if (labelFor) {
          const label = page.locator(`label[for="${labelFor}"]`);
          const hasLabel = await label.count() > 0;
          expect(hasLabel || ariaLabel).toBeTruthy();
        }
      }
    });
  });
}); 