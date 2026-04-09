import { NextRequest, NextResponse } from "next/server";

import { fetchAndRewriteHtml } from "@/server/api/proxy.get";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing required query parameter: url" }, { status: 400 });
  }

  try {
    const payload = await fetchAndRewriteHtml(targetUrl);
    return NextResponse.json(payload, {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch target HTML.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
