"use client";

import { useEffect, useRef } from "react";

import { ADSENSE_CLIENT } from "@/lib/adsense";

interface AdsenseSlotProps {
  slot: string;
  minHeight: number;
  label: string;
  format?: "auto" | "fluid";
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdsenseSlot({
  slot,
  minHeight,
  label,
  format = "auto",
  className = "",
}: AdsenseSlotProps) {
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!slot || isInitializedRef.current) {
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      isInitializedRef.current = true;
    } catch (error) {
      console.warn("Adsense slot init skipped:", error);
    }
  }, [slot]);

  if (!slot) {
    return (
      <div
        className={`flex w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 text-center text-xs text-slate-500 ${className}`}
        style={{ minHeight }}
      >
        {label} (Set ad slot env)
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle block overflow-hidden rounded-xl border border-slate-200 bg-white"
        style={{ display: "block", minHeight }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
