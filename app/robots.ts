import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    host: siteUrl?.origin,
    sitemap: siteUrl ? `${siteUrl.origin}/sitemap.xml` : undefined,
  };
}
