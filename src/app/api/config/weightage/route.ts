import { NextRequest, NextResponse } from "next/server";
import { generateWeightageConfig } from "@/lib/config-processor";

export async function POST(req: NextRequest) {
  try {
    const { data } = await req.json();
    if (!data) return NextResponse.json({ error: "Missing data" }, { status: 400 });
    const result = generateWeightageConfig(data);
    return NextResponse.json({ output: result.config, duplicates: result.duplicates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
