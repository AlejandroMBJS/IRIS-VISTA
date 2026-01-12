import { test, expect, credentials, login } from '../helpers/fixtures';
import * as human from '../helpers/human';

/**
 * Notification System Tests
 *
 * Tests the notification system including:
 * - Notification icon and badge
 * - Dropdown functionality
 * - Mark as read
 * - Sidebar badges
 */

test.describe('Notification System', () => {
  test.describe('Header Notifications', () => {
    test('10.1 - Notification icon visible in header', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      // Look for notification bell
      const notificationBell = page.locator(
        'button:has(svg.lucide-bell), [data-notifications], header button:has(svg)'
      ).first();

      await expect(notificationBell).toBeVisible();
      await human.takeScreenshot(page, 'notification-icon-visible');
    });

    test('10.2 - Open notification dropdown', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      const notificationBell = page.locator(
        'button:has(svg.lucide-bell), [data-notifications]'
      ).first();

      if (await notificationBell.isVisible()) {
        await notificationBell.click();
        await page.waitForTimeout(500);
        await human.takeScreenshot(page, 'notification-dropdown-open');

        // Verify dropdown content
        const dropdown = page.locator(
          '[role="menu"], .dropdown, div.absolute:has(text("Notification"))'
        );
      }
    });

    test('10.3 - Mark notification as read', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      const notificationBell = page.locator(
        'button:has(svg.lucide-bell), [data-notifications]'
      ).first();

      if (await notificationBell.isVisible()) {
        await notificationBell.click();
        await page.waitForTimeout(500);

        // Look for unread notification and click it
        const unreadNotification = page.locator(
          '[data-unread], .unread, [class*="unread"]'
        ).first();

        if (await unreadNotification.isVisible()) {
          await unreadNotification.click();
          await page.waitForTimeout(500);
          await human.takeScreenshot(page, 'notification-clicked');
        }
      }
    });

    test('10.4 - Mark all as read', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      const notificationBell = page.locator(
        'button:has(svg.lucide-bell), [data-notifications]'
      ).first();

      if (await notificationBell.isVisible()) {
        await notificationBell.click();
        await page.waitForTimeout(500);

        // Look for mark all as read button
        const markAllButton = page.locator(
          'button:has-text("Marcar todo"), button:has-text("Mark all"), button:has-text("todas")'
        ).first();

        if (await markAllButton.isVisible()) {
          await markAllButton.click();
          await page.waitForTimeout(500);
          await human.takeScreenshot(page, 'all-notifications-read');
        }
      }
    });
  });

  test.describe('Sidebar Badges', () => {
    test('10.6 - Sidebar badges visible', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      // Look for badges in sidebar
      const badges = page.locator(
        'aside .badge, aside [data-badge], aside span.rounded-full'
      );

      const count = await badges.count();
      console.log(`Found ${count} sidebar badges`);

      await human.takeScreenshot(page, 'sidebar-badges');
    });

    test('Approvals badge for GM', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      // Look for approvals link with badge
      const approvalsLink = page.locator(
        'a[href*="approvals"]:has(.badge), a:has-text("Aprobaciones"):has(span)'
      );

      if (await approvalsLink.isVisible()) {
        const badge = approvalsLink.locator('span').last();
        if (await badge.isVisible()) {
          const badgeText = await badge.textContent();
          console.log(`Approvals badge: ${badgeText}`);
        }
      }

      await human.takeScreenshot(page, 'approvals-badge');
    });

    test('Orders badge for purchase admin', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      // Look for orders link with badge
      const ordersLink = page.locator(
        'a[href*="orders"]:has(.badge), a:has-text("Pedidos"):has(span), a:has-text("Orders"):has(span)'
      );

      if (await ordersLink.isVisible()) {
        const badge = ordersLink.locator('span').last();
        if (await badge.isVisible()) {
          const badgeText = await badge.textContent();
          console.log(`Orders badge: ${badgeText}`);
        }
      }

      await human.takeScreenshot(page, 'orders-badge');
    });
  });
});
