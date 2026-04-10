import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { enqueueScanJob } from "@/server/scan-jobs/queue";
import { createQueuedScanJob, markScanJobFailed } from "@/server/scan-jobs/store";
import type { ScanEnqueueResponse, ScanMode } from "@/types/scraper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ScanRequestBody {
  url?: string;
  mode?: ScanMode;
}

export async function POST(request: NextRequest) {
  let body: ScanRequestBody | null = null;

  try {
    body = (await request.json()) as ScanRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const url = typeof body?.url === "string" ? body.url : "";
  const mode: ScanMode = body?.mode === "preview" ? "preview" : "scan";

  if (!url.trim()) {
    return NextResponse.json({ error: "Missing required field: url" }, { status: 400 });
  }

  const jobId = randomUUID();
  const queuedAt = new Date().toISOString();

  try {
    await createQueuedScanJob({
      jobId,
      mode,
      url,
      queuedAt,
    });

    const { messageId } = await enqueueScanJob({
      jobId,
      mode,
      url,
    });

    const payload: ScanEnqueueResponse = {
      jobId,
      messageId,
      queuedAt,
      status: "queued",
    };

    return NextResponse.json(payload, {
      status: 202,
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to enqueue scan job.";
    await markScanJobFailed(jobId, `Queue enqueue failed: ${message}`).catch(() => undefined);

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}
