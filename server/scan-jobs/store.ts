import { Redis } from "@upstash/redis";

import type { ScanMode, ScanResponse } from "@/types/scraper";

const DEFAULT_SCAN_JOB_TTL_SECONDS = 1800;
const DEFAULT_SCAN_WORKER_LOCK_TTL_SECONDS = 180;
const SCAN_JOB_KEY_PREFIX = "scan-job:v1:";
const SCAN_WORKER_LOCK_KEY = "scan-job:worker-lock:v1";

export interface ScanJobRecord {
  jobId: string;
  mode: ScanMode;
  url: string;
  createdAt: string;
  updatedAt: string;
  status: "queued" | "processing" | "succeeded" | "failed";
  error?: string;
  result?: ScanResponse;
}

let redisClient: Redis | null = null;

function resolveJobTtlSeconds(): number {
  const rawValue = Number.parseInt(process.env.SCAN_JOB_TTL_SECONDS ?? "", 10);
  if (!Number.isFinite(rawValue) || rawValue < 60) {
    return DEFAULT_SCAN_JOB_TTL_SECONDS;
  }

  return rawValue;
}

function getScanJobKey(jobId: string): string {
  return `${SCAN_JOB_KEY_PREFIX}${jobId}`;
}

function requireRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Upstash Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.");
  }

  redisClient = Redis.fromEnv();
  return redisClient;
}

async function persistJob(record: ScanJobRecord): Promise<void> {
  const redis = requireRedisClient();
  await redis.setex(getScanJobKey(record.jobId), resolveJobTtlSeconds(), record);
}

async function updateJob(
  jobId: string,
  updater: (current: ScanJobRecord) => ScanJobRecord,
): Promise<ScanJobRecord | null> {
  const current = await getScanJob(jobId);
  if (!current) {
    return null;
  }

  const nextRecord = updater(current);
  await persistJob(nextRecord);
  return nextRecord;
}

export async function createQueuedScanJob(input: {
  jobId: string;
  mode: ScanMode;
  url: string;
  queuedAt: string;
}): Promise<void> {
  await persistJob({
    jobId: input.jobId,
    mode: input.mode,
    url: input.url,
    createdAt: input.queuedAt,
    updatedAt: input.queuedAt,
    status: "queued",
  });
}

export async function markScanJobProcessing(jobId: string): Promise<void> {
  await updateJob(jobId, (current) => ({
    ...current,
    status: "processing",
    updatedAt: new Date().toISOString(),
    error: undefined,
  }));
}

export async function markScanJobSucceeded(jobId: string, result: ScanResponse): Promise<void> {
  await updateJob(jobId, (current) => ({
    ...current,
    status: "succeeded",
    updatedAt: new Date().toISOString(),
    error: undefined,
    result,
  }));
}

export async function markScanJobFailed(jobId: string, error: string): Promise<void> {
  await updateJob(jobId, (current) => ({
    ...current,
    status: "failed",
    updatedAt: new Date().toISOString(),
    error,
  }));
}

export async function getScanJob(jobId: string): Promise<ScanJobRecord | null> {
  const redis = requireRedisClient();
  const record = await redis.get<ScanJobRecord>(getScanJobKey(jobId));

  if (!record || typeof record !== "object") {
    return null;
  }

  return record;
}

export async function tryAcquireScanWorkerLock(ownerId: string): Promise<boolean> {
  const redis = requireRedisClient();
  const result = await redis.set(SCAN_WORKER_LOCK_KEY, ownerId, {
    ex: DEFAULT_SCAN_WORKER_LOCK_TTL_SECONDS,
    nx: true,
  });

  return result === "OK";
}

export async function releaseScanWorkerLock(ownerId: string): Promise<void> {
  const redis = requireRedisClient();
  const currentOwner = await redis.get<string>(SCAN_WORKER_LOCK_KEY);
  if (currentOwner !== ownerId) {
    return;
  }

  await redis.del(SCAN_WORKER_LOCK_KEY);
}
