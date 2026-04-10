import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { enqueueScanJob } from "@/server/scan-jobs/queue";
import { createQueuedScanJob, markScanJobFailed } from "@/server/scan-jobs/store";
import { runScanJobWorker } from "@/server/scan-jobs/worker";
import type { ScanEnqueueResponse, ScanMode } from "@/types/scraper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ScanRequestBody {
  url?: string;
  mode?: ScanMode;
}

function shouldRunLocalFallback(error: unknown): boolean {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  if (!(error instanceof Error)) {
    return true;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("oidc token") ||
    message.includes("vc link") ||
    message.includes("vercel env pull") ||
    message.includes("x-vercel-oidc-token")
  );
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
    if (shouldRunLocalFallback(error)) {
      void runScanJobWorker({
        jobId,
        mode,
        url,
        messageId: "local-fallback",
      }).catch(async (workerError) => {
        const reason = workerError instanceof Error ? workerError.message : "Local worker failed.";
        await markScanJobFailed(jobId, reason).catch(() => undefined);
      });

      const payload: ScanEnqueueResponse = {
        jobId,
        messageId: null,
        queuedAt,
        status: "queued",
      };

      return NextResponse.json(payload, {
        status: 202,
        headers: {
          "cache-control": "no-store",
        },
      });
    }

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
