import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  if (!siteUrl) {
    return [];
  }

  return [
    {
      url: `${siteUrl.origin}/`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl.origin}/landing`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl.origin}/guide`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl.origin}/faq`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
