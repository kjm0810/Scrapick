import type { ScanMode } from "@/types/scraper";
import { sendQueueMessage } from "@/server/scan-jobs/client";

export const SCAN_QUEUE_TOPIC = "scan-jobs";

export interface ScanQueueMessage {
  jobId: string;
  mode: ScanMode;
  url: string;
}

export async function enqueueScanJob(message: ScanQueueMessage) {
  return await sendQueueMessage(SCAN_QUEUE_TOPIC, message);
}
