import { NextRequest, NextResponse } from "next/server";

import { scanWebPage } from "@/server/api/scan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ScanRequestBody {
  url?: string;
  mode?: "preview" | "scan";
}

export async function POST(request: NextRequest) {
  let body: ScanRequestBody | null = null;

  try {
    body = (await request.json()) as ScanRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const url = typeof body?.url === "string" ? body.url : "";
  const mode = body?.mode === "preview" ? "preview" : "scan";

  if (!url.trim()) {
    return NextResponse.json({ error: "Missing required field: url" }, { status: 400 });
  }

  try {
    const payload = await scanWebPage(url, mode);

    return NextResponse.json(payload, {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Playwright scan failed.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}
