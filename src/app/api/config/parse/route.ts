import { NextRequest, NextResponse } from "next/server";
import { parsePlaywrightLogs } from "@/lib/config-processor";

export async function POST(req: NextRequest) {
  try {
    const { data } = await req.json();
    if (!data) return NextResponse.json({ error: "Missing data" }, { status: 400 });
    const result = parsePlaywrightLogs(data);
    return NextResponse.json({ output: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
