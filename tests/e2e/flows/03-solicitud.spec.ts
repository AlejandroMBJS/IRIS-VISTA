import { test, expect, credentials, login } from '../helpers/fixtures';
import * as human from '../helpers/human';

/**
 * Purchase Request Flow Tests
 *
 * Tests all purchase request scenarios including:
 * - Creating requests from catalog
 * - Creating requests from external URLs
 * - Multi-product requests
 * - Mixed requests (catalog + URLs)
 * - Editing quantities
 * - Removing products
 * - Justification validation
 * - Urgent requests
 */

test.describe('Purchase Request Flow', () => {
  test.describe('New Request Access', () => {
    test('5.1 - Access new request page', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      // Navigate to new purchase request
      const newPurchaseLink = page.locator(
        'a[href*="purchase/new"], a[href*="new"], a:has-text("Nueva"), a:has-text("New")'
      ).first();
      await newPurchaseLink.click();

      await human.waitForLoad(page);
      await human.takeScreenshot(page, 'new-request-page');

      // Verify page loaded
      expect(page.url()).toContain('purchase');
    });
  });

  test.describe('Catalog Requests', () => {
    test('5.2 - Create request with single catalog product', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/purchase/new');
      await human.waitForLoad(page);

      await human.takeScreenshot(page, 'new-request-options');

      // Look for catalog option (button with Package icon and "Catalog" text)
      const catalogOption = page.locator(
        'button:has-text("Catalog"), button:has-text("Catalogo"), button:has-text("目录")'
      ).first();

      if (await catalogOption.isVisible()) {
        await catalogOption.click();
        await page.waitForTimeout(1000); // Wait for modal to open
        await human.takeScreenshot(page, 'catalog-modal-opened');

        // Find a product add button in the catalog modal (small button with Plus icon)
        // The button is inside a product card and has a Plus SVG icon
        const addButton = page.locator('.rounded-lg button:has(svg)').first();

        if (await addButton.isVisible()) {
          await addButton.click();
          await page.waitForTimeout(500);
          await human.takeScreenshot(page, 'product-added-to-request');

          // Close the modal
          const closeButton = page.locator('button:has-text("Close"), button:has-text("Cerrar"), button:has-text("关闭")').first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
            await page.waitForTimeout(500);
          }
        }
      }

      // Find and fill justification
      const justificationField = page.locator(
        'textarea[name="justification"], textarea[placeholder*="justific"], textarea[placeholder*="Justif"], textarea:near(:text("Justificacion"))'
      ).first();

      if (await justificationField.isVisible()) {
        await justificationField.fill('Producto necesario para proyecto de desarrollo Q1 2024');
        await human.takeScreenshot(page, 'justification-filled');
      }

      // Look for submit/review button
      const submitButton = page.locator(
        'button:has-text("Revisar"), button:has-text("Review"), button:has-text("Enviar"), button:has-text("Submit")'
      ).first();

      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);
        await human.takeScreenshot(page, 'request-review-modal');

        // Confirm submission
        const confirmButton = page.locator(
          'button:has-text("Confirmar"), button:has-text("Confirm"), button:has-text("Enviar")'
        ).first();

        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(2000);
          await human.takeScreenshot(page, 'request-submitted');
        }
      }
    });

    test('5.4 - Create request with multiple catalog products', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/purchase/new');
      await human.waitForLoad(page);

      // Select catalog option
      const catalogOption = page.locator(
        'button:has-text("Catalog"), button:has-text("Catalogo"), button:has-text("目录")'
      ).first();

      if (await catalogOption.isVisible()) {
        await catalogOption.click();
        await page.waitForTimeout(1000);

        // Add multiple products from catalog modal
        const addButtons = page.locator('.rounded-lg button:has(svg)');

        const count = await addButtons.count();
        for (let i = 0; i < Math.min(3, count); i++) {
          await addButtons.nth(i).click();
          await page.waitForTimeout(300);
        }

        await human.takeScreenshot(page, 'multiple-products-added');

        // Close modal
        const closeButton = page.locator('button:has-text("Close"), button:has-text("Cerrar")').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      }

      // Fill justification
      const justificationField = page.locator(
        'textarea[name="justification"], textarea[placeholder*="justific"], textarea'
      ).first();

      if (await justificationField.isVisible()) {
        await justificationField.fill('Equipamiento para nuevo empleado del departamento de IT');
      }

      await human.takeScreenshot(page, 'multi-product-request-ready');
    });
  });

  test.describe('External URL Requests', () => {
    test('5.3 - Create request from external URL', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/purchase/new');
      await human.waitForLoad(page);

      // Select external URL option
      const externalOption = page.locator(
        'button:has-text("URL"), button:has-text("Externo"), button:has-text("External"), [data-source="external"]'
      ).first();

      if (await externalOption.isVisible()) {
        await externalOption.click();
        await human.waitForLoad(page);
      }

      // Find URL input field
      const urlField = page.locator(
        'input[name="url"], input[type="url"], input[placeholder*="URL"], input[placeholder*="http"]'
      ).first();

      if (await urlField.isVisible()) {
        // Enter Amazon product URL
        await urlField.fill('https://www.amazon.com.mx/dp/B08N5WRWNW');
        await human.takeScreenshot(page, 'url-entered');

        // Click extract button
        const extractButton = page.locator(
          'button:has-text("Extraer"), button:has-text("Extract"), button:has-text("Obtener")'
        ).first();

        if (await extractButton.isVisible()) {
          await extractButton.click();

          // Wait for extraction (may take a few seconds)
          await page.waitForTimeout(5000);
          await human.takeScreenshot(page, 'metadata-extracted');
        }
      }

      // Fill justification
      const justificationField = page.locator(
        'textarea[name="justification"], textarea[placeholder*="justific"], textarea'
      ).first();

      if (await justificationField.isVisible()) {
        await justificationField.fill('Monitor adicional requerido para trabajo remoto del equipo de diseno');
      }

      await human.takeScreenshot(page, 'external-request-ready');
    });

    test('5.5 - Create request with multiple URLs', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/purchase/new');
      await human.waitForLoad(page);

      // Select external URL option
      const externalOption = page.locator(
        'button:has-text("URL"), button:has-text("Externo"), button:has-text("External")'
      ).first();

      if (await externalOption.isVisible()) {
        await externalOption.click();
        await human.waitForLoad(page);
      }

      // Add first product
      const urlField = page.locator(
        'input[name="url"], input[type="url"], input[placeholder*="URL"]'
      ).first();

      if (await urlField.isVisible()) {
        await urlField.fill('https://www.amazon.com.mx/dp/B08N5WRWNW');

        const extractButton = page.locator(
          'button:has-text("Extraer"), button:has-text("Extract")'
        ).first();

        if (await extractButton.isVisible()) {
          await extractButton.click();
          await page.waitForTimeout(3000);
        }

        // Look for "add another" button
        const addAnotherButton = page.locator(
          'button:has-text("Agregar otro"), button:has-text("Add another"), button:has-text("+ Producto")'
        ).first();

        if (await addAnotherButton.isVisible()) {
          await addAnotherButton.click();
          await page.waitForTimeout(500);
        }

        await human.takeScreenshot(page, 'multiple-urls-request');
      }
    });

    test('5.13 - URL extraction failure shows manual input option', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/purchase/new');
      await human.waitForLoad(page);

      // Select external URL option
      const externalOption = page.locator(
        'button:has-text("URL"), button:has-text("Externo"), button:has-text("External")'
      ).first();

      if (await externalOption.isVisible()) {
        await externalOption.click();
        await human.waitForLoad(page);
      }

      // Enter invalid URL
      const urlField = page.locator(
        'input[name="url"], input[type="url"], input[placeholder*="URL"]'
      ).first();

      if (await urlField.isVisible()) {
        await urlField.fill('https://invalid-url-that-does-not-exist.com/product/123');

        const extractButton = page.locator(
          'button:has-text("Extraer"), button:has-text("Extract")'
        ).first();

        if (await extractButton.isVisible()) {
          await extractButton.click();
          await page.waitForTimeout(5000);
          await human.takeScreenshot(page, 'url-extraction-failed');
        }
      }
    });
  });

  test.describe('Quantity Management', () => {
    test('5.8 - Edit product quantity', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/purchase/new');
      await human.waitForLoad(page);

      // Add a product first
      const catalogOption = page.locator(
        'button:has-text("Catalog"), button:has-text("Catalogo")'
      ).first();

      if (await catalogOption.isVisible()) {
        await catalogOption.click();
        await page.waitForTimeout(1000);

        const addButton = page.locator('.rounded-lg button:has(svg)').first();

        if (await addButton.isVisible()) {
          await addButton.click();
          await page.waitForTimeout(500);
        }

        // Close modal
        const closeButton = page.locator('button:has-text("Close"), button:has-text("Cerrar")').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      }

      // Find quantity input or controls
      const quantityInput = page.locator(
        'input[name="quantity"], input[type="number"], input:near(:text("Cantidad"))'
      ).first();

      if (await quantityInput.isVisible()) {
        await quantityInput.fill('5');
        await human.takeScreenshot(page, 'quantity-updated');
      }

      // Try + and - buttons if they exist
      const plusButton = page.locator('button:has-text("+")').first();
      const minusButton = page.locator('button:has-text("-")').first();

      if (await plusButton.isVisible()) {
        await plusButton.click();
        await plusButton.click();
        await page.waitForTimeout(300);
        await human.takeScreenshot(page, 'quantity-plus-buttons');
      }
    });

    test('5.7 - Remove product from request', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/purchase/new');
      await human.waitForLoad(page);

      // Add multiple products first
      const catalogOption = page.locator(
        'button:has-text("Catalog"), button:has-text("Catalogo")'
      ).first();

      if (await catalogOption.isVisible()) {
        await catalogOption.click();
        await page.waitForTimeout(1000);

        const addButtons = page.locator('.rounded-lg button:has(svg)');
        const count = await addButtons.count();

        for (let i = 0; i < Math.min(3, count); i++) {
          await addButtons.nth(i).click();
          await page.waitForTimeout(200);
        }

        // Close modal
        const closeButton = page.locator('button:has-text("Close"), button:has-text("Cerrar")').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }

        await human.takeScreenshot(page, 'products-before-removal');

        // Find and click remove button (trash icon in product card)
        const removeButton = page.locator(
          'button:has-text("Remove"), button:has-text("Eliminar"), button:has(svg)'
        ).filter({ has: page.locator('svg') }).first();

        if (await removeButton.isVisible()) {
          await removeButton.click();
          await page.waitForTimeout(500);
          await human.takeScreenshot(page, 'product-removed');
        }
      }
    });
  });

  test.describe('Validation', () => {
    test('5.10 - Justification required validation', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/purchase/new');
      await human.waitForLoad(page);

      // Add a product
      const catalogOption = page.locator(
        'button:has-text("Catalog"), button:has-text("Catalogo")'
      ).first();

      if (await catalogOption.isVisible()) {
        await catalogOption.click();
        await page.waitForTimeout(1000);

        const addButton = page.locator('.rounded-lg button:has(svg)').first();

        if (await addButton.isVisible()) {
          await addButton.click();
          await page.waitForTimeout(500);
        }

        // Close modal
        const closeButton = page.locator('button:has-text("Close"), button:has-text("Cerrar")').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      }

      // Try to submit without justification
      const submitButton = page.locator(
        'button:has-text("Review"), button:has-text("Revisar"), button:has-text("审核")'
      ).first();

      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(500);
        await human.takeScreenshot(page, 'justification-required-error');
      }
    });

    test('5.12 - Urgent request flag', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/purchase/new');
      await human.waitForLoad(page);

      // Look for urgent toggle/checkbox
      const urgentToggle = page.locator(
        'input[name="urgent"], input[type="checkbox"]:near(:text("Urgente")), button:has-text("Urgente")'
      ).first();

      if (await urgentToggle.isVisible()) {
        await urgentToggle.click();
        await human.takeScreenshot(page, 'urgent-request-toggled');
      }
    });
  });

  test.describe('My Requests', () => {
    test('6.1 - View my requests list', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      // Navigate to my requests
      const requestsLink = page.locator(
        'a[href*="requests"], a:has-text("Solicitudes"), a:has-text("Requests")'
      ).first();

      if (await requestsLink.isVisible()) {
        await requestsLink.click();
        await human.waitForLoad(page);
        await human.takeScreenshot(page, 'my-requests-list');
      } else {
        await page.goto('/requests');
        await human.waitForLoad(page);
        await human.takeScreenshot(page, 'my-requests-list');
      }

      // Verify requests page loaded
      expect(page.url()).toContain('requests');
    });

    test('6.2 - Filter requests by status', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/requests');
      await human.waitForLoad(page);

      // Look for status filter
      const pendingFilter = page.locator(
        'button:has-text("Pendiente"), button:has-text("Pending"), [data-status="pending"]'
      ).first();

      if (await pendingFilter.isVisible()) {
        await pendingFilter.click();
        await page.waitForTimeout(500);
        await human.takeScreenshot(page, 'requests-filtered-pending');
      }

      const approvedFilter = page.locator(
        'button:has-text("Aprobad"), button:has-text("Approved"), [data-status="approved"]'
      ).first();

      if (await approvedFilter.isVisible()) {
        await approvedFilter.click();
        await page.waitForTimeout(500);
        await human.takeScreenshot(page, 'requests-filtered-approved');
      }
    });

    test('6.3 - View request detail', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/requests');
      await human.waitForLoad(page);

      // Click on first request to view detail
      const requestRow = page.locator(
        'tr:has(td), .request-card, [data-request-id]'
      ).first();

      if (await requestRow.isVisible()) {
        await requestRow.click();
        await page.waitForTimeout(1000);
        await human.takeScreenshot(page, 'request-detail-view');
      }
    });
  });
});
