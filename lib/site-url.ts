function toAbsoluteUrl(value: string | undefined): URL | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function getSiteUrl(): URL | null {
  const fromPublic = toAbsoluteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (fromPublic) {
    return fromPublic;
  }

  const fromVercel = process.env.VERCEL_URL
    ? toAbsoluteUrl(`https://${process.env.VERCEL_URL}`)
    : null;

  return fromVercel;
}
