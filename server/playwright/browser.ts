import chromiumBinary from "@sparticuz/chromium";
import { chromium, type Browser, type LaunchOptions } from "playwright";

let browserPromise: Promise<Browser> | null = null;

function isServerlessRuntime(): boolean {
  return Boolean(
    process.env.VERCEL || process.env.AWS_REGION || process.env.AWS_EXECUTION_ENV,
  );
}

export async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
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

    browserPromise = chromium.launch(launchOptions);
  }

  return browserPromise;
}
