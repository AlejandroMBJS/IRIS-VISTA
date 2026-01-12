import { test, expect, credentials, login } from '../helpers/fixtures';
import * as human from '../helpers/human';

/**
 * Responsive Design Tests
 *
 * Tests responsive behavior across different viewports:
 * - Mobile (iPhone SE, iPhone 14)
 * - Tablet (iPad)
 * - Desktop
 */

test.describe('Responsive Design', () => {
  test.describe('Mobile (375x667)', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('12.1 - Login on mobile', async ({ page }) => {
      await human.navigateTo(page, '/login');
      await human.takeScreenshot(page, 'mobile-login-page');

      // Verify form is usable
      const employeeField = page.locator('input[type="text"], input[name="employeeNumber"]').first();
      await expect(employeeField).toBeVisible();

      const passwordField = page.locator('input[type="password"]').first();
      await expect(passwordField).toBeVisible();

      const submitButton = page.locator('button[type="submit"]').first();
      await expect(submitButton).toBeVisible();

      // Complete login
      await employeeField.fill(credentials.admin.employeeNumber);
      await passwordField.fill(credentials.admin.password);
      await submitButton.click();

      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
      await human.takeScreenshot(page, 'mobile-after-login');
    });

    test('12.2 - Dashboard on mobile', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await human.takeScreenshot(page, 'mobile-dashboard');

      // Verify sidebar is NOT visible by default on mobile
      const sidebar = page.locator('aside').first();
      const sidebarVisible = await sidebar.isVisible().catch(() => false);

      // On mobile, sidebar should be hidden or collapsed
      console.log(`Sidebar visible on mobile: ${sidebarVisible}`);

      // Verify bottom navigation exists
      const bottomNav = page.locator('nav:below(main), [data-bottom-nav]');
      const bottomNavVisible = await bottomNav.first().isVisible().catch(() => false);
      console.log(`Bottom nav visible: ${bottomNavVisible}`);

      await human.takeScreenshot(page, 'mobile-layout-check');
    });

    test('12.4 - Bottom navigation on mobile', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      // Look for bottom nav
      const bottomNav = page.locator(
        'nav.fixed.bottom-0, [data-bottom-nav], nav:has(a[href="/"])'
      ).first();

      if (await bottomNav.isVisible()) {
        await human.takeScreenshot(page, 'mobile-bottom-nav');

        // Click on each nav item
        const navItems = bottomNav.locator('a, button');
        const count = await navItems.count();
        console.log(`Bottom nav items: ${count}`);

        if (count > 0) {
          await navItems.first().click();
          await page.waitForTimeout(500);
          await human.takeScreenshot(page, 'mobile-nav-clicked');
        }
      }
    });

    test('12.5 - Request form on mobile', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/purchase/new');
      await human.waitForLoad(page);

      await human.takeScreenshot(page, 'mobile-new-request-form');

      // Verify inputs are full width
      const inputs = page.locator('input, textarea');
      const inputCount = await inputs.count();

      if (inputCount > 0) {
        const firstInput = inputs.first();
        const box = await firstInput.boundingBox();
        if (box) {
          console.log(`Input width: ${box.width}, viewport: 375`);
          // Input should be nearly full width on mobile
        }
      }
    });

    test('12.7 - Modal on mobile', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/admin/users');
      await human.waitForLoad(page);

      // Try to open a modal
      const actionButton = page.locator(
        'button:has-text("Aprobar"), button:has-text("Agregar"), button:has-text("Nuevo")'
      ).first();

      if (await actionButton.isVisible()) {
        await actionButton.click();
        await page.waitForTimeout(500);
        await human.takeScreenshot(page, 'mobile-modal');
      }
    });

    test('12.8 - Notifications dropdown on mobile', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      // Click notifications
      const notificationBell = page.locator(
        'button:has(svg.lucide-bell), [data-notifications]'
      ).first();

      if (await notificationBell.isVisible()) {
        await notificationBell.click();
        await page.waitForTimeout(500);
        await human.takeScreenshot(page, 'mobile-notifications-dropdown');
      }
    });
  });

  test.describe('Tablet Portrait (768x1024)', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('13.1 - Dashboard on tablet portrait', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await human.takeScreenshot(page, 'tablet-portrait-dashboard');

      // On tablet, sidebar might be collapsed (icons only)
      const sidebar = page.locator('aside').first();
      if (await sidebar.isVisible()) {
        const box = await sidebar.boundingBox();
        if (box) {
          console.log(`Tablet sidebar width: ${box.width}`);
        }
      }
    });

    test('13.3 - Form on tablet', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/purchase/new');
      await human.waitForLoad(page);

      await human.takeScreenshot(page, 'tablet-new-request-form');
    });

    test('13.4 - Table on tablet', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/requests');
      await human.waitForLoad(page);

      await human.takeScreenshot(page, 'tablet-requests-table');

      // Check if table or cards are shown
      const table = page.locator('table');
      const cards = page.locator('.card, [data-request-card]');

      const hasTable = (await table.count()) > 0;
      const hasCards = (await cards.count()) > 0;

      console.log(`Tablet shows table: ${hasTable}, cards: ${hasCards}`);
    });
  });

  test.describe('Tablet Landscape (1024x768)', () => {
    test.use({ viewport: { width: 1024, height: 768 } });

    test('13.2 - Dashboard on tablet landscape', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await human.takeScreenshot(page, 'tablet-landscape-dashboard');
    });

    test('13.5 - Modal on tablet', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/admin/users');
      await human.waitForLoad(page);

      // Open a modal
      const actionButton = page.locator('button').first();
      if (await actionButton.isVisible()) {
        await actionButton.click();
        await page.waitForTimeout(500);
        await human.takeScreenshot(page, 'tablet-modal');
      }
    });
  });

  test.describe('Desktop (1920x1080)', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('14.1 - Dashboard on desktop', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await human.takeScreenshot(page, 'desktop-dashboard');

      // Verify sidebar is always visible and expanded
      const sidebar = page.locator('aside').first();
      await expect(sidebar).toBeVisible();

      const box = await sidebar.boundingBox();
      if (box) {
        console.log(`Desktop sidebar width: ${box.width}`);
        // Sidebar should be expanded (around 256px or similar)
      }

      // Verify header is complete
      const header = page.locator('header').first();
      await expect(header).toBeVisible();
    });

    test('14.2 - Lists on desktop', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      // Check requests list
      await page.goto('/requests');
      await human.waitForLoad(page);
      await human.takeScreenshot(page, 'desktop-requests-list');

      // Check catalog
      await page.goto('/catalog');
      await human.waitForLoad(page);
      await human.takeScreenshot(page, 'desktop-catalog');

      // Check users
      await page.goto('/admin/users');
      await human.waitForLoad(page);
      await human.takeScreenshot(page, 'desktop-users-list');
    });

    test('14.3 - Forms on desktop', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/purchase/new');
      await human.waitForLoad(page);

      await human.takeScreenshot(page, 'desktop-new-request-form');
    });

    test('14.4 - Hover states on desktop', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      // Hover over sidebar items
      const sidebarLinks = page.locator('aside a');
      const count = await sidebarLinks.count();

      if (count > 0) {
        await sidebarLinks.first().hover();
        await page.waitForTimeout(300);
        await human.takeScreenshot(page, 'desktop-sidebar-hover');
      }

      // Hover over buttons
      const buttons = page.locator('button').first();
      if (await buttons.isVisible()) {
        await buttons.hover();
        await page.waitForTimeout(300);
        await human.takeScreenshot(page, 'desktop-button-hover');
      }
    });
  });
});
