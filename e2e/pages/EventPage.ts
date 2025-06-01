import { Page, Locator, expect } from '@playwright/test';

export class EventPage {
  readonly page: Page;
  readonly eventTitle: Locator;
  readonly eventDescription: Locator;
  readonly eventDate: Locator;
  readonly eventLocation: Locator;
  readonly registerButton: Locator;
  readonly eventImage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.eventTitle = page.locator('[data-testid="event-title"]');
    this.eventDescription = page.locator('[data-testid="event-description"]');
    this.eventDate = page.locator('[data-testid="event-date"]');
    this.eventLocation = page.locator('[data-testid="event-location"]');
    this.registerButton = page.locator('[data-testid="register-button"]');
    this.eventImage = page.locator('[data-testid="event-image"]');
  }

  async goto(eventId: string) {
    await this.page.goto(`/event/${eventId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async clickRegister() {
    await this.registerButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async verifyEventDetails(expectedDetails: {
    title?: string;
    description?: string;
    date?: string;
    location?: string;
  }) {
    if (expectedDetails.title) {
      await expect(this.eventTitle).toContainText(expectedDetails.title);
    }
    if (expectedDetails.description) {
      await expect(this.eventDescription).toContainText(expectedDetails.description);
    }
    if (expectedDetails.date) {
      await expect(this.eventDate).toContainText(expectedDetails.date);
    }
    if (expectedDetails.location) {
      await expect(this.eventLocation).toContainText(expectedDetails.location);
    }
  }

  async verifyRegisterButtonVisible() {
    await expect(this.registerButton).toBeVisible();
    await expect(this.registerButton).toBeEnabled();
  }

  async verifyPageLoaded() {
    await expect(this.eventTitle).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }
} 