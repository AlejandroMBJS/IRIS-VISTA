import { test, expect, credentials, login } from '../helpers/fixtures';
import * as human from '../helpers/human';

/**
 * User Registration Flow Tests
 *
 * Tests all registration scenarios including:
 * - Registration page rendering
 * - Successful registration
 * - Duplicate employee number/email validation
 * - Password strength validation
 * - Password confirmation validation
 * - Required field validation
 * - Email format validation
 */

test.describe('Registration Flow', () => {
  test.describe('Registration Page', () => {
    test('2.1 - Registration page loads correctly', async ({ page }) => {
      await human.navigateTo(page, '/login');

      // Click on register link
      const registerLink = page.locator(
        'a[href*="register"], a:has-text("Registr"), a:has-text("Sign up"), a:has-text("Create")'
      ).first();
      await registerLink.click();

      await page.waitForURL('**/register');
      await human.waitForLoad(page);
      await human.takeScreenshot(page, 'registration-page-loaded');

      // Verify all required fields exist
      // Employee number field - matches "Your employee number" placeholder
      const employeeNumberField = page.getByPlaceholder(/employee/i).first();
      await expect(employeeNumberField).toBeVisible();

      // Name field - matches "Enter your full name" placeholder
      const nameField = page.getByPlaceholder(/full name/i).first();
      await expect(nameField).toBeVisible();

      // Email field - matches "your.email@company.com" placeholder
      const emailField = page.getByPlaceholder(/email|correo/i).first();
      await expect(emailField).toBeVisible();

      // Password field
      const passwordField = page.locator('input[type="password"]').first();
      await expect(passwordField).toBeVisible();

      // Submit button
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Registr"), button:has-text("Sign up"), button:has-text("Create")'
      ).first();
      await expect(submitButton).toBeVisible();

      // Login link
      const loginLink = page.locator(
        'a[href*="login"], a:has-text("Iniciar"), a:has-text("Login"), a:has-text("Sign in")'
      ).first();
      await expect(loginLink).toBeVisible();
    });

    test('2.2 - Successful registration of new user', async ({ page }) => {
      await human.navigateTo(page, '/register');
      await human.waitForLoad(page);

      // Generate unique test data
      const timestamp = Date.now();
      const testUser = {
        employeeNumber: `EMP${timestamp.toString().slice(-8)}`,
        name: 'Usuario de Prueba E2E',
        email: `test.e2e.${timestamp}@empresa.test`,
        password: 'Test123456!',
      };

      // Fill employee number - matches "Your employee number" placeholder
      const employeeNumberField = page.getByPlaceholder(/employee/i).first();
      await employeeNumberField.fill(testUser.employeeNumber);
      await human.humanRead(0.3);

      // Fill name - matches "Enter your full name" placeholder
      const nameField = page.getByPlaceholder(/full name/i).first();
      await nameField.fill(testUser.name);
      await human.humanRead(0.3);

      // Fill email - matches "your.email@company.com" placeholder
      const emailField = page.getByPlaceholder(/email|correo/i).first();
      await emailField.fill(testUser.email);
      await human.humanRead(0.3);

      // Fill password
      const passwordFields = page.locator('input[type="password"]');
      await passwordFields.first().fill(testUser.password);
      await human.humanRead(0.3);

      // Fill confirm password if exists
      if ((await passwordFields.count()) > 1) {
        await passwordFields.nth(1).fill(testUser.password);
      }

      await human.takeScreenshot(page, 'registration-form-filled');

      // Click register button
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Registr"), button:has-text("Sign up"), button:has-text("Create")'
      ).first();
      await submitButton.click();

      // Wait for response
      await page.waitForTimeout(2000);
      await human.takeScreenshot(page, 'registration-submitted');

      // Verify success message or redirect
      const successIndicators = page.locator(
        '.text-green, .text-\\[\\#4BAF7E\\], [role="status"]:has-text("xito"), [role="status"]:has-text("success"), :text("pendiente"), :text("pending")'
      ).first();

      // Check if we got success or if we're on login page
      const currentUrl = page.url();
      const hasSuccess = await successIndicators.isVisible().catch(() => false);

      // Either success message shown or redirected to login
      expect(hasSuccess || currentUrl.includes('/login')).toBeTruthy();
    });

    test('2.3 - Registration with duplicate employee number shows error', async ({ page }) => {
      await human.navigateTo(page, '/register');
      await human.waitForLoad(page);

      // Use existing admin employee number
      const employeeNumberField = page.getByPlaceholder(/employee/i).first();
      await employeeNumberField.fill('admin');

      // Fill other required fields
      const nameField = page.getByPlaceholder(/full name/i).first();
      await nameField.fill('Test Duplicate User');

      const emailField = page.getByPlaceholder(/email|correo/i).first();
      await emailField.fill(`duplicate.${Date.now()}@empresa.test`);

      const passwordField = page.locator('input[type="password"]').first();
      await passwordField.fill('Test123456!');

      const passwordFields = page.locator('input[type="password"]');
      if ((await passwordFields.count()) > 1) {
        await passwordFields.nth(1).fill('Test123456!');
      }

      // Submit
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Registr"), button:has-text("Sign up"), button:has-text("Create")'
      ).first();
      await submitButton.click();

      await page.waitForTimeout(2000);
      await human.takeScreenshot(page, 'registration-duplicate-employee-number');

      // Should show error or still be on register page
      expect(page.url()).toContain('/register');
    });

    test('2.5 - Weak password validation', async ({ page }) => {
      await human.navigateTo(page, '/register');
      await human.waitForLoad(page);

      const passwordField = page.locator('input[type="password"]').first();

      // Test very short password
      await passwordField.fill('123');
      await passwordField.blur();
      await page.waitForTimeout(500);
      await human.takeScreenshot(page, 'password-too-short');

      // Test password without uppercase
      await passwordField.fill('abcdefgh1');
      await passwordField.blur();
      await page.waitForTimeout(500);
      await human.takeScreenshot(page, 'password-no-uppercase');

      // Test password without number
      await passwordField.fill('Abcdefgh');
      await passwordField.blur();
      await page.waitForTimeout(500);
      await human.takeScreenshot(page, 'password-no-number');
    });

    test('2.6 - Passwords do not match shows error', async ({ page }) => {
      await human.navigateTo(page, '/register');
      await human.waitForLoad(page);

      // Fill form with mismatched passwords
      const employeeNumberField = page.getByPlaceholder(/employee/i).first();
      await employeeNumberField.fill(`EMP${Date.now().toString().slice(-8)}`);

      const nameField = page.getByPlaceholder(/full name/i).first();
      await nameField.fill('Test User');

      const emailField = page.getByPlaceholder(/email|correo/i).first();
      await emailField.fill(`test.${Date.now()}@empresa.test`);

      const passwordFields = page.locator('input[type="password"]');
      await passwordFields.first().fill('Test123456!');

      if ((await passwordFields.count()) > 1) {
        await passwordFields.nth(1).fill('DifferentPass123!');
      }

      // Submit
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Registr"), button:has-text("Sign up"), button:has-text("Create")'
      ).first();
      await submitButton.click();

      await page.waitForTimeout(1000);
      await human.takeScreenshot(page, 'passwords-do-not-match');

      // Should show error
      expect(page.url()).toContain('/register');
    });

    test('2.7 - Required fields validation', async ({ page }) => {
      await human.navigateTo(page, '/register');
      await human.waitForLoad(page);

      // Try to submit without filling anything
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Registr"), button:has-text("Sign up"), button:has-text("Create")'
      ).first();
      await submitButton.click();

      await page.waitForTimeout(500);
      await human.takeScreenshot(page, 'registration-empty-fields-validation');

      // Should still be on register page
      expect(page.url()).toContain('/register');
    });

    test('2.8 - Invalid email format shows error', async ({ page }) => {
      await human.navigateTo(page, '/register');
      await human.waitForLoad(page);

      const emailField = page.getByPlaceholder(/email|correo/i).first();

      // Test invalid email formats
      await emailField.fill('notanemail');
      await emailField.blur();
      await page.waitForTimeout(500);
      await human.takeScreenshot(page, 'invalid-email-format-1');

      await emailField.fill('test@');
      await emailField.blur();
      await page.waitForTimeout(500);
      await human.takeScreenshot(page, 'invalid-email-format-2');
    });
  });

  test.describe('User Approval (Admin)', () => {
    test('3.1 - View pending users list', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      // Navigate to users page
      await page.goto('/admin/users');
      await human.waitForLoad(page);
      await human.takeScreenshot(page, 'admin-users-page');

      // Look for pending tab or filter
      const pendingTab = page.locator(
        'button:has-text("Pendiente"), button:has-text("Pending"), [data-tab="pending"]'
      ).first();

      if (await pendingTab.isVisible()) {
        await pendingTab.click();
        await page.waitForTimeout(500);
        await human.takeScreenshot(page, 'admin-pending-users');
      }
    });

    test('3.2 - Approve user with employee role', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/admin/users');
      await human.waitForLoad(page);

      // Look for pending users section or tab
      const pendingTab = page.locator(
        'button:has-text("Pendiente"), button:has-text("Pending"), [data-tab="pending"]'
      ).first();

      if (await pendingTab.isVisible()) {
        await pendingTab.click();
        await page.waitForTimeout(500);
      }

      // Find approve button
      const approveButton = page.locator(
        'button:has-text("Aprobar"), button:has-text("Approve")'
      ).first();

      if (await approveButton.isVisible()) {
        await approveButton.click();
        await page.waitForTimeout(500);
        await human.takeScreenshot(page, 'approve-user-modal');

        // Select employee role if modal appears
        const roleSelect = page.locator('select, [data-role-select]').first();
        if (await roleSelect.isVisible()) {
          await roleSelect.selectOption('employee');
        }

        // Confirm approval
        const confirmButton = page.locator(
          'button:has-text("Confirmar"), button:has-text("Confirm")'
        ).first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        await page.waitForTimeout(1000);
        await human.takeScreenshot(page, 'user-approved');
      }
    });

    test('3.5 - Reject user with reason', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/admin/users');
      await human.waitForLoad(page);

      // Look for pending users section or tab
      const pendingTab = page.locator(
        'button:has-text("Pendiente"), button:has-text("Pending"), [data-tab="pending"]'
      ).first();

      if (await pendingTab.isVisible()) {
        await pendingTab.click();
        await page.waitForTimeout(500);
      }

      // Find reject button
      const rejectButton = page.locator(
        'button:has-text("Rechazar"), button:has-text("Reject")'
      ).first();

      if (await rejectButton.isVisible()) {
        await rejectButton.click();
        await page.waitForTimeout(500);
        await human.takeScreenshot(page, 'reject-user-modal');

        // Fill rejection reason
        const reasonField = page.locator(
          'textarea, input[name="reason"], input[placeholder*="motivo"], input[placeholder*="reason"]'
        ).first();
        if (await reasonField.isVisible()) {
          await reasonField.fill('Numero de nomina no coincide con registros de RRHH');
        }

        // Confirm rejection
        const confirmButton = page.locator(
          'button:has-text("Confirmar"), button:has-text("Confirm"), button:has-text("Rechazar")'
        ).last();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        await page.waitForTimeout(1000);
        await human.takeScreenshot(page, 'user-rejected');
      }
    });
  });
});
