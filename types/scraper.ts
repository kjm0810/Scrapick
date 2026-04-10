export type ItemCategory = "image" | "price" | "text";
export type ScanMode = "preview" | "scan";
export type ScanJobStatus = "queued" | "processing" | "succeeded" | "failed" | "canceled";

export interface ScanBbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtractedItem {
  id: string;
  category: ItemCategory;
  value: string;
  selector: string;
  sourceTag: string;
  confidence: number;
  bbox: ScanBbox;
}

export interface ScanViewport {
  width: number;
  height: number;
}

export interface ScanResponse {
  resolvedUrl: string;
  title: string;
  screenshotMimeType: string;
  screenshotBase64: string;
  viewport: ScanViewport;
  items: ExtractedItem[];
  fetchedAt: string;
}

export interface ScanEnqueueResponse {
  jobId: string;
  messageId: string | null;
  queuedAt: string;
  status: "queued";
}

export interface ScanJobStatusResponse {
  jobId: string;
  status: ScanJobStatus;
  updatedAt: string;
  error?: string;
  result?: ScanResponse;
}
