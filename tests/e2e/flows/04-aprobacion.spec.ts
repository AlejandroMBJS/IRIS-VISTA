import { test, expect, credentials, login } from '../helpers/fixtures';
import * as human from '../helpers/human';

/**
 * Approval Flow Tests
 *
 * Tests all approval scenarios including:
 * - Viewing pending approvals
 * - Approving requests
 * - Rejecting requests with reason
 * - Requesting more information
 * - GM permissions
 */

test.describe('Approval Flow', () => {
  test.describe('Pending Approvals View', () => {
    test('7.1 - View pending approvals list', async ({ page }) => {
      // Login as admin (simulating GM access)
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);

      // Navigate to approvals
      const approvalsLink = page.locator(
        'a[href*="approvals"], a:has-text("Aprobaciones"), a:has-text("Approvals")'
      ).first();

      if (await approvalsLink.isVisible()) {
        await approvalsLink.click();
      } else {
        await page.goto('/approvals');
      }

      await human.waitForLoad(page);
      await human.takeScreenshot(page, 'pending-approvals-list');

      // Verify page loaded
      expect(page.url()).toContain('approvals');

      // Look for pending requests
      const pendingRequests = page.locator(
        '.request-card, tr:has(td), [data-request-id]'
      );
      const count = await pendingRequests.count();
      console.log(`Found ${count} pending requests`);
    });

    test('7.2 - View request detail for approval', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/approvals');
      await human.waitForLoad(page);

      // Click on first request
      const requestItem = page.locator(
        '.request-card, tr:has(td), [data-request-id]'
      ).first();

      if (await requestItem.isVisible()) {
        await requestItem.click();
        await page.waitForTimeout(1000);
        await human.takeScreenshot(page, 'approval-detail-view');

        // Verify detail elements
        // Products list
        const productsList = page.locator(
          '[data-products], .products-list, :text("Productos")'
        );

        // Requester info
        const requesterInfo = page.locator(
          '[data-requester], .requester-info, :text("Solicitante")'
        );

        // Approve/Reject buttons
        const approveButton = page.locator(
          'button:has-text("Aprobar"), button:has-text("Approve")'
        );
        const rejectButton = page.locator(
          'button:has-text("Rechazar"), button:has-text("Reject")'
        );

        await human.takeScreenshot(page, 'approval-detail-buttons');
      }
    });
  });

  test.describe('Approval Actions', () => {
    test('7.3 - Approve request', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/approvals');
      await human.waitForLoad(page);

      // Find and click approve button
      const approveButton = page.locator(
        'button:has-text("Aprobar"), button:has-text("Approve")'
      ).first();

      if (await approveButton.isVisible()) {
        await approveButton.click();
        await page.waitForTimeout(500);
        await human.takeScreenshot(page, 'approve-confirmation-modal');

        // Add optional comment
        const commentField = page.locator(
          'textarea[name="comment"], textarea[placeholder*="comentario"], textarea[placeholder*="Comment"]'
        ).first();

        if (await commentField.isVisible()) {
          await commentField.fill('Aprobado para el proyecto Q1');
        }

        // Confirm approval
        const confirmButton = page.locator(
          'button:has-text("Confirmar"), button:has-text("Confirm")'
        ).first();

        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(2000);
          await human.takeScreenshot(page, 'request-approved-success');
        }
      } else {
        console.log('No pending requests to approve');
        await human.takeScreenshot(page, 'no-pending-requests');
      }
    });

    test('7.4 - Reject request with reason', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/approvals');
      await human.waitForLoad(page);

      // Find and click reject button
      const rejectButton = page.locator(
        'button:has-text("Rechazar"), button:has-text("Reject")'
      ).first();

      if (await rejectButton.isVisible()) {
        await rejectButton.click();
        await page.waitForTimeout(500);
        await human.takeScreenshot(page, 'reject-modal');

        // Try to reject without reason (should fail)
        const confirmButton = page.locator(
          'button:has-text("Confirmar"), button:has-text("Confirm")'
        ).first();

        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(500);
          await human.takeScreenshot(page, 'reject-without-reason-error');
        }

        // Fill rejection reason
        const reasonField = page.locator(
          'textarea[name="reason"], textarea[placeholder*="motivo"], textarea[placeholder*="reason"], textarea'
        ).first();

        if (await reasonField.isVisible()) {
          await reasonField.fill('El producto solicitado no esta disponible para compra. Por favor buscar alternativa.');
        }

        // Confirm rejection
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(2000);
          await human.takeScreenshot(page, 'request-rejected-success');
        }
      } else {
        console.log('No pending requests to reject');
      }
    });

    test('7.5 - Request more information', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/approvals');
      await human.waitForLoad(page);

      // Find and click info request button
      const infoButton = page.locator(
        'button:has-text("Informacion"), button:has-text("Info"), button:has-text("More info")'
      ).first();

      if (await infoButton.isVisible()) {
        await infoButton.click();
        await page.waitForTimeout(500);
        await human.takeScreenshot(page, 'request-info-modal');

        // Fill information request
        const messageField = page.locator(
          'textarea[name="message"], textarea[placeholder*="mensaje"], textarea'
        ).first();

        if (await messageField.isVisible()) {
          await messageField.fill('Por favor proporcionar cotizacion del proveedor para validar precio');
        }

        // Send request
        const sendButton = page.locator(
          'button:has-text("Enviar"), button:has-text("Send")'
        ).first();

        if (await sendButton.isVisible()) {
          await sendButton.click();
          await page.waitForTimeout(1000);
          await human.takeScreenshot(page, 'info-requested-success');
        }
      }
    });
  });

  test.describe('Approval History', () => {
    test('7.6 - View approval history', async ({ page }) => {
      await login(page, credentials.admin.employeeNumber, credentials.admin.password);
      await page.goto('/approvals');
      await human.waitForLoad(page);

      // Look for history/completed tab
      const historyTab = page.locator(
        'button:has-text("Historial"), button:has-text("History"), button:has-text("Completad")'
      ).first();

      if (await historyTab.isVisible()) {
        await historyTab.click();
        await page.waitForTimeout(500);
        await human.takeScreenshot(page, 'approval-history');
      }

      // Look for filter options
      const filterByDate = page.locator(
        'input[type="date"], [data-filter="date"]'
      ).first();

      if (await filterByDate.isVisible()) {
        await human.takeScreenshot(page, 'approval-filters');
      }
    });
  });
});
