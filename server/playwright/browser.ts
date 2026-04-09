import chromiumBinary from "@sparticuz/chromium";
import { chromium, type Browser, type LaunchOptions } from "playwright";

let browserPromise: Promise<Browser> | null = null;

function isServerlessRuntime(): boolean {
  return Boolean(
    process.env.VERCEL || process.env.AWS_REGION || process.env.AWS_EXECUTION_ENV,
  );
}

async function launchBrowser(): Promise<Browser> {
  const launchOptions: LaunchOptions = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
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
