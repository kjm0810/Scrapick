import { NextResponse } from "next/server";

import { getScanJob, markScanJobCanceled } from "@/server/scan-jobs/store";
import type { ScanJobStatusResponse } from "@/types/scraper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    jobId: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;

  if (!jobId) {
    return NextResponse.json({ error: "Missing job id." }, { status: 400 });
  }

  try {
    const job = await getScanJob(jobId);
    if (!job) {
      return NextResponse.json({ error: "Scan job not found." }, { status: 404 });
    }

    const payload: ScanJobStatusResponse = {
      jobId: job.jobId,
      status: job.status,
      updatedAt: job.updatedAt,
    };

    if (job.status === "failed" && job.error) {
      payload.error = job.error;
    }

    if (job.status === "succeeded" && job.result) {
      payload.result = job.result;
    }

    return NextResponse.json(payload, {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read scan job.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;

  if (!jobId) {
    return NextResponse.json({ error: "Missing job id." }, { status: 400 });
  }

  try {
    const job = await getScanJob(jobId);
    if (!job) {
      return NextResponse.json({ error: "Scan job not found." }, { status: 404 });
    }

    await markScanJobCanceled(jobId);

    return NextResponse.json(
      {
        jobId,
        status: "canceled",
      },
      {
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel scan job.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
