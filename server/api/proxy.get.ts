const ABSOLUTE_PROTOCOL_RE = /^[a-zA-Z][a-zA-Z\d+.-]*:/;
const BLOCKED_PROTOCOL_RE = /^(javascript|vbscript):/i;

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

function toAbsoluteUrl(value: string, baseUrl: URL): string {
  const trimmed = value.trim();

  if (
    !trimmed ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return value;
  }

  if (BLOCKED_PROTOCOL_RE.test(trimmed)) {
    return "";
  }

  if (trimmed.startsWith("//")) {
    return `${baseUrl.protocol}${trimmed}`;
  }

  if (ABSOLUTE_PROTOCOL_RE.test(trimmed)) {
    return trimmed;
  }

  try {
    return new URL(trimmed, baseUrl).href;
  } catch {
    return value;
  }
}

function rewriteResourceAttributes(html: string, baseUrl: URL): string {
  const attrs = ["src", "href", "action", "poster"];
  const attrPattern = new RegExp(
    `\\b(${attrs.join("|")})=(["'])([^"']*)\\2`,
    "gi",
  );

  return html.replace(attrPattern, (_match, attrName: string, quote: string, attrValue: string) => {
    const absolute = toAbsoluteUrl(attrValue, baseUrl);
    return `${attrName}=${quote}${absolute}${quote}`;
  });
}

function rewriteSrcSet(html: string, baseUrl: URL): string {
  return html.replace(/\bsrcset=(['"])([^'"]*)\1/gi, (_match, quote: string, srcsetValue: string) => {
    const rewritten = srcsetValue
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [candidate, descriptor] = entry.split(/\s+/, 2);
        const absolute = toAbsoluteUrl(candidate, baseUrl);
        return descriptor ? `${absolute} ${descriptor}` : absolute;
      })
      .join(", ");

    return `srcset=${quote}${rewritten}${quote}`;
  });
}

function stripScriptsAndInlineEvents(html: string): string {
  const withoutScripts = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );

  return withoutScripts.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

function injectBaseTag(html: string, baseUrl: URL): string {
  const baseHref = new URL(".", baseUrl).href;

  if (/\<base\s/i.test(html)) {
    return html;
  }

  if (/\<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1><base href="${baseHref}">`);
  }

  return `<head><base href="${baseHref}"></head>${html}`;
}

function rewriteHtml(html: string, baseUrl: URL): string {
  const noScriptHtml = stripScriptsAndInlineEvents(html);
  const withAbsAttrs = rewriteResourceAttributes(noScriptHtml, baseUrl);
  const withAbsSrcSet = rewriteSrcSet(withAbsAttrs, baseUrl);
  return injectBaseTag(withAbsSrcSet, baseUrl);
}

export interface ProxiedHtmlPayload {
  html: string;
  resolvedUrl: string;
}

export async function fetchAndRewriteHtml(rawUrl: string): Promise<ProxiedHtmlPayload> {
  const parsedUrl = ensureHttpUrl(rawUrl);

  const response = await fetch(parsedUrl, {
    redirect: "follow",
    headers: {
      "user-agent": "scrapicker-bot/1.0 (+visual-scraper)",
      accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Target request failed with status ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    throw new Error("The target URL did not return an HTML document.");
  }

  const html = await response.text();
  const finalUrl = new URL(response.url || parsedUrl.href);

  return {
    html: rewriteHtml(html, finalUrl),
    resolvedUrl: finalUrl.href,
  };
}
