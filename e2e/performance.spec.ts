import { test, expect } from '@playwright/test';
import { EventPage } from './pages/EventPage';
import { RegistrationPage } from './pages/RegistrationPage';

test.describe('Performance and Load Testing', () => {
  let eventPage: EventPage;
  let registrationPage: RegistrationPage;

  test.beforeEach(async ({ page }) => {
    eventPage = new EventPage(page);
    registrationPage = new RegistrationPage(page);
  });

  test.describe('Page Load Performance', () => {
    test('should load registration form within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should have good Core Web Vitals metrics', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Measure Core Web Vitals
      const metrics = await page.evaluate(() => {
        return new Promise<Record<string, number>>((resolve) => {
          const vitals: Record<string, number> = {};
          
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            
            entries.forEach((entry) => {
              if (entry.name === 'first-contentful-paint') {
                vitals.FCP = entry.startTime;
              }
              if (entry.entryType === 'largest-contentful-paint') {
                vitals.LCP = entry.startTime;
              }
              if (entry.entryType === 'layout-shift') {
                const layoutShiftEntry = entry as any;
                if (!layoutShiftEntry.hadRecentInput) {
                  vitals.CLS = (vitals.CLS || 0) + layoutShiftEntry.value;
                }
              }
            });
            
            resolve(vitals);
          }).observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
          
          // Fallback timeout
          setTimeout(() => resolve(vitals), 5000);
        });
      });

      // Check Core Web Vitals thresholds
      if (metrics.FCP) {
        expect(metrics.FCP).toBeLessThan(1800); // Good FCP < 1.8s
      }
      if (metrics.LCP) {
        expect(metrics.LCP).toBeLessThan(2500); // Good LCP < 2.5s
      }
      if (metrics.CLS) {
        expect(metrics.CLS).toBeLessThan(0.1); // Good CLS < 0.1
      }
    });

    test('should handle slow network conditions gracefully', async ({ page }) => {
      // Simulate slow 3G network
      await page.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
        await route.continue();
      });

      const startTime = Date.now();
      
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();
      
      const loadTime = Date.now() - startTime;
      
      // Should still load within reasonable time on slow network
      expect(loadTime).toBeLessThan(10000); // 10 seconds max
    });
  });

  test.describe('Form Performance', () => {
    test('should handle rapid form input without lag', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      const startTime = Date.now();
      
      // Rapidly fill form fields
      await registrationPage.firstNameInput.fill('John');
      await registrationPage.lastNameInput.fill('Doe');
      await registrationPage.emailInput.fill('john.doe@example.com');
      await registrationPage.phoneInput.fill('+1234567890');
      
      const fillTime = Date.now() - startTime;
      
      // Form filling should be responsive
      expect(fillTime).toBeLessThan(1000);
    });

    test('should handle large form data efficiently', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Fill form with large amounts of data
      const largeText = 'A'.repeat(1000);
      
      const startTime = Date.now();
      
      await registrationPage.firstNameInput.fill(largeText);
      await registrationPage.lastNameInput.fill(largeText);
      await registrationPage.emailInput.fill('test@example.com');
      
      const fillTime = Date.now() - startTime;
      
      // Should handle large data without significant delay
      expect(fillTime).toBeLessThan(2000);
    });

    test('should validate forms efficiently', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      const startTime = Date.now();
      
      // Trigger validation by attempting to proceed
      await registrationPage.nextButton.click();
      
      // Wait for validation errors to appear
      await page.waitForSelector('[role="alert"]', { timeout: 5000 });
      
      const validationTime = Date.now() - startTime;
      
      // Validation should be fast
      expect(validationTime).toBeLessThan(1000);
    });
  });

  test.describe('Concurrent User Simulation', () => {
    test('should handle multiple simultaneous form submissions', async ({ browser }) => {
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
      ]);

      const pages = await Promise.all(contexts.map(context => context.newPage()));
      
      try {
        // Start registration process in all pages simultaneously
        const registrationPromises = pages.map(async (page, index) => {
          const eventPage = new EventPage(page);
          const registrationPage = new RegistrationPage(page);
          
          await eventPage.goto('test-event-1');
          await eventPage.clickRegister();
          await registrationPage.verifyFormLoaded();
          
          // Fill unique data for each user
          await registrationPage.fillParticipantInfo({
            firstName: `User${index}`,
            lastName: 'Test',
            email: `user${index}@example.com`,
          });
          
          await registrationPage.proceedToTicketSelection();
          
          // Select tickets (this might cause conflicts)
          await registrationPage.selectTickets([
            { ticketTypeId: 'general', quantity: 1 }
          ]);
          
          await registrationPage.proceedToReview();
          
          const startTime = Date.now();
          await registrationPage.reviewAndSubmit();
          const submitTime = Date.now() - startTime;
          
          return { index, submitTime };
        });

        const results = await Promise.allSettled(registrationPromises);
        
        // At least some registrations should succeed
        const successful = results.filter(result => result.status === 'fulfilled');
        expect(successful.length).toBeGreaterThan(0);
        
        // Successful submissions should be reasonably fast
        successful.forEach(result => {
          if (result.status === 'fulfilled') {
            expect(result.value.submitTime).toBeLessThan(5000);
          }
        });
        
      } finally {
        // Cleanup
        await Promise.all(contexts.map(context => context.close()));
      }
    });

    test('should handle rapid successive registrations', async ({ page }) => {
      const registrationTimes: number[] = [];
      
      for (let i = 0; i < 3; i++) {
        await eventPage.goto('test-event-1');
        await eventPage.clickRegister();
        await registrationPage.verifyFormLoaded();
        
        const startTime = Date.now();
        
        await registrationPage.fillParticipantInfo({
          firstName: `User${i}`,
          lastName: 'Test',
          email: `user${i}@example.com`,
        });
        
        await registrationPage.proceedToTicketSelection();
        await registrationPage.selectTickets([
          { ticketTypeId: 'general', quantity: 1 }
        ]);
        
        await registrationPage.proceedToReview();
        await registrationPage.reviewAndSubmit();
        
        const registrationTime = Date.now() - startTime;
        registrationTimes.push(registrationTime);
        
        // Wait for confirmation before next registration
        await registrationPage.verifySuccessfulRegistration();
      }
      
      // Each registration should complete within reasonable time
      registrationTimes.forEach(time => {
        expect(time).toBeLessThan(10000);
      });
      
      // Performance shouldn't degrade significantly
      const avgTime = registrationTimes.reduce((a, b) => a + b, 0) / registrationTimes.length;
      expect(avgTime).toBeLessThan(8000);
    });
  });

  test.describe('Memory and Resource Usage', () => {
    test('should not have memory leaks during extended use', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      // Perform multiple form operations
      for (let i = 0; i < 10; i++) {
        // Fill and clear form multiple times
        await registrationPage.fillParticipantInfo({
          firstName: `User${i}`,
          lastName: 'Test',
          email: `user${i}@example.com`,
        });
        
        // Add and remove participants
        await registrationPage.addParticipantButton.click();
        
        // Clear form
        await registrationPage.firstNameInput.fill('');
        await registrationPage.lastNameInput.fill('');
        await registrationPage.emailInput.fill('');
      }

      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });

      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      // Memory usage shouldn't increase dramatically
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;
        
        // Memory increase should be reasonable (less than 50%)
        expect(memoryIncreasePercent).toBeLessThan(50);
      }
    });

    test('should handle large file uploads efficiently', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Create a moderately large test file (1MB)
      const largeFileContent = 'x'.repeat(1024 * 1024);

      const startTime = Date.now();
      
      // Simulate file upload (if file input exists)
      const fileInputs = await page.locator('input[type="file"]').count();
      
      if (fileInputs > 0) {
        // Create temporary file for upload test
        await page.setInputFiles('input[type="file"]', {
          name: 'large-test.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from(largeFileContent),
        });
        
        const uploadTime = Date.now() - startTime;
        
        // Upload should complete within reasonable time
        expect(uploadTime).toBeLessThan(5000);
      }
    });
  });

  test.describe('Network Resilience', () => {
    test('should handle intermittent network failures', async ({ page }) => {
      let requestCount = 0;
      
      // Simulate intermittent network failures
      await page.route('**/api/**', async (route) => {
        requestCount++;
        
        // Fail every 3rd request
        if (requestCount % 3 === 0) {
          await route.abort('failed');
        } else {
          await route.continue();
        }
      });

      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Form should still be usable despite network issues
      await registrationPage.fillParticipantInfo({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });

      // Should handle network failures gracefully
      await expect(registrationPage.firstNameInput).toHaveValue('John');
    });

    test('should handle slow API responses', async ({ page }) => {
      // Simulate slow API responses
      await page.route('**/api/**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        await route.continue();
      });

      const startTime = Date.now();
      
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();
      
      const loadTime = Date.now() - startTime;
      
      // Should show loading states and eventually load
      expect(loadTime).toBeGreaterThan(2000); // Should take at least 2 seconds due to delay
      expect(loadTime).toBeLessThan(10000); // But not too long
    });

    test('should retry failed requests appropriately', async ({ page }) => {
      let attemptCount = 0;
      
      // Fail first few attempts, then succeed
      await page.route('**/api/registration', async (route) => {
        attemptCount++;
        
        if (attemptCount < 3) {
          await route.abort('failed');
        } else {
          await route.continue();
        }
      });

      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      await registrationPage.fillParticipantInfo({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });

      await registrationPage.proceedToTicketSelection();
      await registrationPage.selectTickets([
        { ticketTypeId: 'general', quantity: 1 }
      ]);

      await registrationPage.proceedToReview();
      
      // Should eventually succeed after retries
      await registrationPage.reviewAndSubmit();
      
      // Should have made multiple attempts
      expect(attemptCount).toBeGreaterThanOrEqual(3);
    });
  });

  test.describe('Browser Resource Limits', () => {
    test('should handle maximum form field limits', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Test maximum group size (if supported)
      const maxParticipants = 10;
      
      for (let i = 0; i < maxParticipants; i++) {
        await registrationPage.addParticipantButton.click();
        
        // Fill participant info
        const participantForm = page.locator('[data-testid="additional-participant"]').nth(i);
        await participantForm.locator('input[name*="firstName"]').fill(`Participant${i}`);
        await participantForm.locator('input[name*="lastName"]').fill('Test');
        await participantForm.locator('input[name*="email"]').fill(`participant${i}@example.com`);
      }

      // Form should still be responsive
      const participantCount = await page.locator('[data-testid="additional-participant"]').count();
      expect(participantCount).toBeLessThanOrEqual(maxParticipants);
    });

    test('should handle DOM complexity gracefully', async ({ page }) => {
      await eventPage.goto('test-event-1');
      await eventPage.clickRegister();
      await registrationPage.verifyFormLoaded();

      // Measure DOM complexity
      const domStats = await page.evaluate(() => {
        return {
          elementCount: document.querySelectorAll('*').length,
          inputCount: document.querySelectorAll('input, select, textarea').length,
          eventListenerCount: (window as any).getEventListeners ? 
            Object.keys((window as any).getEventListeners(document)).length : 0,
        };
      });

      // DOM should not be excessively complex
      expect(domStats.elementCount).toBeLessThan(5000);
      expect(domStats.inputCount).toBeLessThan(500);
    });
  });
}); 