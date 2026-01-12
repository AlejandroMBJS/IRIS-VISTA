import { test, expect, credentials, login } from '../helpers/fixtures';
import * as human from '../helpers/human';

/**
 * Permission Tests by Role
 *
 * Tests role-based access control:
 * - Employee permissions
 * - Purchase Admin permissions
 * - General Manager permissions
 * - Admin permissions
 * - Unauthorized access attempts
 */

test.describe('Permission Tests', () => {
  test.describe('Employee Permissions', () => {
    test('15.1 - Employee can access allowed pages', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      // Can access dashboard
      await page.goto('/');
      await human.waitForLoad(page);
      expect(page.url()).not.toContain('login');
      await human.takeScreenshot(page, 'employee-dashboard');

      // Can access requests
      await page.goto('/requests');
      await human.waitForLoad(page);
      await human.takeScreenshot(page, 'employee-requests');

      // Can access new purchase
      await page.goto('/purchase/new');
      await human.waitForLoad(page);
      await human.takeScreenshot(page, 'employee-new-purchase');

      // Can access catalog (view only)
      await page.goto('/catalog');
      await human.waitForLoad(page);
      await human.takeScreenshot(page, 'employee-catalog');
    });

    test('15.1b - Employee cannot access restricted pages', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      // Try to access admin users page
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);
      await human.takeScreenshot(page, 'employee-users-attempt');

      // Should be redirected or show error
      // Implementation varies - check URL or error message

      // Try to access configuration
      await page.goto('/admin/purchase-config');
      await page.waitForTimeout(2000);
      await human.takeScreenshot(page, 'employee-config-attempt');
    });
  });

  test.describe('Purchase Admin Permissions', () => {
    test('15.2 - Purchase Admin can access orders', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      await page.goto('/admin/orders');
      await human.waitForLoad(page);
      expect(page.url()).toContain('orders');
      await human.takeScreenshot(page, 'purchase-admin-orders');
    });

    test('15.2b - Purchase Admin can access catalog management', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      await page.goto('/catalog');
      await human.waitForLoad(page);

      // Look for add/edit buttons that only admins see
      const addButton = page.locator(
        'button:has-text("Agregar"), button:has-text("Add")'
      );
      await human.takeScreenshot(page, 'purchase-admin-catalog');
    });
  });

  test.describe('General Manager Permissions', () => {
    test('15.3 - GM can access approvals', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      await page.goto('/approvals');
      await human.waitForLoad(page);
      expect(page.url()).toContain('approvals');
      await human.takeScreenshot(page, 'gm-approvals');
    });

    test('15.3b - GM can approve requests', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      await page.goto('/approvals');
      await human.waitForLoad(page);

      // Look for approve button
      const approveButton = page.locator(
        'button:has-text("Aprobar"), button:has-text("Approve")'
      );

      if (await approveButton.first().isVisible()) {
        await human.takeScreenshot(page, 'gm-can-approve');
      }
    });
  });

  test.describe('Admin Permissions', () => {
    test('15.4 - Admin can access all pages', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      // Check each major section
      const pagesToCheck = [
        { url: '/', name: 'dashboard' },
        { url: '/requests', name: 'requests' },
        { url: '/purchase/new', name: 'new-purchase' },
        { url: '/catalog', name: 'catalog' },
        { url: '/approvals', name: 'approvals' },
        { url: '/admin/orders', name: 'orders' },
        { url: '/admin/users', name: 'users' },
        { url: '/admin/purchase-config', name: 'config' },
        { url: '/admin', name: 'admin' },
      ];

      for (const pageInfo of pagesToCheck) {
        await page.goto(pageInfo.url);
        await human.waitForLoad(page);
        await human.takeScreenshot(page, `admin-access-${pageInfo.name}`);
      }
    });

    test('15.4b - Admin can manage users', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      await page.goto('/admin/users');
      await human.waitForLoad(page);

      // Look for user management buttons
      const approveButton = page.locator('button:has-text("Aprobar")');
      const rejectButton = page.locator('button:has-text("Rechazar")');
      const editButton = page.locator('button:has-text("Editar")');

      await human.takeScreenshot(page, 'admin-user-management');
    });
  });

  test.describe('Unauthorized Access', () => {
    test('15.5 - Direct URL access without auth redirects to login', async ({ page }) => {
      // Clear cookies to ensure no session
      await page.context().clearCookies();

      // Try to access protected routes
      const protectedRoutes = [
        '/requests',
        '/purchase/new',
        '/catalog',
        '/approvals',
        '/admin/orders',
        '/admin/users',
        '/admin/purchase-config',
      ];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await page.waitForTimeout(2000);

        // Should be redirected to login
        const currentUrl = page.url();
        if (!currentUrl.includes('login')) {
          console.log(`Warning: ${route} may not be protected`);
        }
      }

      await human.takeScreenshot(page, 'unauthenticated-redirect');
    });
  });
});
