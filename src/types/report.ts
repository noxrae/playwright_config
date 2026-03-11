export interface Step {
  title: string;
  skipped: boolean;
}

export interface Result {
  steps: Step[];
}

export interface Test {
  title: string;
  projectName: string;
  results: Result[];
  ok: boolean;
}

export interface NormalizedReport {
  tests: Test[];
}

export interface ParsedTest {
  title: string;
  projectName: string;
  ok: boolean;
  results: any[];
}
