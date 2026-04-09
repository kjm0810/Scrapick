export const ADSENSE_CLIENT = "ca-pub-8882307502593292";
export const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

export const ADSENSE_SLOTS = {
  top: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ?? "",
  sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR ?? "",
  bottom: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM ?? "",
} as const;
