import { handleQueueCallback } from "@/server/scan-jobs/client";
import { runScanJobWorker } from "@/server/scan-jobs/worker";
import type { ScanMode } from "@/types/scraper";

interface ScanQueueMessage {
  jobId?: string;
  mode?: ScanMode;
  url?: string;
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
  },
);
