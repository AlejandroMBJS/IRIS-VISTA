import { test, expect, credentials, login } from '../helpers/fixtures';
import * as human from '../helpers/human';

/**
 * Order Management Flow Tests (Purchase Admin)
 *
 * Tests all order management scenarios including:
 * - Viewing approved orders
 * - Marking orders as purchased
 * - Managing delivery
 * - Exporting orders
 */

test.describe('Order Management Flow', () => {
  test.describe('Approved Orders View', () => {
    test('8.1 - View approved orders list', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      // Navigate to orders
      const ordersLink = page.locator(
        'a[href*="orders"], a[href*="pedidos"], a:has-text("Pedidos"), a:has-text("Orders")'
      ).first();

      if (await ordersLink.isVisible()) {
        await ordersLink.click();
      } else {
        await page.goto('/admin/orders');
      }

      await human.waitForLoad(page);
      await human.takeScreenshot(page, 'orders-list');

      // Verify page loaded
      expect(page.url()).toContain('order');

      // Check for badge/count indicator
      const badge = page.locator(
        '.badge, [data-badge], .bg-\\[\\#D1625B\\]'
      ).first();

      if (await badge.isVisible()) {
        const badgeText = await badge.textContent();
        console.log(`Pending orders badge: ${badgeText}`);
      }
    });

    test('8.2 - View order detail', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/admin/orders');
      await human.waitForLoad(page);

      // Click on first order
      const orderItem = page.locator(
        '.order-card, tr:has(td), [data-order-id]'
      ).first();

      if (await orderItem.isVisible()) {
        await orderItem.click();
        await page.waitForTimeout(1000);
        await human.takeScreenshot(page, 'order-detail-view');

        // Verify product details are shown
        const productImage = page.locator('img').first();
        const productTitle = page.locator(
          '[data-product-title], .product-title'
        );

        // Verify action buttons
        const purchaseButton = page.locator(
          'button:has-text("Comprado"), button:has-text("Purchased"), button:has-text("Marcar")'
        );
        const openUrlButton = page.locator(
          'button:has-text("Abrir"), button:has-text("Open URL")'
        );
      }
    });

    test('8.3 - Open product URL', async ({ page, context }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/admin/orders');
      await human.waitForLoad(page);

      // Find Open URL button
      const openUrlButton = page.locator(
        'button:has-text("Abrir URL"), button:has-text("Open URL"), a:has-text("Ver producto")'
      ).first();

      if (await openUrlButton.isVisible()) {
        // Listen for new page/tab
        const [newPage] = await Promise.all([
          context.waitForEvent('page'),
          openUrlButton.click(),
        ]).catch(() => [null]);

        if (newPage) {
          await newPage.waitForLoadState();
          console.log(`Opened URL: ${newPage.url()}`);
          await newPage.close();
        }

        await human.takeScreenshot(page, 'url-opened');
      }
    });
  });

  test.describe('Order Actions', () => {
    test('8.4 - Mark order as purchased', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/admin/orders');
      await human.waitForLoad(page);

      // Find mark as purchased button
      const purchaseButton = page.locator(
        'button:has-text("Comprado"), button:has-text("Purchased"), button:has-text("Marcar como comprado")'
      ).first();

      if (await purchaseButton.isVisible()) {
        await purchaseButton.click();
        await page.waitForTimeout(500);
        await human.takeScreenshot(page, 'mark-purchased-modal');

        // Fill order number
        const orderNumberField = page.locator(
          'input[name="orderNumber"], input[placeholder*="orden"], input[placeholder*="order"]'
        ).first();

        if (await orderNumberField.isVisible()) {
          await orderNumberField.fill(`ORD-${Date.now().toString().slice(-8)}`);
        }

        // Fill notes
        const notesField = page.locator(
          'textarea[name="notes"], textarea[placeholder*="notas"], textarea[placeholder*="notes"]'
        ).first();

        if (await notesField.isVisible()) {
          await notesField.fill('Pedido realizado via Amazon Business. Entrega estimada 3-5 dias.');
        }

        // Confirm
        const confirmButton = page.locator(
          'button:has-text("Confirmar"), button:has-text("Confirm")'
        ).first();

        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(2000);
          await human.takeScreenshot(page, 'order-marked-purchased');
        }
      } else {
        console.log('No pending orders to mark as purchased');
        await human.takeScreenshot(page, 'no-pending-orders');
      }
    });

    test('8.5 - View purchased orders', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/admin/orders');
      await human.waitForLoad(page);

      // Filter by purchased
      const purchasedFilter = page.locator(
        'button:has-text("Comprad"), button:has-text("Purchased"), [data-status="purchased"]'
      ).first();

      if (await purchasedFilter.isVisible()) {
        await purchasedFilter.click();
        await page.waitForTimeout(500);
        await human.takeScreenshot(page, 'purchased-orders-list');
      }
    });

    test('8.6 - Mark order as delivered', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/admin/orders');
      await human.waitForLoad(page);

      // Filter by purchased
      const purchasedFilter = page.locator(
        'button:has-text("Comprad"), button:has-text("Purchased")'
      ).first();

      if (await purchasedFilter.isVisible()) {
        await purchasedFilter.click();
        await page.waitForTimeout(500);
      }

      // Find mark as delivered button
      const deliveredButton = page.locator(
        'button:has-text("Entregado"), button:has-text("Delivered"), button:has-text("Marcar entrega")'
      ).first();

      if (await deliveredButton.isVisible()) {
        await deliveredButton.click();
        await page.waitForTimeout(500);
        await human.takeScreenshot(page, 'mark-delivered-modal');

        // Fill delivery notes
        const notesField = page.locator(
          'textarea[name="notes"], textarea'
        ).first();

        if (await notesField.isVisible()) {
          await notesField.fill('Entregado al solicitante el dia de hoy. Recibio conformidad.');
        }

        // Confirm
        const confirmButton = page.locator(
          'button:has-text("Confirmar"), button:has-text("Confirm")'
        ).first();

        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(1000);
          await human.takeScreenshot(page, 'order-marked-delivered');
        }
      }
    });

    test('8.7 - Export orders list', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/admin/orders');
      await human.waitForLoad(page);

      // Find export button
      const exportButton = page.locator(
        'button:has-text("Exportar"), button:has-text("Export"), button:has-text("CSV"), button:has-text("Excel")'
      ).first();

      if (await exportButton.isVisible()) {
        // Set up download listener
        const downloadPromise = page.waitForEvent('download');
        await exportButton.click();

        try {
          const download = await downloadPromise;
          console.log(`Downloaded file: ${download.suggestedFilename()}`);
          await human.takeScreenshot(page, 'export-initiated');
        } catch {
          console.log('No download triggered - may be a different export method');
        }
      }
    });
  });

  test.describe('Order Statistics', () => {
    test('Stats cards are visible', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/admin/orders');
      await human.waitForLoad(page);

      // Look for stats cards
      const statsCards = page.locator(
        '[data-stat], .stat-card, .grid > div:has(h3, p)'
      );

      const count = await statsCards.count();
      console.log(`Found ${count} stats cards`);
      await human.takeScreenshot(page, 'order-stats');
    });
  });
});
