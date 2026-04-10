import type { ExtractedItem, ItemCategory, ScanMode, ScanResponse } from "@/types/scraper";
import { getBrowser, resetBrowser } from "@/server/playwright/browser";
import type { Page } from "playwright";

const ABSOLUTE_PROTOCOL_RE = /^[a-zA-Z][a-zA-Z\d+.-]*:/;
const SCAN_MAX_AUTO_SCROLL_MS = 9000;
const SCAN_MAX_AUTO_SCROLL_PASSES = 48;
const SCAN_STABLE_ROUNDS_TO_STOP = 3;
const SCAN_MAX_CAPTURE_HEIGHT = 26000;
const PREVIEW_NETWORK_IDLE_TIMEOUT_MS = 1800;
const SCAN_NETWORK_IDLE_TIMEOUT_MS = 5000;
const PREVIEW_SETTLE_TIMEOUT_MS = 260;
const SCAN_SETTLE_TIMEOUT_MS = 520;
const POST_SCROLL_NETWORK_IDLE_TIMEOUT_MS = 2000;
const PREVIEW_OPERATION_TIMEOUT_MS = 32000;
const SCAN_OPERATION_TIMEOUT_MS = 45000;
const SCREENSHOT_MAX_WIDTH = 4096;
const SCREENSHOT_MAX_HEIGHT = 16000;
const SCREENSHOT_MAX_PIXELS = 30000000;
const SCREENSHOT_TIMEOUT_MS = 22000;

interface RawExtractedItem {
  category: ItemCategory;
  value: string;
  selector: string;
  sourceTag: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface CaptureViewport {
  width: number;
  height: number;
}

interface ScreenshotCaptureResult {
  buffer: Buffer;
  viewport: CaptureViewport;
}

function ensureHttpUrl(rawUrl: string): URL {
  const input = rawUrl.trim();
  if (!input) {
    throw new Error("URL is required.");
  }

  const normalized = ABSOLUTE_PROTOCOL_RE.test(input) ? input : `https://${input}`;
  const parsed = new URL(normalized);

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only HTTP(S) URLs are supported.");
  }

  return parsed;
}

function compactText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeDimension(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.round(value));
}

function sanitizeExtractedItems(items: RawExtractedItem[]): ExtractedItem[] {
  const perCategoryLimit: Record<ItemCategory, number> = {
    image: 140,
    price: 120,
    text: 220,
  };

  const counters: Record<ItemCategory, number> = {
    image: 0,
    price: 0,
    text: 0,
  };

  const visited = new Set<string>();
  const normalized: ExtractedItem[] = [];

  for (const item of items) {
    const category = item.category;
    if (!perCategoryLimit[category]) {
      continue;
    }

    if (counters[category] >= perCategoryLimit[category]) {
      continue;
    }

    const value = compactText(item.value);
    if (!value) {
      continue;
    }

    const selector = compactText(item.selector || item.sourceTag || "unknown").slice(0, 220);
    const clippedValue = value.slice(0, 280);
    const key = `${category}::${clippedValue}::${selector}`;

    if (visited.has(key)) {
      continue;
    }

    visited.add(key);
    counters[category] += 1;

    const bbox = {
      x: Math.max(0, Math.round(item.bbox.x)),
      y: Math.max(0, Math.round(item.bbox.y)),
      width: Math.max(1, Math.round(item.bbox.width)),
      height: Math.max(1, Math.round(item.bbox.height)),
    };

    normalized.push({
      id: `item-${normalized.length + 1}`,
      category,
      value: clippedValue,
      selector,
      sourceTag: item.sourceTag || "unknown",
      confidence: Number.isFinite(item.confidence)
        ? Math.max(0.01, Math.min(0.999, Number(item.confidence)))
        : 0.7,
      bbox,
    });
  }

  return normalized;
}

const CONTEXT_OPTIONS = {
  viewport: {
    width: 1366,
    height: 860,
  },
  locale: "en-US",
  timezoneId: "UTC",
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  javaScriptEnabled: true,
  ignoreHTTPSErrors: true,
} as const;

function isClosedTargetError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /target page, context or browser has been closed|browser has been closed|context.*closed/i.test(
    error.message.toLowerCase(),
  );
}

function isScreenshotCaptureError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("pages.captureScreenshot".toLowerCase()) ||
    message.includes("captureScreenshot".toLowerCase()) ||
    message.includes("unable to capture screenshot") ||
    message.includes("protocol error")
  );
}

function computeDocumentViewport(documentSize: { width: number; height: number }): CaptureViewport {
  return {
    width: normalizeDimension(documentSize.width),
    height: normalizeDimension(documentSize.height),
  };
}

function computeSafeCaptureViewport(viewport: CaptureViewport): CaptureViewport {
  let width = Math.min(viewport.width, SCREENSHOT_MAX_WIDTH);
  let height = Math.min(viewport.height, SCREENSHOT_MAX_HEIGHT);

  const pixels = width * height;
  if (pixels > SCREENSHOT_MAX_PIXELS) {
    const ratio = Math.sqrt(SCREENSHOT_MAX_PIXELS / pixels);
    width = Math.max(1, Math.floor(width * ratio));
    height = Math.max(1, Math.floor(height * ratio));
  }

  return { width, height };
}

function clipRawItemsToViewport(items: RawExtractedItem[], viewport: CaptureViewport): RawExtractedItem[] {
  return items.flatMap((item) => {
    const left = Math.max(0, item.bbox.x);
    const top = Math.max(0, item.bbox.y);
    const right = Math.min(viewport.width, item.bbox.x + item.bbox.width);
    const bottom = Math.min(viewport.height, item.bbox.y + item.bbox.height);
    const width = right - left;
    const height = bottom - top;

    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
      return [];
    }

    return [
      {
        ...item,
        bbox: {
          x: left,
          y: top,
          width,
          height,
        },
      },
    ];
  });
}

async function capturePageScreenshot(
  page: Page,
  mode: ScanMode,
  documentViewport: CaptureViewport,
): Promise<ScreenshotCaptureResult> {
  const screenshotOptions = {
    type: "jpeg" as const,
    quality: mode === "scan" ? 52 : 40,
    animations: "disabled" as const,
    caret: "hide" as const,
    timeout: SCREENSHOT_TIMEOUT_MS,
  };
  const safeViewport = computeSafeCaptureViewport(documentViewport);
  const canUseFullPage =
    safeViewport.width === documentViewport.width && safeViewport.height === documentViewport.height;

  if (canUseFullPage) {
    try {
      const buffer = await page.screenshot({
        ...screenshotOptions,
        fullPage: true,
      });

      return {
        buffer,
        viewport: documentViewport,
      };
    } catch (error) {
      if (!isScreenshotCaptureError(error)) {
        throw error;
      }
    }
  }

  try {
    const buffer = await page.screenshot({
      ...screenshotOptions,
      clip: {
        x: 0,
        y: 0,
        width: safeViewport.width,
        height: safeViewport.height,
      },
    });

    return {
      buffer,
      viewport: safeViewport,
    };
  } catch (error) {
    if (!isScreenshotCaptureError(error)) {
      throw error;
    }

    const viewportSize = page.viewportSize() ?? CONTEXT_OPTIONS.viewport;
    const fallbackViewport = {
      width: normalizeDimension(viewportSize.width),
      height: normalizeDimension(viewportSize.height),
    };
    const buffer = await page.screenshot({
      ...screenshotOptions,
      fullPage: false,
    });

    return {
      buffer,
      viewport: fallbackViewport,
    };
  }
}

async function createScanSession() {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const browser = await getBrowser();

    try {
      const context = await browser.newContext(CONTEXT_OPTIONS);
      const page = await context.newPage();
      return { context, page };
    } catch (error) {
      lastError = error;

      if (attempt === 0 && isClosedTargetError(error)) {
        await resetBrowser();
        continue;
      }

      throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to create browser context.");
}

export async function scanWebPage(rawUrl: string, mode: ScanMode): Promise<ScanResponse> {
  const targetUrl = ensureHttpUrl(rawUrl);
  const { context, page } = await createScanSession();
  const operationTimeout = mode === "scan" ? SCAN_OPERATION_TIMEOUT_MS : PREVIEW_OPERATION_TIMEOUT_MS;
  const initialNetworkIdleTimeout =
    mode === "scan" ? SCAN_NETWORK_IDLE_TIMEOUT_MS : PREVIEW_NETWORK_IDLE_TIMEOUT_MS;
  const settleTimeout = mode === "scan" ? SCAN_SETTLE_TIMEOUT_MS : PREVIEW_SETTLE_TIMEOUT_MS;

  try {
    page.setDefaultNavigationTimeout(operationTimeout);
    page.setDefaultTimeout(operationTimeout);

    await page.goto(targetUrl.href, {
      waitUntil: "domcontentloaded",
      timeout: operationTimeout,
    });

    await page.waitForLoadState("networkidle", { timeout: initialNetworkIdleTimeout }).catch(() => undefined);
    await page.waitForTimeout(settleTimeout);

    await page
      .addStyleTag({
        content:
          "*{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;caret-color:transparent!important;}",
      })
      .catch(() => undefined);

    if (mode === "scan") {
      const needsAutoScroll = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const viewportHeight = Math.max(1, window.innerHeight || 0);
        const totalHeight = Math.max(
          doc.scrollHeight,
          doc.clientHeight,
          body?.scrollHeight ?? 0,
          body?.clientHeight ?? 0,
        );

        return totalHeight > viewportHeight * 1.2;
      });

      if (needsAutoScroll) {
        await page.evaluate(
          async ({
            maxMs,
            maxPasses,
            stableRoundsToStop,
            maxCaptureHeight,
          }: {
            maxMs: number;
            maxPasses: number;
            stableRoundsToStop: number;
            maxCaptureHeight: number;
          }) => {
            const sleep = (ms: number) =>
              new Promise<void>((resolve) => {
                setTimeout(resolve, ms);
              });

            const getScrollHeight = () =>
              Math.max(
                document.documentElement.scrollHeight,
                document.documentElement.clientHeight,
                document.body?.scrollHeight ?? 0,
                document.body?.clientHeight ?? 0,
              );

            let previousHeight = getScrollHeight();
            let stableRounds = 0;
            const startedAt = Date.now();

            for (let index = 0; index < maxPasses; index += 1) {
              if (Date.now() - startedAt > maxMs) {
                break;
              }

              const viewportHeight = Math.max(320, window.innerHeight || 0);
              const step = Math.max(240, Math.floor(viewportHeight * 0.88));
              const nextY = window.scrollY + step;
              window.scrollTo(0, nextY);
              await sleep(120);

              const nextHeight = getScrollHeight();
              if (nextHeight >= maxCaptureHeight) {
                window.scrollTo(0, nextHeight);
                await sleep(140);
                break;
              }

              if (nextHeight > previousHeight + 4) {
                previousHeight = nextHeight;
                stableRounds = 0;
              } else {
                stableRounds += 1;
              }

              const nearBottom = window.scrollY + viewportHeight >= nextHeight - 6;
              if (nearBottom && stableRounds >= stableRoundsToStop) {
                break;
              }
            }

            for (let index = 0; index < 2; index += 1) {
              window.scrollTo(0, getScrollHeight());
              await sleep(140);
            }

            window.scrollTo(0, 0);
            await sleep(80);
          },
          {
            maxMs: SCAN_MAX_AUTO_SCROLL_MS,
            maxPasses: SCAN_MAX_AUTO_SCROLL_PASSES,
            stableRoundsToStop: SCAN_STABLE_ROUNDS_TO_STOP,
            maxCaptureHeight: SCAN_MAX_CAPTURE_HEIGHT,
          },
        );
      }

      await page.waitForLoadState("networkidle", { timeout: POST_SCROLL_NETWORK_IDLE_TIMEOUT_MS }).catch(
        () => undefined,
      );
    }

    const documentSize = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;

      const width = Math.max(
        doc.scrollWidth,
        doc.clientWidth,
        body?.scrollWidth ?? 0,
        body?.clientWidth ?? 0,
      );
      const height = Math.max(
        doc.scrollHeight,
        doc.clientHeight,
        body?.scrollHeight ?? 0,
        body?.clientHeight ?? 0,
      );

      return {
        width,
        height,
      };
    });

    const rawItems =
      mode === "scan"
        ? await page.evaluate(() => {
            const PRICE_REGEX =
              /([$€£¥₩]\s?\d[\d,]*(?:\.\d{1,2})?|\d[\d,]*(?:\.\d{1,2})?\s?(원|krw|usd|eur|jpy|won))/i;

            const collapse = (value: string) => value.replace(/\s+/g, " ").trim();
            const documentWidth = Math.max(
              document.documentElement.scrollWidth,
              document.documentElement.clientWidth,
              document.body?.scrollWidth ?? 0,
              document.body?.clientWidth ?? 0,
            );
            const documentHeight = Math.max(
              document.documentElement.scrollHeight,
              document.documentElement.clientHeight,
              document.body?.scrollHeight ?? 0,
              document.body?.clientHeight ?? 0,
            );

            const clipRect = (rect: DOMRect) => {
              const x = Math.max(0, rect.left + window.scrollX);
              const y = Math.max(0, rect.top + window.scrollY);
              const right = Math.min(documentWidth, rect.right + window.scrollX);
              const bottom = Math.min(documentHeight, rect.bottom + window.scrollY);
              const width = right - x;
              const height = bottom - y;

              if (width < 6 || height < 6) {
                return null;
              }

              return {
                x,
                y,
                width,
                height,
              };
            };

            const makeSelector = (element: Element): string => {
              const parts: string[] = [];
              let cursor: Element | null = element;

              while (cursor && parts.length < 5) {
                const id = cursor.getAttribute("id");
                if (id) {
                  parts.unshift(`#${id}`);
                  break;
                }

                const tag = cursor.tagName.toLowerCase();
                const className =
                  (cursor.getAttribute("class") ?? "")
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 1)
                    .join("") || "";
                parts.unshift(className ? `${tag}.${className}` : tag);
                cursor = cursor.parentElement;
              }

              return parts.join(" > ");
            };

            const outputs: RawExtractedItem[] = [];
            const visited = new Set<string>();

            const pushItem = (item: RawExtractedItem) => {
              if (!item.value) {
                return;
              }

              const key = `${item.category}::${item.value}::${item.selector}`;
              if (visited.has(key)) {
                return;
              }

              visited.add(key);
              outputs.push(item);
            };

            const imageNodes = Array.from(document.querySelectorAll("img")).slice(0, 900);
            for (const image of imageNodes) {
              const rect = image.getBoundingClientRect();
              const bbox = clipRect(rect);
              if (!bbox) {
                continue;
              }

              const src = (image as HTMLImageElement).currentSrc || image.getAttribute("src") || "";
              const value = collapse(src);
              if (!value) {
                continue;
              }

              pushItem({
                category: "image",
                value,
                selector: makeSelector(image),
                sourceTag: image.tagName.toLowerCase(),
                confidence: 0.96,
                bbox,
              });
            }

            const textNodes = Array.from(
              document.querySelectorAll(
                "h1,h2,h3,h4,h5,h6,p,span,a,li,td,th,strong,b,em,small,button,label,div",
              ),
            ).slice(0, 2200);

            for (const node of textNodes) {
              if (node.children.length > 8 && node.tagName.toLowerCase() === "div") {
                continue;
              }

              const text = collapse(node.textContent || (node as HTMLElement).innerText || "");
              if (!text || text.length < 2 || text.length > 220) {
                continue;
              }

              const rect = node.getBoundingClientRect();
              const bbox = clipRect(rect);
              if (!bbox) {
                continue;
              }

              const category = PRICE_REGEX.test(text) ? "price" : "text";
              pushItem({
                category,
                value: text,
                selector: makeSelector(node),
                sourceTag: node.tagName.toLowerCase(),
                confidence: category === "price" ? 0.92 : 0.78,
                bbox,
              });
            }

            return outputs;
          })
        : [];

    const documentViewport = computeDocumentViewport(documentSize);
    const captureResult = await capturePageScreenshot(page, mode, documentViewport);
    const clippedItems = clipRawItemsToViewport(rawItems, captureResult.viewport);

    return {
      resolvedUrl: page.url(),
      title: await page.title(),
      screenshotMimeType: "image/jpeg",
      screenshotBase64: captureResult.buffer.toString("base64"),
      viewport: captureResult.viewport,
      items: sanitizeExtractedItems(clippedItems),
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown scan error.";
    throw new Error(`Playwright scan failed: ${message}`);
  } finally {
    await context.close();
  }
}
