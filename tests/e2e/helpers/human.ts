import { Page, Locator, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Human-like interaction helpers for E2E testing
 *
 * These helpers simulate realistic human behavior by:
 * - Typing character by character with variable speed
 * - Moving mouse gradually to elements
 * - Adding random delays to simulate reading/thinking
 * - Scrolling smoothly instead of jumping
 */

// Random delay helper
const randomDelay = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

// Sleep helper
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Types text like a human - character by character with variable speed
 */
export async function humanType(
  page: Page,
  selector: string,
  text: string,
  options?: { clear?: boolean }
): Promise<void> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible' });
  await element.click();

  if (options?.clear) {
    await element.fill('');
  }

  for (const char of text) {
    await element.pressSequentially(char, { delay: randomDelay(50, 150) });
  }
}

/**
 * Clicks an element with human-like mouse movement
 */
export async function humanClick(
  page: Page,
  selector: string,
  options?: { force?: boolean }
): Promise<void> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout: 15000 });

  // Get element bounding box
  const box = await element.boundingBox();
  if (!box) {
    throw new Error(`Element ${selector} has no bounding box`);
  }

  // Calculate center with slight random offset (3-5 pixels)
  const offsetX = randomDelay(-5, 5);
  const offsetY = randomDelay(-5, 5);
  const targetX = box.x + box.width / 2 + offsetX;
  const targetY = box.y + box.height / 2 + offsetY;

  // Move mouse in steps for more human-like movement
  const steps = randomDelay(5, 15);
  await page.mouse.move(targetX, targetY, { steps });

  // Small pause before clicking (simulates decision time)
  await sleep(randomDelay(50, 200));

  // Click
  if (options?.force) {
    await element.click({ force: true });
  } else {
    await page.mouse.click(targetX, targetY);
  }
}

/**
 * Scrolls the page gradually like a human
 */
export async function humanScroll(
  page: Page,
  direction: 'up' | 'down',
  amount: number
): Promise<void> {
  const steps = 5;
  const stepAmount = amount / steps;
  const scrollAmount = direction === 'down' ? stepAmount : -stepAmount;

  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, scrollAmount);
    await sleep(randomDelay(30, 80));
  }
}

/**
 * Simulates reading time
 */
export async function humanRead(seconds: number): Promise<void> {
  const variation = randomDelay(-300, 300);
  await sleep(seconds * 1000 + variation);
}

/**
 * Hovers over an element like a human would
 */
export async function humanHover(page: Page, selector: string): Promise<void> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible' });

  const box = await element.boundingBox();
  if (!box) {
    throw new Error(`Element ${selector} has no bounding box`);
  }

  const targetX = box.x + box.width / 2;
  const targetY = box.y + box.height / 2;

  // Move mouse gradually
  const steps = randomDelay(5, 15);
  await page.mouse.move(targetX, targetY, { steps });

  // Pause as if reading
  await sleep(randomDelay(500, 1500));
}

/**
 * Waits for page to fully load
 */
export async function waitForLoad(page: Page): Promise<void> {
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');

  // Wait for common loading indicators to disappear
  const loadingSelectors = [
    '[data-loading]',
    '.animate-spin',
    '.loading',
    '.spinner',
    '[aria-busy="true"]',
  ];

  for (const selector of loadingSelectors) {
    try {
      const element = page.locator(selector);
      if ((await element.count()) > 0) {
        await element.first().waitFor({ state: 'hidden', timeout: 5000 });
      }
    } catch {
      // Ignore if element doesn't exist
    }
  }

  // Additional pause for any animations
  await sleep(200);
}

/**
 * Takes a screenshot with timestamp
 */
export async function takeScreenshot(
  page: Page,
  name: string,
  options?: { fullPage?: boolean }
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(
    process.cwd(),
    'tests/e2e/reports/screenshots',
    filename
  );

  await page.screenshot({
    path: filepath,
    fullPage: options?.fullPage ?? true,
  });

  return filepath;
}

/**
 * Fills a form field with validation check
 */
export async function fillField(
  page: Page,
  selector: string,
  value: string,
  options?: { validate?: boolean }
): Promise<void> {
  await humanClick(page, selector);
  await humanType(page, selector, value, { clear: true });

  if (options?.validate) {
    const element = page.locator(selector);
    await expect(element).toHaveValue(value);
  }
}

/**
 * Selects an option from a dropdown
 */
export async function selectOption(
  page: Page,
  selector: string,
  value: string
): Promise<void> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible' });
  await element.selectOption(value);
}

/**
 * Toggles a checkbox or switch
 */
export async function toggle(page: Page, selector: string): Promise<void> {
  await humanClick(page, selector);
  await sleep(randomDelay(100, 300));
}

/**
 * Waits for and clicks a button by text
 */
export async function clickButton(page: Page, text: string): Promise<void> {
  const button = page.getByRole('button', { name: text });
  await button.waitFor({ state: 'visible' });
  await humanClick(page, `button:has-text("${text}")`);
}

/**
 * Waits for a toast/notification message
 */
export async function waitForToast(
  page: Page,
  type: 'success' | 'error',
  textContains?: string
): Promise<void> {
  const toastSelectors = [
    `[role="alert"]`,
    `.toast`,
    `.notification`,
    `[data-toast]`,
  ];

  for (const selector of toastSelectors) {
    try {
      const toast = page.locator(selector).first();
      await toast.waitFor({ state: 'visible', timeout: 5000 });

      if (textContains) {
        await expect(toast).toContainText(textContains);
      }
      return;
    } catch {
      // Try next selector
    }
  }
}

/**
 * Checks if element exists and is visible
 */
export async function isVisible(page: Page, selector: string): Promise<boolean> {
  try {
    const element = page.locator(selector);
    return await element.isVisible();
  } catch {
    return false;
  }
}

/**
 * Gets text content of an element
 */
export async function getText(page: Page, selector: string): Promise<string> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible' });
  return (await element.textContent()) || '';
}

/**
 * Gets count of elements matching selector
 */
export async function getCount(page: Page, selector: string): Promise<number> {
  return await page.locator(selector).count();
}

/**
 * Uploads a file to an input element
 */
export async function uploadFile(
  page: Page,
  selector: string,
  filePath: string
): Promise<void> {
  const element = page.locator(selector);
  await element.setInputFiles(filePath);
}

/**
 * Navigates to a URL and waits for load
 */
export async function navigateTo(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await waitForLoad(page);
}

/**
 * Checks if current URL matches expected
 */
export async function verifyUrl(
  page: Page,
  expectedUrl: string | RegExp
): Promise<void> {
  if (typeof expectedUrl === 'string') {
    await expect(page).toHaveURL(expectedUrl);
  } else {
    await expect(page).toHaveURL(expectedUrl);
  }
}

/**
 * Test data generators
 */
export const testData = {
  generateEmployeeNumber: (): string => {
    return `EMP${Date.now().toString().slice(-8)}`;
  },

  generateEmail: (prefix: string = 'test'): string => {
    return `${prefix}.${Date.now()}@empresa.test`;
  },

  generatePassword: (): string => {
    return `Test${Date.now().toString().slice(-6)}!`;
  },

  generateJustification: (): string => {
    const reasons = [
      'Necesario para el proyecto de desarrollo Q1',
      'Reemplazo de equipo danado en el departamento',
      'Mejora de productividad del equipo',
      'Requisito de cliente para entrega urgente',
      'Actualizacion de infraestructura planificada',
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  },
};

/**
 * State management for exhaustive testing
 */
export interface TestState {
  iteration: number;
  consecutiveClean: number;
  issues: Issue[];
  strategiesUsed: Record<string, number>;
  startTime: string;
  lastUpdate: string;
}

export interface Issue {
  id: string;
  type: 'FUNCTIONAL' | 'UI' | 'PERFORMANCE' | 'SECURITY' | 'A11Y';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location: string;
  stepsToReproduce: string[];
  screenshot: string;
  foundInIteration: number;
  strategy: string;
  fixed: boolean;
  fixedInIteration?: number;
}

export function loadState(filePath: string): TestState {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      iteration: 0,
      consecutiveClean: 0,
      issues: [],
      strategiesUsed: {},
      startTime: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
    };
  }
}

export function saveState(filePath: string, state: TestState): void {
  state.lastUpdate = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
}

export function addIssue(
  state: TestState,
  issue: Omit<Issue, 'id' | 'foundInIteration' | 'fixed'>
): void {
  const newIssue: Issue = {
    ...issue,
    id: `ISSUE-${Date.now()}`,
    foundInIteration: state.iteration,
    fixed: false,
  };
  state.issues.push(newIssue);
}
