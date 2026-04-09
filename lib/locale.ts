export type SiteLocale = "ko" | "en";

const COUNTRY_HEADERS = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "x-country-code",
  "x-geo-country",
] as const;

function normalizeCountry(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  return normalized.length === 2 ? normalized : null;
}

export function detectLocaleFromHeaders(headersList: Headers): SiteLocale {
  for (const key of COUNTRY_HEADERS) {
    const country = normalizeCountry(headersList.get(key));

    if (country === "KR") {
      return "ko";
    }

    if (country) {
      return "en";
    }
  }

  const acceptLanguage = (headersList.get("accept-language") || "").toLowerCase();
  if (acceptLanguage.includes("ko")) {
    return "ko";
  }

  return "en";
}
