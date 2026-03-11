import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";
import { parsePlaywrightTests, parseSingleTestJson, transformTests, buildNormalizedReport } from "@/lib/normalizer";
import { ParsedTest } from "@/types/report";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    let allParsedResults: ParsedTest[] = [];

    // Filter out directories and only look for .json files
    const jsonEntries = zipEntries.filter(entry => entry.entryName.endsWith(".json") && !entry.isDirectory);

    // 1. Try to find a valid report.json (with 'suites')
    const reportEntry = jsonEntries.find(entry => entry.entryName.endsWith("report.json"));
    if (reportEntry) {
      try {
        const reportData = JSON.parse(reportEntry.getData().toString("utf8"));
        if (reportData && Array.isArray(reportData.suites)) {
          allParsedResults = parsePlaywrightTests(reportData);
        }
      } catch (e) {
        console.warn("Failed to parse report.json, will try fallback discovery.");
      }
    }

    // 2. If no results yet, look for individual test JSON files (those with 'tests' array)
    if (allParsedResults.length === 0) {
      for (const entry of jsonEntries) {
        try {
          const fileData = JSON.parse(entry.getData().toString("utf8"));
          if (fileData && Array.isArray(fileData.tests)) {
            const results = parseSingleTestJson(fileData);
            allParsedResults.push(...results);
          }
        } catch (e) {
          // Ignore malformed JSONs
        }
      }
    }

    if (allParsedResults.length === 0) {
      return NextResponse.json({ error: "No Playwright tests found in zip" }, { status: 400 });
    }

    const normalizedTests = transformTests(allParsedResults);
    const report = buildNormalizedReport(normalizedTests);

    // Calculate stats
    const total = normalizedTests.length;
    const passed = normalizedTests.filter(t => t.ok).length;
    const failed = total - passed;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const steps = normalizedTests.reduce((acc, t) => acc + t.results.reduce((acc2, r) => acc2 + r.steps.length, 0), 0);

    return NextResponse.json({
      report,
      summary: {
        total,
        passed,
        failed,
        passRate,
        steps
      }
    });
  } catch (error: any) {
    console.error("Processing error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
