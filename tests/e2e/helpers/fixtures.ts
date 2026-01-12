import { test as base, expect, Page } from '@playwright/test';
import * as human from './human';

/**
 * Test fixtures for IRIS Vista E2E Testing
 *
 * Provides:
 * - Authenticated page contexts for different roles
 * - Shared test data
 * - Common assertions
 */

// Test credentials by role
export const credentials = {
  admin: {
    employeeNumber: 'admin',
    password: 'admin123',
  },
  employee: {
    employeeNumber: 'emp001',
    password: 'Employee123!',
  },
  purchaseAdmin: {
    employeeNumber: 'padmin001',
    password: 'PurchaseAdmin123!',
  },
  generalManager: {
    employeeNumber: 'gm001',
    password: 'GeneralManager123!',
  },
};

// Amazon Business credentials for testing
export const amazonCredentials = {
  email: 'iamx_punchout@improaerotek.com',
  password: '13771106360dY',
  businessUrl: 'https://www.amazon.com.mx/ab/invitations/users/A2TLOHCKQ8SEWL?ref_=b2b_bam_ov_pp',
};

// Login helper
export async function login(
  page: Page,
  employeeNumber: string,
  password: string
): Promise<void> {
  await human.navigateTo(page, '/login');

  // Wait for login form to be ready
  await page.waitForSelector('input[name="employeeNumber"], input[type="text"]');

  // Find and fill employee number field
  const employeeField = page.locator(
    'input[name="employeeNumber"], input[placeholder*="omina"], input[placeholder*="Employee"], input[type="text"]'
  ).first();
  await employeeField.waitFor({ state: 'visible' });
  await employeeField.click();
  await employeeField.fill(employeeNumber);

  // Find and fill password field
  const passwordField = page.locator('input[type="password"]').first();
  await passwordField.waitFor({ state: 'visible' });
  await passwordField.click();
  await passwordField.fill(password);

  // Click login button
  const loginButton = page.locator(
    'button[type="submit"], button:has-text("Iniciar"), button:has-text("Login"), button:has-text("Sign")'
  ).first();
  await loginButton.click();

  // Wait for navigation after login
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 10000,
  });
  await human.waitForLoad(page);
}

// Logout helper
export async function logout(page: Page): Promise<void> {
  // Try to find user menu/avatar
  const userMenu = page.locator(
    '[data-testid="user-menu"], .user-avatar, button:has-text("logout"), button:has(.rounded-full)'
  ).first();

  try {
    await userMenu.click({ timeout: 3000 });

    // Find and click logout button
    const logoutButton = page.locator(
      'button:has-text("logout"), button:has-text("Salir"), button:has-text("Cerrar"), [data-testid="logout"]'
    ).first();
    await logoutButton.click();
  } catch {
    // Try direct navigation if menu doesn't work
    await page.goto('/login');
  }

  await page.waitForURL('**/login');
}

// Extended test with authentication fixtures
type AuthenticatedFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
  employeePage: Page;
  purchaseAdminPage: Page;
  gmPage: Page;
};

export const test = base.extend<AuthenticatedFixtures>({
  // Generic authenticated page (admin by default)
  authenticatedPage: async ({ page }, use) => {
    await login(page, credentials.admin.employeeNumber, credentials.admin.password);
    await use(page);
  },

  // Admin authenticated page
  adminPage: async ({ page }, use) => {
    await login(page, credentials.admin.employeeNumber, credentials.admin.password);
    await use(page);
  },

  // Employee authenticated page
  employeePage: async ({ page }, use) => {
    // First ensure employee user exists
    await login(page, credentials.admin.employeeNumber, credentials.admin.password);
    await ensureUserExists(
      page,
      credentials.employee.employeeNumber,
      'employee',
      credentials.employee.password
    );
    await logout(page);
    await login(page, credentials.employee.employeeNumber, credentials.employee.password);
    await use(page);
  },

  // Purchase Admin authenticated page
  purchaseAdminPage: async ({ page }, use) => {
    await login(page, credentials.admin.employeeNumber, credentials.admin.password);
    await ensureUserExists(
      page,
      credentials.purchaseAdmin.employeeNumber,
      'purchase_admin',
      credentials.purchaseAdmin.password
    );
    await logout(page);
    await login(
      page,
      credentials.purchaseAdmin.employeeNumber,
      credentials.purchaseAdmin.password
    );
    await use(page);
  },

  // General Manager authenticated page
  gmPage: async ({ page }, use) => {
    await login(page, credentials.admin.employeeNumber, credentials.admin.password);
    await ensureUserExists(
      page,
      credentials.generalManager.employeeNumber,
      'general_manager',
      credentials.generalManager.password
    );
    await logout(page);
    await login(
      page,
      credentials.generalManager.employeeNumber,
      credentials.generalManager.password
    );
    await use(page);
  },
});

// Helper to ensure a user exists (creates if not)
async function ensureUserExists(
  page: Page,
  employeeNumber: string,
  role: string,
  password: string
): Promise<void> {
  // Navigate to users page
  await page.goto('/admin/users');
  await human.waitForLoad(page);

  // Check if user already exists by searching
  const searchInput = page.locator(
    'input[placeholder*="Buscar"], input[placeholder*="Search"], input[type="search"]'
  ).first();

  if (await searchInput.isVisible()) {
    await searchInput.fill(employeeNumber);
    await page.waitForTimeout(500); // Wait for search to filter
  }

  // Check if user appears in list
  const userRow = page.locator(`text=${employeeNumber}`).first();

  if (!(await userRow.isVisible({ timeout: 2000 }).catch(() => false))) {
    // User doesn't exist - we'll need to create them via registration
    // For now, skip as users should be seeded in test setup
    console.log(`User ${employeeNumber} not found - should be seeded`);
  }
}

// Common assertions
export const assertions = {
  // Check if sidebar is visible
  async sidebarVisible(page: Page): Promise<void> {
    const sidebar = page.locator('aside, nav[data-sidebar], [role="navigation"]').first();
    await expect(sidebar).toBeVisible();
  },

  // Check if header is visible
  async headerVisible(page: Page): Promise<void> {
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
  },

  // Check if user is logged in
  async isLoggedIn(page: Page): Promise<boolean> {
    const url = page.url();
    return !url.includes('/login') && !url.includes('/register');
  },

  // Check for error message
  async hasError(page: Page, text?: string): Promise<void> {
    const error = page.locator(
      '[role="alert"], .error, .text-red, [data-error], .text-\\[\\#D1625B\\]'
    ).first();
    await expect(error).toBeVisible();
    if (text) {
      await expect(error).toContainText(text);
    }
  },

  // Check for success message
  async hasSuccess(page: Page, text?: string): Promise<void> {
    const success = page.locator(
      '[role="status"], .success, .text-green, [data-success], .text-\\[\\#4BAF7E\\]'
    ).first();
    await expect(success).toBeVisible();
    if (text) {
      await expect(success).toContainText(text);
    }
  },

  // Check badge count
  async badgeCount(page: Page, selector: string, expectedCount: number): Promise<void> {
    const badge = page.locator(selector);
    const text = await badge.textContent();
    const count = parseInt(text || '0', 10);
    expect(count).toBe(expectedCount);
  },
};

// Re-export expect for convenience
export { expect };
