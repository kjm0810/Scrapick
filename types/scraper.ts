export type ItemCategory = "image" | "price" | "text";

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
