"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader, { type SiteHeaderNavItem } from "@/components/SiteHeader";
import { useScraperState, type ScraperStatus } from "@/hooks/useScraperState";
import type { SiteLocale } from "@/lib/locale";
import type {
  ExtractedItem,
  ItemCategory,
  ScanEnqueueResponse,
  ScanJobStatusResponse,
  ScanMode,
  ScanResponse,
} from "@/types/scraper";

interface ScrapickerClientProps {
  locale: SiteLocale;
}

const DEFAULT_URL = "https://books.toscrape.com/";
const CATEGORY_ORDER: ItemCategory[] = ["image", "price", "text"];
const SCAN_POLL_INTERVAL_MS = 850;
const SCAN_POLL_TIMEOUT_MS = 180000;

const CATEGORY_LABELS: Record<SiteLocale, Record<ItemCategory, string>> = {
  ko: {
    image: "이미지",
    price: "가격/숫자",
    text: "일반 텍스트",
  },
  en: {
    image: "Images",
    price: "Price/Numbers",
    text: "Text",
  },
};

const STATUS_LABELS: Record<SiteLocale, Record<ScraperStatus, string>> = {
  ko: {
    IDLE: "준비됨",
    LOADING: "페이지 불러오는 중",
    VIEWING: "뷰어 표시 중",
    SCANNING: "AI 분석 중",
    RESULT: "결과 준비됨",
  },
  en: {
    IDLE: "Ready",
    LOADING: "Loading page",
    VIEWING: "Previewing",
    SCANNING: "Scanning with AI",
    RESULT: "Results ready",
  },
};

const UI_TEXT = {
  ko: {
    title: "scrapicker",
    headerTagline: "AI Visual Web Scraper",
    headerSupport: "Playwright 기반 전체 페이지 캡처 + AI 요소 추출",
    navApp: "앱",
    navLanding: "랜딩",
    navGuide: "가이드",
    navFaq: "FAQ",
    navResources: "리소스",
    navAbout: "소개",
    subtitle: "대형 사이트 대응을 위해 서버 브라우저(Playwright)로 페이지를 렌더링해 분석합니다.",
    status: "상태",
    inputPlaceholder: "https://example.com",
    loadButton: "페이지 불러오기",
    scanButton: "AI 추출",
    resetButton: "초기화",
    renderer: "렌더러",
    rendererValue: "Playwright",
    visibleItems: (visible: number, total: number, numberLocale: string) =>
      `표시 항목: ${visible.toLocaleString(numberLocale)} / 전체 ${total.toLocaleString(numberLocale)}개`,
    loadedUrl: "로드된 URL",
    viewportY: (top: number, bottom: number, numberLocale: string) =>
      `현재 화면 Y: ${top.toLocaleString(numberLocale)}-${bottom.toLocaleString(numberLocale)}`,
    privacy: "개인정보 안내: 추출 데이터는 브라우저에서만 보관되고 서버 DB에 저장하지 않습니다.",
    adPolicy: "서비스 운영을 위해 Google AdSense 광고가 포함됩니다.",
    viewerTitle: "서버 렌더 뷰어",
    viewerSubtitle: "스크린샷 + bbox 오버레이",
    viewerEmpty: "URL을 입력하고 페이지를 불러오면 서버 렌더 결과가 표시됩니다.",
    scanProgress: (current: number, total: number, numberLocale: string) =>
      `AI 스캔 중 ${current.toLocaleString(numberLocale)}/${total.toLocaleString(numberLocale)}`,
    scanPreparing: "서버 렌더링 및 분석 준비 중",
    fullCaptureNote: "문서 전체 길이 캡처 기준이며, 우측 리스트/박스는 현재 스크롤 화면에 맞춰 유동적으로 변합니다.",
    listTitle: "추출 요소 리스트",
    listSubtitle: "현재 화면 기준으로 자동 필터링됩니다.",
    noItems: "추출된 항목이 없습니다.",
    previewTitle: "데이터 미리보기",
    downloadJson: "JSON 다운로드",
    downloadCsv: "CSV 다운로드",
    tableCategory: "카테고리",
    tableValue: "값",
    tableConfidence: "신뢰도",
    tableCoords: "좌표",
    tableEmpty: "아직 추출된 데이터가 없습니다.",
    errorInputUrl: "분석할 URL을 입력해 주세요.",
    errorPreview: "미리보기를 불러오지 못했습니다.",
    errorScan: "스캔 중 오류가 발생했습니다.",
    errorRequest: "서버 렌더링 요청에 실패했습니다.",
    csvFileName: "scrapicker-results.csv",
    jsonFileName: "scrapicker-results.json",
  },
  en: {
    title: "scrapicker",
    headerTagline: "AI Visual Web Scraper",
    headerSupport: "Playwright full-page capture + AI element extraction",
    navApp: "App",
    navLanding: "Landing",
    navGuide: "Guide",
    navFaq: "FAQ",
    navResources: "Resources",
    navAbout: "About",
    subtitle: "Renders target pages with a server-side browser (Playwright) to support large websites.",
    status: "Status",
    inputPlaceholder: "https://example.com",
    loadButton: "Load Page",
    scanButton: "Extract with AI",
    resetButton: "Reset",
    renderer: "Renderer",
    rendererValue: "Playwright",
    visibleItems: (visible: number, total: number, numberLocale: string) =>
      `Visible items: ${visible.toLocaleString(numberLocale)} / Total ${total.toLocaleString(numberLocale)}`,
    loadedUrl: "Loaded URL",
    viewportY: (top: number, bottom: number, numberLocale: string) =>
      `Viewport Y: ${top.toLocaleString(numberLocale)}-${bottom.toLocaleString(numberLocale)}`,
    privacy: "Privacy: extracted data is handled in the browser only and is not stored in a server database.",
    adPolicy: "Google AdSense ads are included to support this service.",
    viewerTitle: "Server Render Viewer",
    viewerSubtitle: "Screenshot + bbox overlay",
    viewerEmpty: "Load a URL to display the server-rendered result here.",
    scanProgress: (current: number, total: number, numberLocale: string) =>
      `AI scanning ${current.toLocaleString(numberLocale)}/${total.toLocaleString(numberLocale)}`,
    scanPreparing: "Preparing server render and analysis",
    fullCaptureNote:
      "Captured from full document height. Right panel items and red boxes update dynamically by current scroll viewport.",
    listTitle: "Extracted Elements",
    listSubtitle: "Automatically filtered by the current visible viewport.",
    noItems: "No extracted items.",
    previewTitle: "Data Preview",
    downloadJson: "Download JSON",
    downloadCsv: "Download CSV",
    tableCategory: "Category",
    tableValue: "Value",
    tableConfidence: "Confidence",
    tableCoords: "Coordinates",
    tableEmpty: "No extracted data yet.",
    errorInputUrl: "Please enter a URL to analyze.",
    errorPreview: "Failed to load preview.",
    errorScan: "An error occurred while scanning.",
    errorRequest: "Failed to request server rendering.",
    csvFileName: "scrapicker-results.csv",
    jsonFileName: "scrapicker-results.json",
  },
} as const;

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }

  if (/^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function escapeCsvValue(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function toCsv(items: ExtractedItem[]): string {
  const header = [
    "category",
    "value",
    "sourceTag",
    "selector",
    "confidence",
    "x",
    "y",
    "width",
    "height",
  ];

  const rows = items.map((item) => [
    item.category,
    item.value,
    item.sourceTag,
    item.selector,
    item.confidence.toFixed(4),
    String(Math.round(item.bbox.x)),
    String(Math.round(item.bbox.y)),
    String(Math.round(item.bbox.width)),
    String(Math.round(item.bbox.height)),
  ]);

  return [header, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");
}

function triggerDownload(content: string, mimeType: string, fileName: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(url);
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function waitForPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function isScanResponsePayload(payload: unknown): payload is ScanResponse {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  return (
    typeof (payload as ScanResponse).screenshotBase64 === "string" &&
    typeof (payload as ScanResponse).screenshotMimeType === "string" &&
    Boolean((payload as ScanResponse).viewport)
  );
}

function isScanEnqueuePayload(payload: unknown): payload is ScanEnqueueResponse {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const queuePayload = payload as ScanEnqueueResponse;
  return typeof queuePayload.jobId === "string" && queuePayload.status === "queued";
}

function isScanJobStatusPayload(payload: unknown): payload is ScanJobStatusResponse {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  return typeof (payload as ScanJobStatusResponse).jobId === "string" && typeof (payload as ScanJobStatusResponse).status === "string";
}

async function waitForQueuedScanResult(jobId: string, fallbackMessage: string): Promise<ScanResponse> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < SCAN_POLL_TIMEOUT_MS) {
    const response = await fetch(`/api/scan/${encodeURIComponent(jobId)}`, {
      method: "GET",
      cache: "no-store",
    });
    const payload = (await response.json()) as ScanJobStatusResponse & { error?: string };

    if (!response.ok) {
      throw new Error(payload.error || fallbackMessage);
    }

    if (!isScanJobStatusPayload(payload)) {
      throw new Error("Invalid queue status payload.");
    }

    if (payload.status === "succeeded" && payload.result) {
      return payload.result;
    }

    if (payload.status === "failed") {
      throw new Error(payload.error || fallbackMessage);
    }

    await sleep(SCAN_POLL_INTERVAL_MS);
  }

  throw new Error(`${fallbackMessage} (queue timeout)`);
}

async function requestScan(url: string, mode: ScanMode, fallbackMessage: string): Promise<ScanResponse> {
  const response = await fetch("/api/scan", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      url,
      mode,
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as ScanResponse | ScanEnqueueResponse | { error?: string };

  if (!response.ok) {
    throw new Error((payload as { error?: string }).error || fallbackMessage);
  }

  if (isScanResponsePayload(payload)) {
    return payload;
  }

  if (isScanEnqueuePayload(payload)) {
    return await waitForQueuedScanResult(payload.jobId, fallbackMessage);
  }

  throw new Error("Unexpected scan response.");
}

export default function ScrapickerClient({ locale }: ScrapickerClientProps) {
  const t = UI_TEXT[locale];
  const categoryLabels = CATEGORY_LABELS[locale];
  const numberLocale = locale === "ko" ? "ko-KR" : "en-US";

  const {
    status,
    canLoad,
    isBusy,
    setIdle,
    setLoading,
    setViewing,
    setScanning,
    setResult,
  } = useScraperState("IDLE");

  const viewerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [urlInput, setUrlInput] = useState(DEFAULT_URL);
  const [snapshot, setSnapshot] = useState<ScanResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [viewerWidth, setViewerWidth] = useState(0);
  const [visibleRange, setVisibleRange] = useState<{ top: number; bottom: number } | null>(null);

  useEffect(() => {
    const node = viewerRef.current;
    if (!node) {
      return;
    }

    const update = () => setViewerWidth(node.clientWidth);
    update();

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setViewerWidth(entry.contentRect.width);
      }
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const resetResults = useCallback(() => {
    setExtractedItems([]);
    setScanProgress({ current: 0, total: 0 });
  }, []);

  const handleLoadPreview = useCallback(async () => {
    if (!canLoad) {
      return;
    }

    const targetUrl = normalizeUrl(urlInput);
    if (!targetUrl) {
      setErrorMessage(t.errorInputUrl);
      return;
    }

    setErrorMessage("");
    resetResults();
    setLoading();

    try {
      const payload = await requestScan(targetUrl, "preview", t.errorRequest);
      setSnapshot(payload);
      setViewing();
    } catch (error) {
      const message = error instanceof Error ? error.message : t.errorPreview;
      setErrorMessage(message);
      setIdle();
    }
  }, [canLoad, resetResults, setIdle, setLoading, setViewing, t.errorInputUrl, t.errorRequest, t.errorPreview, urlInput]);

  const animateScanResult = useCallback(async (items: ExtractedItem[]) => {
    setExtractedItems([]);
    setScanProgress({ current: 0, total: items.length });

    const staged: ExtractedItem[] = [];

    for (let index = 0; index < items.length; index += 1) {
      staged.push(items[index]);
      setExtractedItems([...staged]);
      setScanProgress({ current: index + 1, total: items.length });
      await waitForPaint();
      await sleep(12);
    }
  }, []);

  const handleScan = useCallback(async () => {
    if (isBusy) {
      return;
    }

    const targetUrl = normalizeUrl(urlInput);
    if (!targetUrl) {
      setErrorMessage(t.errorInputUrl);
      return;
    }

    setErrorMessage("");
    resetResults();

    try {
      setScanning();
      const payload = await requestScan(targetUrl, "scan", t.errorRequest);

      setSnapshot(payload);
      await animateScanResult(payload.items);
      setResult();
    } catch (error) {
      const message = error instanceof Error ? error.message : t.errorScan;
      setErrorMessage(message);

      if (snapshot) {
        setViewing();
      } else {
        setIdle();
      }
    }
  }, [
    animateScanResult,
    isBusy,
    resetResults,
    setIdle,
    setResult,
    setScanning,
    setViewing,
    snapshot,
    t.errorInputUrl,
    t.errorRequest,
    t.errorScan,
    urlInput,
  ]);

  const handleReset = useCallback(() => {
    setErrorMessage("");
    resetResults();

    if (snapshot) {
      setViewing();
      return;
    }

    setIdle();
  }, [resetResults, setIdle, setViewing, snapshot]);

  const handleDownloadCsv = useCallback(() => {
    triggerDownload(toCsv(extractedItems), "text/csv;charset=utf-8", t.csvFileName);
  }, [extractedItems, t.csvFileName]);

  const handleDownloadJson = useCallback(() => {
    triggerDownload(
      JSON.stringify(extractedItems, null, 2),
      "application/json;charset=utf-8",
      t.jsonFileName,
    );
  }, [extractedItems, t.jsonFileName]);

  const scale =
    snapshot?.viewport.width && viewerWidth
      ? Math.min(1, viewerWidth / snapshot.viewport.width)
      : 1;

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    const updateVisibleRange = () => {
      const viewer = viewerRef.current;
      const stage = stageRef.current;
      if (!viewer || !stage || !snapshot) {
        return;
      }

      const viewerRect = viewer.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();

      const visibleTopPx = Math.max(0, viewerRect.top - stageRect.top);
      const visibleBottomPx = Math.min(stageRect.height, viewerRect.bottom - stageRect.top);

      if (visibleBottomPx <= 0 || visibleTopPx >= stageRect.height) {
        setVisibleRange({ top: 0, bottom: 0 });
        return;
      }

      const top = Math.max(0, Math.floor(visibleTopPx / scale));
      const bottom = Math.min(snapshot.viewport.height, Math.ceil(visibleBottomPx / scale));

      setVisibleRange({ top, bottom });
    };

    const viewer = viewerRef.current;
    const stage = stageRef.current;

    updateVisibleRange();

    if (!viewer || !stage) {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateVisibleRange();
    });

    observer.observe(viewer);
    observer.observe(stage);
    viewer.addEventListener("scroll", updateVisibleRange, { passive: true });
    window.addEventListener("resize", updateVisibleRange);

    return () => {
      observer.disconnect();
      viewer.removeEventListener("scroll", updateVisibleRange);
      window.removeEventListener("resize", updateVisibleRange);
    };
  }, [scale, snapshot]);

  const visibleItems = useMemo(() => {
    if (!visibleRange) {
      return extractedItems;
    }

    return extractedItems.filter((item) => {
      const itemTop = item.bbox.y;
      const itemBottom = item.bbox.y + item.bbox.height;

      return itemBottom >= visibleRange.top && itemTop <= visibleRange.bottom;
    });
  }, [extractedItems, visibleRange]);

  const groupedItems = useMemo(() => {
    const grouped: Record<ItemCategory, ExtractedItem[]> = {
      image: [],
      price: [],
      text: [],
    };

    for (const item of visibleItems) {
      grouped[item.category].push(item);
    }

    return grouped;
  }, [visibleItems]);

  const renderWidth = snapshot ? Math.max(1, Math.round(snapshot.viewport.width * scale)) : 0;
  const renderHeight = snapshot ? Math.max(1, Math.round(snapshot.viewport.height * scale)) : 0;
  const loadDisabled = !canLoad || !urlInput.trim();
  const scanDisabled = isBusy || !urlInput.trim();
  const isScanning = status === "SCANNING";
  const navItems: SiteHeaderNavItem[] = [
    { key: "app", href: "/", label: t.navApp, isActive: true },
    { key: "landing", href: "/landing", label: t.navLanding, isActive: false },
    { key: "guide", href: "/guide", label: t.navGuide, isActive: false },
    { key: "faq", href: "/faq", label: t.navFaq, isActive: false },
    { key: "resources", href: "/resources", label: t.navResources, isActive: false },
    { key: "about", href: "/about", label: t.navAbout, isActive: false },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#d8f2ea_0%,_#f8fafc_50%,_#eff6ff_100%)] text-slate-900">
      <SiteHeader
        badge={t.headerTagline}
        brandTitle={t.title}
        logoAlt={`${t.title} logo`}
        supportText={t.headerSupport}
        navItems={navItems}
        rightContent={
          <span className="inline-flex w-fit rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-medium text-teal-700">
            {t.rendererValue}
          </span>
        }
      />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 sm:p-6">
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur sm:p-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-slate-600">{t.subtitle}</p>
              </div>
              <div className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                {t.status}: {STATUS_LABELS[locale][status]}
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row">
              <input
                className="h-11 w-full flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none ring-teal-500 transition focus:ring-2"
                type="url"
                value={urlInput}
                onChange={(event) => setUrlInput(event.target.value)}
                placeholder={t.inputPlaceholder}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !loadDisabled) {
                    void handleLoadPreview();
                  }
                }}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  className="h-11 rounded-xl bg-teal-600 px-4 text-sm font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  onClick={() => {
                    void handleLoadPreview();
                  }}
                  disabled={loadDisabled}
                  type="button"
                >
                  {t.loadButton}
                </button>
                <button
                  className="h-11 rounded-xl bg-rose-600 px-4 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  onClick={() => {
                    void handleScan();
                  }}
                  disabled={scanDisabled}
                  type="button"
                >
                  {t.scanButton}
                </button>
                <button
                  className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  onClick={handleReset}
                  type="button"
                >
                  {t.resetButton}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="rounded-full bg-slate-100 px-2 py-1">
                {t.renderer}: {t.rendererValue}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1">
                {t.visibleItems(visibleItems.length, extractedItems.length, numberLocale)}
              </span>
              {snapshot?.resolvedUrl ? (
                <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                  <span className="shrink-0">{t.loadedUrl}:</span>
                  <span className="max-w-[min(70vw,360px)] truncate" title={snapshot.resolvedUrl}>
                    {snapshot.resolvedUrl}
                  </span>
                </span>
              ) : null}
              {snapshot && visibleRange ? (
                <span className="rounded-full bg-slate-100 px-2 py-1">
                  {t.viewportY(visibleRange.top, visibleRange.bottom, numberLocale)}
                </span>
              ) : null}
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">{t.privacy}</span>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">{t.adPolicy}</span>
            </div>

            {errorMessage ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {errorMessage}
              </p>
            ) : null}
          </div>
        </section>

        <section className="flex min-h-[420px] flex-1 flex-col gap-4 lg:flex-row">
          <div className="relative flex min-h-[340px] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-700">{t.viewerTitle}</h2>
              <span className="text-xs text-slate-500">{t.viewerSubtitle}</span>
            </div>

            <div ref={viewerRef} className="relative flex-1 overflow-auto bg-slate-100">
              {snapshot ? (
                <div className="mx-auto w-max p-3">
                  <div
                    ref={stageRef}
                    className="relative overflow-hidden rounded-lg border border-slate-300 bg-white shadow"
                    style={{
                      width: `${renderWidth}px`,
                      height: `${renderHeight}px`,
                    }}
                  >
                    <Image
                      src={`data:${snapshot.screenshotMimeType};base64,${snapshot.screenshotBase64}`}
                      alt={snapshot.title || "scanned page"}
                      width={renderWidth}
                      height={renderHeight}
                      unoptimized
                      className="h-full w-full object-fill"
                    />

                    <div className="pointer-events-none absolute inset-0">
                      {isScanning ? (
                        <div className="absolute inset-0 bg-slate-950/35">
                          <div className="absolute left-3 top-3 rounded-lg bg-black/70 px-3 py-1 text-xs font-medium text-white">
                            {scanProgress.total > 0
                              ? t.scanProgress(scanProgress.current, scanProgress.total, numberLocale)
                              : t.scanPreparing}
                          </div>
                        </div>
                      ) : null}

                      {visibleItems.map((item) => (
                        <div
                          key={`box-${item.id}`}
                          className="scan-box absolute rounded-sm border-2 border-rose-500"
                          style={{
                            left: `${item.bbox.x * scale}px`,
                            top: `${item.bbox.y * scale}px`,
                            width: `${item.bbox.width * scale}px`,
                            height: `${item.bbox.height * scale}px`,
                          }}
                        >
                          <span className="absolute -top-6 left-0 rounded bg-rose-600 px-1 py-[2px] text-[10px] font-medium text-white">
                            {categoryLabels[item.category]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {isScanning ? null : <p className="pt-2 text-center text-[11px] text-slate-500">{t.fullCaptureNote}</p>}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-500">
                  {t.viewerEmpty}
                </div>
              )}
            </div>
          </div>

          <aside className="flex min-h-[340px] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg lg:max-w-[420px]">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-700">{t.listTitle}</h2>
              <p className="mt-1 text-[11px] text-slate-500">{t.listSubtitle}</p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-3">
              {CATEGORY_ORDER.map((category) => (
                <div key={category} className="rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                    <span>{categoryLabels[category]}</span>
                    <span>{groupedItems[category].length.toLocaleString(numberLocale)}</span>
                  </div>
                  <ul className="max-h-44 space-y-2 overflow-y-auto p-2">
                    {groupedItems[category].length === 0 ? (
                      <li className="rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-500">{t.noItems}</li>
                    ) : (
                      groupedItems[category].map((item) => (
                        <li key={item.id} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                          <p className="line-clamp-2 break-all">{item.value}</p>
                          <p className="mt-1 text-[10px] text-slate-500">{item.selector}</p>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              ))}
            </div>

          </aside>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg sm:p-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-700">{t.previewTitle}</h2>
              <div className="flex gap-2">
                <button
                  className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  onClick={handleDownloadJson}
                  disabled={extractedItems.length === 0}
                  type="button"
                >
                  {t.downloadJson}
                </button>
                <button
                  className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  onClick={handleDownloadCsv}
                  disabled={extractedItems.length === 0}
                  type="button"
                >
                  {t.downloadCsv}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full table-auto text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">{t.tableCategory}</th>
                    <th className="px-3 py-2">{t.tableValue}</th>
                    <th className="px-3 py-2">{t.tableConfidence}</th>
                    <th className="px-3 py-2">{t.tableCoords}</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedItems.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3 text-slate-500" colSpan={4}>
                        {t.tableEmpty}
                      </td>
                    </tr>
                  ) : (
                    extractedItems.slice(0, 20).map((item) => (
                      <tr key={`preview-${item.id}`} className="border-t border-slate-100">
                        <td className="px-3 py-2">{categoryLabels[item.category]}</td>
                        <td className="max-w-[360px] px-3 py-2">
                          <p className="line-clamp-2 break-all">{item.value}</p>
                        </td>
                        <td className="px-3 py-2">{(item.confidence * 100).toFixed(1)}%</td>
                        <td className="px-3 py-2 text-[10px] text-slate-500">
                          {Math.round(item.bbox.x).toLocaleString(numberLocale)},{Math.round(item.bbox.y).toLocaleString(numberLocale)} /{" "}
                          {Math.round(item.bbox.width).toLocaleString(numberLocale)}x
                          {Math.round(item.bbox.height).toLocaleString(numberLocale)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
