import { handleQueueCallback } from "@/server/scan-jobs/client";
import { runScanJobWorker } from "@/server/scan-jobs/worker";
import type { ScanMode } from "@/types/scraper";

interface ScanQueueMessage {
  jobId?: string;
  mode?: ScanMode;
  url?: string;
}

function isWorkerBusyError(error: unknown): boolean {
  return error instanceof Error && error.message.toLowerCase().includes("scan worker is busy");
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = handleQueueCallback<ScanQueueMessage>(
  async (message, metadata) => {
    if (!message.jobId || !message.mode || !message.url) {
      return;
    }

    await runScanJobWorker({
      jobId: message.jobId,
      mode: message.mode,
      url: message.url,
      messageId: metadata.messageId,
    });
  },
  {
    visibilityTimeoutSeconds: 900,
    retry: (error, metadata) => {
      if (isWorkerBusyError(error)) {
        if (metadata.deliveryCount > 90) {
          return { acknowledge: true };
        }

        return { afterSeconds: 6 };
      }

      return { afterSeconds: Math.min(90, 6 * Math.max(1, metadata.deliveryCount)) };
    },
  },
);
