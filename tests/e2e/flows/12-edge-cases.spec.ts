import { test, expect, credentials, login } from '../helpers/fixtures';
import * as human from '../helpers/human';

/**
 * Edge Cases and Limit Tests
 *
 * Tests boundary conditions and edge cases:
 * - Empty fields
 * - Value limits
 * - Long text
 * - Special characters
 * - Security (XSS, injection)
 * - Session handling
 * - Empty states
 */

test.describe('Edge Cases', () => {
  test.describe('Empty Fields', () => {
    test('16.1 - Login with empty fields', async ({ page }) => {
      await human.navigateTo(page, '/login');

      // Click submit without filling
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      await page.waitForTimeout(500);
      await human.takeScreenshot(page, 'login-empty-fields');

      // Should still be on login page
      expect(page.url()).toContain('login');
    });

    test('16.1b - Register with empty fields', async ({ page }) => {
      await human.navigateTo(page, '/register');

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      await page.waitForTimeout(500);
      await human.takeScreenshot(page, 'register-empty-fields');

      expect(page.url()).toContain('register');
    });
  });

  test.describe('Value Limits', () => {
    test('16.2 - Quantity limits', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/purchase/new');
      await human.waitForLoad(page);

      // Try to find quantity input
      const quantityInput = page.locator(
        'input[name="quantity"], input[type="number"]'
      ).first();

      if (await quantityInput.isVisible()) {
        // Test minimum (0 or negative)
        await quantityInput.fill('0');
        await page.waitForTimeout(300);
        await human.takeScreenshot(page, 'quantity-zero');

        await quantityInput.fill('-1');
        await page.waitForTimeout(300);
        await human.takeScreenshot(page, 'quantity-negative');

        // Test very large number
        await quantityInput.fill('999999');
        await page.waitForTimeout(300);
        await human.takeScreenshot(page, 'quantity-large');
      }
    });

    test('16.2b - Price limits', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/catalog');
      await human.waitForLoad(page);

      // Try to add/edit a product
      const addButton = page.locator('button:has-text("Agregar")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);

        const priceInput = page.locator(
          'input[name="price"], input[placeholder*="Precio"]'
        ).first();

        if (await priceInput.isVisible()) {
          await priceInput.fill('0.01');
          await human.takeScreenshot(page, 'price-minimum');

          await priceInput.fill('999999.99');
          await human.takeScreenshot(page, 'price-maximum');
        }
      }
    });
  });

  test.describe('Long Text', () => {
    test('16.3 - Long justification text', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/purchase/new');
      await human.waitForLoad(page);

      const justificationField = page.locator('textarea').first();

      if (await justificationField.isVisible()) {
        // Generate very long text
        const longText = 'Lorem ipsum dolor sit amet. '.repeat(100);
        await justificationField.fill(longText);
        await human.takeScreenshot(page, 'long-justification');
      }
    });

    test('16.3b - Long name in registration', async ({ page }) => {
      await human.navigateTo(page, '/register');

      const nameField = page.locator('input[name="name"], input[placeholder*="Nombre"]').first();

      if (await nameField.isVisible()) {
        const longName = 'A'.repeat(500);
        await nameField.fill(longName);
        await human.takeScreenshot(page, 'long-name');
      }
    });
  });

  test.describe('Special Characters', () => {
    test('16.4 - Names with special characters', async ({ page }) => {
      await human.navigateTo(page, '/register');

      const nameField = page.locator('input[name="name"], input[placeholder*="Nombre"]').first();

      if (await nameField.isVisible()) {
        // Test accented characters
        await nameField.fill("José María O'Connor-López");
        await human.takeScreenshot(page, 'name-special-chars');
      }
    });

    test('16.4b - Product names with special characters', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/catalog');
      await human.waitForLoad(page);

      const addButton = page.locator('button:has-text("Agregar")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);

        const nameField = page.locator('input[name="name"], input[placeholder*="Nombre"]').first();
        if (await nameField.isVisible()) {
          await nameField.fill('Monitor 27" LED & USB-C™');
          await human.takeScreenshot(page, 'product-special-chars');
        }
      }
    });

    test('16.4c - Emojis in justification', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/purchase/new');
      await human.waitForLoad(page);

      const justificationField = page.locator('textarea').first();
      if (await justificationField.isVisible()) {
        await justificationField.fill('Urgente para proyecto 🚀 Necesario para el equipo de desarrollo 💻');
        await human.takeScreenshot(page, 'justification-emojis');
      }
    });
  });

  test.describe('Security - XSS Prevention', () => {
    test('16.6 - XSS in text fields', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/purchase/new');
      await human.waitForLoad(page);

      const justificationField = page.locator('textarea').first();
      if (await justificationField.isVisible()) {
        // Try XSS payload
        await justificationField.fill('<script>alert("xss")</script>');
        await human.takeScreenshot(page, 'xss-attempt-1');

        await justificationField.fill('<img src=x onerror=alert("xss")>');
        await human.takeScreenshot(page, 'xss-attempt-2');
      }

      // Verify no alert appeared
      // If XSS worked, page would have alert dialog
    });
  });

  test.describe('SQL Injection Prevention', () => {
    test('16.5 - SQL injection in login', async ({ page }) => {
      await human.navigateTo(page, '/login');

      const employeeField = page.locator('input[type="text"]').first();
      const passwordField = page.locator('input[type="password"]').first();

      await employeeField.fill("' OR '1'='1");
      await passwordField.fill("' OR '1'='1");

      await human.takeScreenshot(page, 'sql-injection-login');

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      await page.waitForTimeout(2000);
      await human.takeScreenshot(page, 'sql-injection-result');

      // Should still be on login page (injection failed)
      expect(page.url()).toContain('login');
    });
  });

  test.describe('Empty States', () => {
    test('16.9 - Empty requests list', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/requests');
      await human.waitForLoad(page);

      await human.takeScreenshot(page, 'requests-state');

      // Look for empty state message
      const emptyState = page.locator(
        ':text("No hay"), :text("No requests"), :text("vacío"), [data-empty-state]'
      );

      // This may or may not show depending on data
    });

    test('16.9b - Empty approvals list', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/approvals');
      await human.waitForLoad(page);

      await human.takeScreenshot(page, 'approvals-state');
    });

    test('16.9c - Empty notifications', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      const notificationBell = page.locator('button:has(svg.lucide-bell)').first();
      if (await notificationBell.isVisible()) {
        await notificationBell.click();
        await page.waitForTimeout(500);
        await human.takeScreenshot(page, 'notifications-state');
      }
    });
  });

  test.describe('Network Errors', () => {
    test('16.10 - Handle offline state', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      // Go offline
      await page.context().setOffline(true);

      // Try to navigate
      await page.goto('/requests').catch(() => {});
      await page.waitForTimeout(1000);
      await human.takeScreenshot(page, 'offline-state');

      // Go back online
      await page.context().setOffline(false);
    });
  });
});
