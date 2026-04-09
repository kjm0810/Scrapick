import type { ExtractedItem, ItemCategory, ScanResponse } from "@/types/scraper";
import { getBrowser } from "@/server/playwright/browser";

const ABSOLUTE_PROTOCOL_RE = /^[a-zA-Z][a-zA-Z\d+.-]*:/;
const MAX_AUTO_SCROLL_MS = 22000;
const MAX_AUTO_SCROLL_PASSES = 120;
const STABLE_ROUNDS_TO_STOP = 5;
const MAX_CAPTURE_HEIGHT = 42000;

type ScanMode = "preview" | "scan";

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

export async function scanWebPage(rawUrl: string, mode: ScanMode): Promise<ScanResponse> {
  const targetUrl = ensureHttpUrl(rawUrl);
  const browser = await getBrowser();

  const context = await browser.newContext({
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
  });

  const page = await context.newPage();

  try {
    page.setDefaultNavigationTimeout(45000);
    page.setDefaultTimeout(45000);

    await page.goto(targetUrl.href, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => undefined);
    await page.waitForTimeout(1200);

    await page
      .addStyleTag({
        content:
          "*{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;caret-color:transparent!important;}",
      })
      .catch(() => undefined);

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
        const step = Math.max(240, Math.floor(viewportHeight * 0.9));
        const nextY = window.scrollY + step;
        window.scrollTo(0, nextY);
        await sleep(180);

        const nextHeight = getScrollHeight();
        if (nextHeight >= maxCaptureHeight) {
          window.scrollTo(0, nextHeight);
          await sleep(220);
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

      for (let index = 0; index < 3; index += 1) {
        window.scrollTo(0, getScrollHeight());
        await sleep(220);
      }

      window.scrollTo(0, 0);
      await sleep(120);
      },
      {
        maxMs: MAX_AUTO_SCROLL_MS,
        maxPasses: MAX_AUTO_SCROLL_PASSES,
        stableRoundsToStop: STABLE_ROUNDS_TO_STOP,
        maxCaptureHeight: MAX_CAPTURE_HEIGHT,
      },
    );

    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => undefined);

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

            const imageNodes = Array.from(document.querySelectorAll("img")).slice(0, 1200);
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
            ).slice(0, 4000);

            for (const node of textNodes) {
              const rect = node.getBoundingClientRect();
              const bbox = clipRect(rect);
              if (!bbox) {
                continue;
              }

              if (node.children.length > 8 && node.tagName.toLowerCase() === "div") {
                continue;
              }

              const text = collapse((node as HTMLElement).innerText || node.textContent || "");
              if (!text || text.length < 2) {
                continue;
              }

              if (text.length > 220) {
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

    const screenshot = await page.screenshot({
      type: "jpeg",
      quality: 68,
      fullPage: true,
      animations: "disabled",
    });

    return {
      resolvedUrl: page.url(),
      title: await page.title(),
      screenshotMimeType: "image/jpeg",
      screenshotBase64: screenshot.toString("base64"),
      viewport: {
        width: Math.max(1, Math.round(documentSize.width)),
        height: Math.max(1, Math.round(documentSize.height)),
      },
      items: sanitizeExtractedItems(rawItems),
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown scan error.";
    throw new Error(`Playwright scan failed: ${message}`);
  } finally {
    await context.close();
  }
}
