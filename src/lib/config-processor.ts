export function parsePlaywrightLogs(inputText: string): { tests: any[]; duplicates: string[] } {
  const tests: any[] = [];
  const duplicates: string[] = [];
  const seenTests: Set<string> = new Set();
  const lines = inputText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  const titleBlacklist = ["search tests", "next »", "« previous", "next", "previous"];
  const durationRegex = /^(\d+(\.\d+)?(ms|s|m|h))$/;
  const separatorRegex = /[—…\u2014\u2026]/;

  let i = 0;
  while (i < lines.length) {
    if (lines[i].includes(".spec.ts") && !separatorRegex.test(lines[i])) {
      let titleIdx = i - 1;
      while (titleIdx >= 0) {
        const lineLower = lines[titleIdx].toLowerCase();
        if (
          !lineLower ||
          durationRegex.test(lineLower) ||
          titleBlacklist.some((term) => lineLower.includes(term))
        ) {
          titleIdx--;
          continue;
        }
        break;
      }

      const title = titleIdx >= 0 ? lines[titleIdx] : "Unknown Test";
      let projectName = "chromium";
      let k = i + 1;
      const steps: any[] = [];
      let foundBeforeHooks = false;

      while (k < lines.length) {
        const line = lines[k];
        if (!line) {
          k++;
          continue;
        }

        if (["chromium", "firefox", "webkit"].includes(line.toLowerCase())) {
          projectName = line.toLowerCase();
        }

        if (line.includes("Before Hooks")) {
          foundBeforeHooks = true;
        }

        if (foundBeforeHooks) {
          const cleanedStep = line.split(separatorRegex)[0].trim();
          if (cleanedStep && !durationRegex.test(cleanedStep)) {
            steps.push({ title: cleanedStep, skipped: false });
          }
        }

        if (line.includes("After Hooks")) {
          break;
        }

        if (
          k + 1 < lines.length &&
          lines[k + 1].includes(".spec.ts") &&
          !separatorRegex.test(lines[k + 1])
        ) {
          break;
        }
        k++;
      }

      if (steps.length > 0) {
        const testKey = `${title}-${projectName}`;
        if (seenTests.has(testKey)) {
          duplicates.push(title);
        } else {
          seenTests.add(testKey);
          tests.push({
            title,
            projectName,
            results: [{ steps }],
            ok: true,
          });
        }
      }
      i = k;
    }
    i++;
  }

  return { tests, duplicates };
}

export function generateWeightageConfig(inputData: any): { config: any[]; duplicates: string[] } {
  try {
    const data = typeof inputData === "string" ? JSON.parse(inputData) : inputData;
    const tests = data.tests || [];
    const duplicates: string[] = [];
    const seenNames: Set<string> = new Set();

    if (tests.length === 0) {
      return { config: [], duplicates: [] };
    }

    const uniqueTests = [];
    for (const test of tests) {
      const title = test.title;
      if (seenNames.has(title)) {
        duplicates.push(title);
      } else {
        seenNames.add(title);
        uniqueTests.push(test);
      }
    }

    const n = uniqueTests.length;
    const d = 0.001;
    const a = (1 - (n * (n - 1) * d) / 2) / n;

    const testcases = [];
    let currentTotal = 0.0;

    for (let index = 0; index < n; index++) {
      const test = uniqueTests[index];
      let weight: number;
      if (index === n - 1) {
        weight = parseFloat((1.0 - currentTotal).toFixed(3));
      } else {
        weight = parseFloat((a + index * d).toFixed(3));
        if (weight <= 0) {
          weight = parseFloat((1.0 / n).toFixed(3));
        }
        currentTotal += weight;
      }

      testcases.push({
        name: test.title,
        weightage: weight,
      });
    }

    const config = [
      {
        testcases,
        testcase_path: "/home/coder/project/workspace/nodejest",
        evaluation_type: "Node Jest",
        testcase_run_command: "sh /home/coder/project/workspace/nodejest/run.sh",
      },
    ];

    return { config, duplicates };
  } catch (error) {
    return { config: [], duplicates: [] };
  }
}
