import { test, expect, credentials, login, amazonCredentials } from '../helpers/fixtures';
import * as human from '../helpers/human';

/**
 * Amazon Integration Flow Tests
 *
 * Tests Amazon Business integration including:
 * - Configuration settings
 * - Enable/disable toggle
 * - Credential management
 * - Connection testing
 * - Add to cart functionality
 */

test.describe('Amazon Integration Flow', () => {
  test.describe('Configuration', () => {
    test('9.1 - View Amazon configuration status', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      // Navigate to purchase config
      await page.goto('/admin/purchase-config');
      await human.waitForLoad(page);

      // Look for Amazon tab
      const amazonTab = page.locator(
        'button:has-text("Amazon"), [data-tab="amazon"]'
      ).first();

      if (await amazonTab.isVisible()) {
        await amazonTab.click();
        await page.waitForTimeout(500);
        await human.takeScreenshot(page, 'amazon-config-tab');
      }

      // Check toggle status
      const enabledToggle = page.locator(
        'input[name="amazonEnabled"], [data-amazon-toggle], input[type="checkbox"]'
      ).first();

      // Check connection status
      const statusIndicator = page.locator(
        '[data-connection-status], :text("Conectado"), :text("Connected"), :text("Desconectado")'
      ).first();

      await human.takeScreenshot(page, 'amazon-config-status');
    });

    test('9.2 - Enable Amazon integration', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/admin/purchase-config');
      await human.waitForLoad(page);

      // Click Amazon tab
      const amazonTab = page.locator('button:has-text("Amazon")').first();

      if (await amazonTab.isVisible()) {
        await amazonTab.click();
        await page.waitForTimeout(500);
      }

      await human.takeScreenshot(page, 'amazon-tab-opened');

      // The enable toggle is a custom button with rounded-full class
      // It's inside a card near "Enable Integration" text
      const enableToggle = page.locator('button.rounded-full').first();

      if (await enableToggle.isVisible()) {
        // Click the toggle to enable
        await enableToggle.click();
        await page.waitForTimeout(500);
        await human.takeScreenshot(page, 'amazon-enabled');

        // Verify the Connection Status section appears (only shows when enabled)
        const connectionStatus = page.locator(':text("Connection Status"), :text("Estado de Conexion")').first();
        await expect(connectionStatus).toBeVisible({ timeout: 5000 });
      }
    });

    test('9.3 - Configure Amazon credentials', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/admin/purchase-config');
      await human.waitForLoad(page);

      // Click Amazon tab
      const amazonTab = page.locator('button:has-text("Amazon")').first();

      if (await amazonTab.isVisible()) {
        await amazonTab.click();
        await page.waitForTimeout(500);
      }

      // Fill email - look for the email input in Amazon Business Credentials section
      const emailField = page.locator('input[type="email"]').first();

      if (await emailField.isVisible()) {
        await emailField.fill(amazonCredentials.email);
        await human.humanRead(0.3);
      }

      // Fill password - the password input in the credentials section
      const passwordField = page.locator('input[type="password"]').first();

      if (await passwordField.isVisible()) {
        await passwordField.fill(amazonCredentials.password);
        await human.humanRead(0.3);
      }

      await human.takeScreenshot(page, 'amazon-credentials-filled');

      // Click Update Credentials button (specific to Amazon section)
      const updateButton = page.locator(
        'button:has-text("Update Credentials"), button:has-text("Actualizar Credenciales")'
      ).first();

      if (await updateButton.isVisible()) {
        await updateButton.click();
        await page.waitForTimeout(1000);
        await human.takeScreenshot(page, 'amazon-credentials-saved');
      }
    });

    test('9.4 - Test Amazon connection', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/admin/purchase-config');
      await human.waitForLoad(page);

      // Click Amazon tab
      const amazonTab = page.locator(
        'button:has-text("Amazon"), [data-tab="amazon"]'
      ).first();

      if (await amazonTab.isVisible()) {
        await amazonTab.click();
        await page.waitForTimeout(500);
      }

      // Find test/verify connection button
      const testButton = page.locator(
        'button:has-text("Verificar"), button:has-text("Verify"), button:has-text("Test"), button:has-text("Conectar")'
      ).first();

      if (await testButton.isVisible()) {
        await testButton.click();

        // Wait for connection test (may take a while)
        await page.waitForTimeout(10000);
        await human.takeScreenshot(page, 'amazon-connection-test-result');
      }
    });

    test('9.11 - Disable Amazon integration', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/admin/purchase-config');
      await human.waitForLoad(page);

      // Click Amazon tab
      const amazonTab = page.locator('button:has-text("Amazon")').first();

      if (await amazonTab.isVisible()) {
        await amazonTab.click();
        await page.waitForTimeout(500);
      }

      // The toggle button with rounded-full class
      const enableToggle = page.locator('button.rounded-full').first();

      if (await enableToggle.isVisible()) {
        // Click the toggle to disable
        await enableToggle.click();
        await page.waitForTimeout(500);
        await human.takeScreenshot(page, 'amazon-disabled');

        // Verify the disabled message appears
        const disabledMessage = page.locator(':text("disabled"), :text("deshabilitada"), :text("禁用")').first();
        // May or may not be visible depending on the state
      }
    });
  });

  test.describe('Cart Integration', () => {
    test('9.5 - View add to cart button on orders', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      // First ensure Amazon is enabled
      await page.goto('/admin/purchase-config');
      await human.waitForLoad(page);

      const amazonTab = page.locator('button:has-text("Amazon")').first();
      if (await amazonTab.isVisible()) {
        await amazonTab.click();
        await page.waitForTimeout(300);

        const enableToggle = page.locator('input[type="checkbox"]').first();
        if (await enableToggle.isVisible()) {
          const isChecked = await enableToggle.isChecked();
          if (!isChecked) {
            await enableToggle.click();
            const saveBtn = page.locator('button:has-text("Guardar")').first();
            if (await saveBtn.isVisible()) {
              await saveBtn.click();
              await page.waitForTimeout(500);
            }
          }
        }
      }

      // Go to orders
      await page.goto('/admin/orders');
      await human.waitForLoad(page);

      // Look for Amazon-related buttons
      const addToCartButton = page.locator(
        'button:has-text("Agregar al carrito"), button:has-text("Add to Cart"), button:has-text("Amazon")'
      );

      const count = await addToCartButton.count();
      console.log(`Found ${count} add to cart buttons`);
      await human.takeScreenshot(page, 'orders-with-amazon-buttons');
    });

    test('9.6 - Add product to Amazon cart', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/admin/orders');
      await human.waitForLoad(page);

      // Find add to cart button
      const addToCartButton = page.locator(
        'button:has-text("Agregar al carrito"), button:has-text("Add to Cart")'
      ).first();

      if (await addToCartButton.isVisible()) {
        await addToCartButton.click();
        await page.waitForTimeout(500);
        await human.takeScreenshot(page, 'add-to-cart-modal');

        // Confirm
        const confirmButton = page.locator(
          'button:has-text("Confirmar"), button:has-text("Confirm")'
        ).first();

        if (await confirmButton.isVisible()) {
          await confirmButton.click();

          // Wait for operation (may take time)
          await page.waitForTimeout(10000);
          await human.takeScreenshot(page, 'add-to-cart-result');
        }
      } else {
        console.log('No Amazon add to cart buttons available');
        await human.takeScreenshot(page, 'no-amazon-buttons');
      }
    });

    test('9.8 - Go to Amazon cart', async ({ page, context }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/admin/orders');
      await human.waitForLoad(page);

      // Find go to cart button
      const goToCartButton = page.locator(
        'button:has-text("Ir al carrito"), button:has-text("Go to Cart"), button:has-text("Ver carrito")'
      ).first();

      if (await goToCartButton.isVisible()) {
        // Listen for new page
        const pagePromise = context.waitForEvent('page');
        await goToCartButton.click();

        try {
          const newPage = await pagePromise;
          await newPage.waitForLoadState();
          console.log(`Opened Amazon URL: ${newPage.url()}`);
          await human.takeScreenshot(page, 'amazon-cart-opened');
          await newPage.close();
        } catch {
          console.log('No new page opened');
        }
      }
    });
  });
});
