import { scanWebPage } from "@/server/api/scan";
import { handleQueueCallback } from "@/server/scan-jobs/client";
import type { ScanMode } from "@/types/scraper";
import {
  markScanJobFailed,
  markScanJobProcessing,
  markScanJobSucceeded,
  releaseScanWorkerLock,
  tryAcquireScanWorkerLock,
} from "@/server/scan-jobs/store";

const CALLBACK_MAX_ATTEMPTS = 2;
const CALLBACK_RETRY_DELAY_MS = 600;

interface ScanQueueMessage {
  jobId?: string;
  mode?: ScanMode;
  url?: string;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = handleQueueCallback<ScanQueueMessage>(
  async (message, metadata) => {
    const mode = message.mode === "preview" ? "preview" : message.mode === "scan" ? "scan" : null;
    const jobId = typeof message.jobId === "string" ? message.jobId : "";
    const url = typeof message.url === "string" ? message.url : "";

    if (!jobId || !url || !mode) {
      return;
    }

    const lockOwner = `${jobId}:${metadata.messageId}`;
    const lockAcquired = await tryAcquireScanWorkerLock(lockOwner);
    if (!lockAcquired) {
      throw new Error("Scan worker is busy.");
    }

    try {
      await markScanJobProcessing(jobId);

      let lastError: unknown = null;
      for (let attempt = 1; attempt <= CALLBACK_MAX_ATTEMPTS; attempt += 1) {
        try {
          const result = await scanWebPage(url, mode);
          await markScanJobSucceeded(jobId, result);
          return;
        } catch (error) {
          lastError = error;

          if (attempt < CALLBACK_MAX_ATTEMPTS) {
            await sleep(CALLBACK_RETRY_DELAY_MS);
          }
        }
      }

      const errorMessage = lastError instanceof Error ? lastError.message : "Playwright scan failed.";
      await markScanJobFailed(jobId, errorMessage);
    } finally {
      await releaseScanWorkerLock(lockOwner);
    }
  },
  {
    visibilityTimeoutSeconds: 900,
  },
);
