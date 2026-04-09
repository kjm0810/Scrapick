"use client";

import { useCallback, useMemo, useState } from "react";

export type ScraperStatus =
  | "IDLE"
  | "LOADING"
  | "VIEWING"
  | "SCANNING"
  | "RESULT";

export function useScraperState(initialStatus: ScraperStatus = "IDLE") {
  const [status, setStatus] = useState<ScraperStatus>(initialStatus);

  const setIdle = useCallback(() => setStatus("IDLE"), []);
  const setLoading = useCallback(() => setStatus("LOADING"), []);
  const setViewing = useCallback(() => setStatus("VIEWING"), []);
  const setScanning = useCallback(() => setStatus("SCANNING"), []);
  const setResult = useCallback(() => setStatus("RESULT"), []);

  const canLoad = status !== "LOADING" && status !== "SCANNING";
  const canScan = status === "VIEWING" || status === "RESULT";
  const isBusy = status === "LOADING" || status === "SCANNING";

  const label = useMemo(() => {
    switch (status) {
      case "IDLE":
        return "준비됨";
      case "LOADING":
        return "페이지 불러오는 중";
      case "VIEWING":
        return "뷰어 표시 중";
      case "SCANNING":
        return "AI 분석 중";
      case "RESULT":
        return "결과 준비됨";
      default:
        return status;
    }
  }, [status]);

  return {
    status,
    setStatus,
    setIdle,
    setLoading,
    setViewing,
    setScanning,
    setResult,
    canLoad,
    canScan,
    isBusy,
    label,
  };
}
