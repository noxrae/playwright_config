import { ParsedTest, Test, Step, Result, NormalizedReport } from "../types/report";

export function deriveOk(testObj: any): boolean {
  if (typeof testObj.ok === "boolean") {
    return testObj.ok;
  }

  const status = String(testObj.status || "").toLowerCase();
  if (["passed", "expected", "ok"].includes(status)) {
    return true;
  }
  if (["failed", "timedout", "interrupted"].includes(status)) {
    return false;
  }

  const results = testObj.results;
  if (Array.isArray(results) && results.length > 0) {
    const normalized = results.map((r: any) => String(r.status || "").toLowerCase());
    if (normalized.some((s: string) => ["failed", "timedout", "interrupted"].includes(s))) {
      return false;
    }
    if (normalized.every((s: string) => ["passed", "expected", "skipped"].includes(s))) {
      return true;
    }
  }

  return false;
}

export function parseSingleTestJson(fileData: any): ParsedTest[] {
  const testsList = fileData.tests;
  if (!Array.isArray(testsList)) {
    return [];
  }

  const parsedResults: ParsedTest[] = [];
  for (const testData of testsList) {
    if (typeof testData !== "object" || testData === null) continue;

    const title = String(testData.title || "");
    const projectName = String(testData.projectName || "unknown");
    const results = Array.isArray(testData.results) ? testData.results : [];

    parsedResults.push({
      title,
      projectName,
      ok: deriveOk(testData),
      results: results.filter((r: any) => typeof r === "object" && r !== null),
    });
  }
  return parsedResults;
}

export function parsePlaywrightTests(reportData: any): ParsedTest[] {
  const suites = reportData?.suites;
  if (!Array.isArray(suites)) {
    return [];
  }

  const parsedTests: ParsedTest[] = [];
  const stack: any[] = [...suites].reverse().filter((s: any) => typeof s === "object" && s !== null);

  while (stack.length > 0) {
    const suite = stack.pop();

    const childSuites = suite.suites;
    if (Array.isArray(childSuites)) {
      for (let i = childSuites.length - 1; i >= 0; i--) {
        const child = childSuites[i];
        if (typeof child === "object" && child !== null) {
          stack.push(child);
        }
      }
    }

    const specs = suite.specs;
    if (!Array.isArray(specs)) continue;

    for (const spec of specs) {
      if (typeof spec !== "object" || spec === null) continue;
      const tests = spec.tests;
      if (!Array.isArray(tests)) continue;

      for (const test of tests) {
        if (typeof test !== "object" || test === null) continue;

        const title = String(test.title || spec.title || "");
        const projectName = String(test.projectName || "unknown");
        const results = Array.isArray(test.results) ? test.results : [];

        parsedTests.push({
          title,
          projectName,
          ok: deriveOk(test),
          results: results.filter((r: any) => typeof r === "object" && r !== null),
        });
      }
    }
  }

  return parsedTests;
}

function normalizeStep(stepObj: any): Step {
  const title = String(stepObj.title || "");
  const stepStatus = String(stepObj.status || "").toLowerCase();
  const skipped = !!stepObj.skipped || stepStatus === "skipped";
  return {
    title,
    skipped,
  };
}

function normalizeSteps(rootSteps: any[]): Step[] {
  if (!rootSteps || !Array.isArray(rootSteps)) {
    return [];
  }

  // 1. Normalize all top-level steps
  const allSteps = rootSteps
    .filter((s: any) => typeof s === "object" && s !== null)
    .map((s: any) => normalizeStep(s));

  // 2. Extract Before Hooks, After Hooks, and everything in between
  const beforeHooks = allSteps.filter((s) => s.title === "Before Hooks");
  const afterHooks = allSteps.filter((s) => s.title === "After Hooks");
  const middleSteps = allSteps.filter((s) => s.title !== "Before Hooks" && s.title !== "After Hooks");

  const orderedResult: Step[] = [];

  // Ensure Before Hooks is first
  if (beforeHooks.length > 0) {
    orderedResult.push(beforeHooks[0]);
  } else {
    orderedResult.push({ title: "Before Hooks", skipped: false });
  }

  // Add all test actions
  orderedResult.push(...middleSteps);

  // Ensure After Hooks is last
  if (afterHooks.length > 0) {
    orderedResult.push(afterHooks[0]);
  } else {
    orderedResult.push({ title: "After Hooks", skipped: false });
  }

  return orderedResult;
}

export function transformTests(parsedTests: ParsedTest[]): Test[] {
  const normalizedTests: Test[] = [];

  for (const test of parsedTests) {
    const normalizedResults: Result[] = [];

    for (const result of test.results) {
      const steps = Array.isArray(result.steps) ? result.steps : [];
      normalizedResults.push({ steps: normalizeSteps(steps) });
    }

    normalizedTests.push({
      title: test.title,
      projectName: test.projectName,
      results: normalizedResults,
      ok: test.ok,
    });
  }

  return normalizedTests;
}

export function buildNormalizedReport(normalizedTests: Test[]): NormalizedReport {
  return { tests: normalizedTests };
}
