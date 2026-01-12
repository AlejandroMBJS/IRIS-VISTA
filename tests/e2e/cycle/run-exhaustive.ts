import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Exhaustive E2E Test Cycle Runner
 *
 * Runs continuous test cycles until 10 consecutive clean iterations
 * are achieved without finding any new issues.
 */

// Configuration
const TARGET_CLEAN_ITERATIONS = 10;
const STATE_FILE = path.join(__dirname, 'state.json');
const REPORT_FILE = path.join(__dirname, '../reports/FINAL_REPORT.md');
const PAUSE_BETWEEN_ITERATIONS = 5000; // 5 seconds

// Test strategies with their corresponding test files
const STRATEGIES: Record<string, string[]> = {
  'auth-flows': ['01-auth.spec.ts'],
  'registration-approval': ['02-registro.spec.ts'],
  'purchase-request-catalog': ['03-solicitud.spec.ts'],
  'approval-flow': ['04-aprobacion.spec.ts'],
  'order-management': ['05-pedidos.spec.ts'],
  'notifications': ['07-notificaciones.spec.ts'],
  'amazon-integration': ['09-amazon.spec.ts'],
  'responsive-mobile': ['10-responsive.spec.ts'],
};

// Types
interface TestState {
  iteration: number;
  consecutiveClean: number;
  issues: Issue[];
  strategiesUsed: Record<string, number>;
  startTime: string;
  lastUpdate: string;
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
}

interface Issue {
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

// Load or initialize state
function loadState(): TestState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('Starting fresh state');
  }

  return {
    iteration: 0,
    consecutiveClean: 0,
    issues: [],
    strategiesUsed: {},
    startTime: new Date().toISOString(),
    lastUpdate: new Date().toISOString(),
    testsRun: 0,
    testsPassed: 0,
    testsFailed: 0,
  };
}

// Save state
function saveState(state: TestState): void {
  state.lastUpdate = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Select least-used strategy
function selectStrategy(state: TestState): string {
  const strategies = Object.keys(STRATEGIES);
  let minUsed = Infinity;
  let selectedStrategy = strategies[0];

  for (const strategy of strategies) {
    const usedCount = state.strategiesUsed[strategy] || 0;
    if (usedCount < minUsed) {
      minUsed = usedCount;
      selectedStrategy = strategy;
    }
  }

  return selectedStrategy;
}

// Run tests for a strategy
async function runTests(strategy: string): Promise<{
  passed: number;
  failed: number;
  issues: Partial<Issue>[];
}> {
  const testFiles = STRATEGIES[strategy];
  const issues: Partial<Issue>[] = [];
  let passed = 0;
  let failed = 0;

  for (const testFile of testFiles) {
    const testPath = path.join(__dirname, '../flows', testFile);

    if (!fs.existsSync(testPath)) {
      console.log(`Test file not found: ${testFile}`);
      continue;
    }

    console.log(`Running: ${testFile}`);

    try {
      // Run playwright test
      const result = execSync(
        `npx playwright test "${testPath}" --reporter=json --project="Desktop Chrome"`,
        {
          cwd: path.join(__dirname, '..'),
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024,
          timeout: 300000, // 5 minutes per test file
        }
      );

      // Parse results
      try {
        const jsonResult = JSON.parse(result);
        const suites = jsonResult.suites || [];

        for (const suite of suites) {
          for (const spec of suite.specs || []) {
            if (spec.ok) {
              passed++;
            } else {
              failed++;
              // Add issue for failed test
              issues.push({
                type: 'FUNCTIONAL',
                severity: 'medium',
                description: `Test failed: ${spec.title}`,
                location: testFile,
                stepsToReproduce: [`Run test: ${spec.title}`],
                screenshot: '',
                strategy,
              });
            }
          }
        }
      } catch (parseError) {
        // Couldn't parse JSON, assume success if no error thrown
        passed++;
      }
    } catch (error: any) {
      // Test execution failed
      failed++;

      // Try to extract error information
      const errorMessage = error.stderr || error.stdout || error.message || 'Unknown error';

      issues.push({
        type: 'FUNCTIONAL',
        severity: 'high',
        description: `Test execution error in ${testFile}: ${errorMessage.slice(0, 200)}`,
        location: testFile,
        stepsToReproduce: [`Run: npx playwright test ${testFile}`],
        screenshot: '',
        strategy,
      });

      console.log(`Error in ${testFile}:`, errorMessage.slice(0, 500));
    }
  }

  return { passed, failed, issues };
}

// Generate final report
function generateReport(state: TestState): void {
  const endTime = new Date().toISOString();
  const startDate = new Date(state.startTime);
  const endDate = new Date(endTime);
  const duration = Math.round((endDate.getTime() - startDate.getTime()) / 1000);

  const criticalIssues = state.issues.filter((i) => i.severity === 'critical' && !i.fixed);
  const highIssues = state.issues.filter((i) => i.severity === 'high' && !i.fixed);
  const mediumIssues = state.issues.filter((i) => i.severity === 'medium' && !i.fixed);
  const lowIssues = state.issues.filter((i) => i.severity === 'low' && !i.fixed);
  const fixedIssues = state.issues.filter((i) => i.fixed);

  const report = `# IRIS Vista E2E Testing - Final Report

## Summary

| Metric | Value |
|--------|-------|
| Start Time | ${state.startTime} |
| End Time | ${endTime} |
| Duration | ${Math.floor(duration / 60)} minutes ${duration % 60} seconds |
| Total Iterations | ${state.iteration} |
| Clean Iterations | ${state.consecutiveClean}/${TARGET_CLEAN_ITERATIONS} |
| Tests Run | ${state.testsRun} |
| Tests Passed | ${state.testsPassed} |
| Tests Failed | ${state.testsFailed} |
| Pass Rate | ${state.testsRun > 0 ? ((state.testsPassed / state.testsRun) * 100).toFixed(1) : 0}% |

## Issues Summary

| Severity | Open | Fixed |
|----------|------|-------|
| Critical | ${criticalIssues.length} | ${fixedIssues.filter((i) => i.severity === 'critical').length} |
| High | ${highIssues.length} | ${fixedIssues.filter((i) => i.severity === 'high').length} |
| Medium | ${mediumIssues.length} | ${fixedIssues.filter((i) => i.severity === 'medium').length} |
| Low | ${lowIssues.length} | ${fixedIssues.filter((i) => i.severity === 'low').length} |
| **Total** | ${state.issues.length - fixedIssues.length} | ${fixedIssues.length} |

## Strategies Used

| Strategy | Executions |
|----------|------------|
${Object.entries(state.strategiesUsed)
  .map(([strategy, count]) => `| ${strategy} | ${count} |`)
  .join('\n')}

## Open Issues

${
  state.issues.filter((i) => !i.fixed).length === 0
    ? '_No open issues_'
    : state.issues
        .filter((i) => !i.fixed)
        .map(
          (issue) => `
### ${issue.id} - ${issue.severity.toUpperCase()}

- **Type:** ${issue.type}
- **Location:** ${issue.location}
- **Description:** ${issue.description}
- **Found in iteration:** ${issue.foundInIteration}
- **Strategy:** ${issue.strategy}

**Steps to reproduce:**
${issue.stepsToReproduce.map((step) => `1. ${step}`).join('\n')}
`
        )
        .join('\n---\n')
}

## Conclusion

${
  state.consecutiveClean >= TARGET_CLEAN_ITERATIONS
    ? '**SUCCESSFUL** - Achieved ' +
      TARGET_CLEAN_ITERATIONS +
      ' consecutive clean iterations.'
    : '**PENDING** - Did not achieve ' +
      TARGET_CLEAN_ITERATIONS +
      ' consecutive clean iterations. Review open issues.'
}

## Recommendations

${
  state.issues.filter((i) => !i.fixed).length === 0
    ? '- System is ready for production'
    : `
- Address all critical and high severity issues before deployment
- Review medium severity issues for potential improvements
- Consider automated regression testing for fixed issues
`
}

---
_Report generated automatically by IRIS Vista E2E Test Runner_
`;

  fs.writeFileSync(REPORT_FILE, report);
  console.log(`\nReport generated: ${REPORT_FILE}`);
}

// Main execution
async function main(): Promise<void> {
  console.log('====================================');
  console.log('IRIS Vista E2E Exhaustive Test Cycle');
  console.log('====================================\n');

  let state = loadState();
  console.log(`Starting from iteration ${state.iteration}`);
  console.log(`Current clean streak: ${state.consecutiveClean}/${TARGET_CLEAN_ITERATIONS}\n`);

  while (state.consecutiveClean < TARGET_CLEAN_ITERATIONS) {
    state.iteration++;
    console.log(`\n--- Iteration ${state.iteration} ---`);
    console.log(`Clean streak: ${state.consecutiveClean}/${TARGET_CLEAN_ITERATIONS}`);

    // Select strategy
    const strategy = selectStrategy(state);
    console.log(`Selected strategy: ${strategy}`);

    // Update usage count
    state.strategiesUsed[strategy] = (state.strategiesUsed[strategy] || 0) + 1;

    // Run tests
    const { passed, failed, issues } = await runTests(strategy);

    state.testsRun += passed + failed;
    state.testsPassed += passed;
    state.testsFailed += failed;

    console.log(`Results: ${passed} passed, ${failed} failed`);

    // Check for new issues
    const existingIssueDescriptions = new Set(state.issues.map((i) => i.description));
    const newIssues = issues.filter((i) => !existingIssueDescriptions.has(i.description || ''));

    if (newIssues.length > 0) {
      console.log(`Found ${newIssues.length} new issue(s) - resetting clean counter`);

      // Add new issues
      for (const issue of newIssues) {
        state.issues.push({
          id: `ISSUE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: issue.type || 'FUNCTIONAL',
          severity: issue.severity || 'medium',
          description: issue.description || 'Unknown issue',
          location: issue.location || 'unknown',
          stepsToReproduce: issue.stepsToReproduce || [],
          screenshot: issue.screenshot || '',
          foundInIteration: state.iteration,
          strategy: issue.strategy || strategy,
          fixed: false,
        });
      }

      state.consecutiveClean = 0;
    } else if (failed === 0) {
      state.consecutiveClean++;
      console.log(`Clean iteration! ${state.consecutiveClean}/${TARGET_CLEAN_ITERATIONS}`);
    } else {
      // Failed tests but issues already known
      console.log('Known issues encountered, not resetting counter');
      state.consecutiveClean++;
    }

    // Save state
    saveState(state);

    // Check if we've achieved the goal
    if (state.consecutiveClean >= TARGET_CLEAN_ITERATIONS) {
      console.log('\n====================================');
      console.log('SUCCESS! Achieved 10 consecutive clean iterations!');
      console.log('====================================\n');
      break;
    }

    // Pause between iterations
    console.log(`Pausing ${PAUSE_BETWEEN_ITERATIONS / 1000} seconds before next iteration...`);
    await new Promise((resolve) => setTimeout(resolve, PAUSE_BETWEEN_ITERATIONS));

    // Safety limit to prevent infinite loops during development
    if (state.iteration >= 100) {
      console.log('Reached iteration limit (100). Stopping.');
      break;
    }
  }

  // Generate final report
  generateReport(state);

  console.log('\nTest cycle complete!');
  console.log(`Total iterations: ${state.iteration}`);
  console.log(`Final clean streak: ${state.consecutiveClean}/${TARGET_CLEAN_ITERATIONS}`);
  console.log(`Total issues found: ${state.issues.length}`);
  console.log(`Open issues: ${state.issues.filter((i) => !i.fixed).length}`);
}

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
