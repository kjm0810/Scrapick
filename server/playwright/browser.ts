import chromiumBinary from "@sparticuz/chromium";
import { readdir, rm, stat, statfs } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Browser, type LaunchOptions } from "playwright";

let browserPromise: Promise<Browser> | null = null;
const TMP_ROOT = "/tmp";
const TMP_CLEANUP_PREFIXES = [
  "playwright_chromiumdev_profile-",
  "playwright-artifacts-",
  "playwright-",
];
const TMP_CLEANUP_MIN_AGE_MS = 4 * 60 * 1000;
const TMP_CLEANUP_MAX_ENTRIES = 40;
const TMP_MIN_FREE_BYTES = 96 * 1024 * 1024;

function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on") {
    return true;
  }
  if (normalized === "0" || normalized === "false" || normalized === "no" || normalized === "off") {
    return false;
  }

  return defaultValue;
}

function isServerlessRuntime(): boolean {
  return Boolean(
    process.env.VERCEL || process.env.AWS_REGION || process.env.AWS_EXECUTION_ENV,
  );
}

async function getTmpFreeBytes(): Promise<number | null> {
  try {
    const info = await statfs(TMP_ROOT);
    if (!Number.isFinite(info.bavail) || !Number.isFinite(info.bsize)) {
      return null;
    }

    return Math.max(0, info.bavail * info.bsize);
  } catch {
    return null;
  }
}

async function cleanupPlaywrightTempFiles(forceAggressive = false): Promise<void> {
  const cleanupEnabled = parseBooleanEnv(process.env.PLAYWRIGHT_TMP_CLEANUP, true);
  if (!cleanupEnabled) {
    return;
  }

  try {
    const now = Date.now();
    const freeBytes = await getTmpFreeBytes();
    const lowFreeSpace = typeof freeBytes === "number" ? freeBytes < TMP_MIN_FREE_BYTES : false;
    const aggressiveMode =
      forceAggressive ||
      lowFreeSpace ||
      parseBooleanEnv(process.env.PLAYWRIGHT_TMP_CLEANUP_AGGRESSIVE, isServerlessRuntime());
    const minAgeMs = aggressiveMode ? 0 : TMP_CLEANUP_MIN_AGE_MS;
    const entries = await readdir(TMP_ROOT, { withFileTypes: true });
    const candidates: string[] = [];

    for (const entry of entries) {
      const name = entry.name;
      const matchesPrefix = TMP_CLEANUP_PREFIXES.some((prefix) => name.startsWith(prefix));
      if (!matchesPrefix) {
        continue;
      }

      const fullPath = join(TMP_ROOT, name);
      try {
        const itemStat = await stat(fullPath);
        const ageMs = now - itemStat.mtimeMs;
        if (ageMs < minAgeMs) {
          continue;
        }

        candidates.push(fullPath);
      } catch {
        // ignore stat errors for races
      }

      if (candidates.length >= TMP_CLEANUP_MAX_ENTRIES) {
        break;
      }
    }

    await Promise.all(
      candidates.map((fullPath) =>
        rm(fullPath, {
          recursive: true,
          force: true,
        }).catch(() => undefined),
      ),
    );
  } catch {
    // ignore cleanup errors
  }
}

async function launchBrowser(): Promise<Browser> {
  await cleanupPlaywrightTempFiles();

  const lowResourceMode = parseBooleanEnv(process.env.SCAN_LOW_RESOURCE_MODE, isServerlessRuntime());
  const launchOptions: LaunchOptions = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      ...(lowResourceMode
        ? ["--disk-cache-size=1048576", "--media-cache-size=0", "--disable-gpu-shader-disk-cache"]
        : []),
    ],
  };

  if (isServerlessRuntime()) {
    const executablePath = await chromiumBinary.executablePath();
    launchOptions.executablePath = executablePath;
    launchOptions.args = Array.from(
      new Set([...(chromiumBinary.args ?? []), ...(launchOptions.args ?? [])]),
    );
  }

  const browser = await chromium.launch(launchOptions);
  browser.on("disconnected", () => {
    browserPromise = null;
    void cleanupPlaywrightTempFiles(true);
  });

  return browser;
}

export async function resetBrowser(): Promise<void> {
  const activePromise = browserPromise;
  browserPromise = null;

  if (!activePromise) {
    return;
  }

  try {
    const browser = await activePromise;

    if (browser.isConnected()) {
      await browser.close();
    }
  } catch {
    // ignore cleanup errors
  } finally {
    await cleanupPlaywrightTempFiles(true);
  }
}

export async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = launchBrowser();
  }

  try {
    const browser = await browserPromise;

    if (!browser.isConnected()) {
      browserPromise = launchBrowser();
      return await browserPromise;
    }

    return browser;
  } catch (error) {
    browserPromise = null;
    throw error;
  }
}
