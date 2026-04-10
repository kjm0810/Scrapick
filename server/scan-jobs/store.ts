import { Redis } from "@upstash/redis";
import { createClient } from "redis";

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
let redisTcpClientPromise: Promise<ReturnType<typeof createClient>> | null = null;

type BackingStore = "redis-url" | "upstash-rest";

function getRedisUrl(): string | null {
  const value = process.env.REDIS_URL?.trim();
  return value ? value : null;
}

function getUpstashRestUrl(): string | null {
  const value = process.env.UPSTASH_REDIS_REST_URL?.trim();
  return value ? value : null;
}

function getUpstashRestToken(): string | null {
  const value = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  return value ? value : null;
}

function isHttpsUrl(value: string): boolean {
  return /^https:\/\//i.test(value);
}

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

function resolveBackingStore(): BackingStore | null {
  if (getRedisUrl()) {
    return "redis-url";
  }

  const upstashUrl = getUpstashRestUrl();
  const upstashToken = getUpstashRestToken();
  if (upstashUrl && upstashToken && isHttpsUrl(upstashUrl)) {
    return "upstash-rest";
  }

  return null;
}

function requireUpstashRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  const upstashUrl = getUpstashRestUrl();
  const upstashToken = getUpstashRestToken();
  if (!upstashUrl || !upstashToken) {
    throw new Error("Upstash Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.");
  }

  if (!isHttpsUrl(upstashUrl)) {
    throw new Error(
      `Invalid UPSTASH_REDIS_REST_URL. Expected https://... for Upstash REST, received: "${upstashUrl}"`,
    );
  }

  redisClient = Redis.fromEnv();
  return redisClient;
}

async function requireRedisTcpClient(): Promise<ReturnType<typeof createClient>> {
  const redisUrl = getRedisUrl();
  if (!redisUrl) {
    throw new Error("REDIS_URL is not configured.");
  }

  if (!redisTcpClientPromise) {
    const client = createClient({ url: redisUrl });
    client.on("error", () => undefined);
    redisTcpClientPromise = client.connect().then(() => client);
  }

  try {
    return await redisTcpClientPromise;
  } catch (error) {
    redisTcpClientPromise = null;
    throw error;
  }
}

async function setJsonWithTtl(key: string, ttlSeconds: number, value: unknown): Promise<void> {
  const store = resolveBackingStore();

  if (store === "redis-url") {
    const client = await requireRedisTcpClient();
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
    return;
  }

  if (store === "upstash-rest") {
    const client = requireUpstashRedisClient();
    await client.setex(key, ttlSeconds, value);
    return;
  }

  throw new Error(
    "Redis is not configured. Set REDIS_URL, or set UPSTASH_REDIS_REST_URL(https://...) and UPSTASH_REDIS_REST_TOKEN.",
  );
}

async function getJson<T>(key: string): Promise<T | null> {
  const store = resolveBackingStore();

  if (store === "redis-url") {
    const client = await requireRedisTcpClient();
    const raw = await client.get(key);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  if (store === "upstash-rest") {
    const client = requireUpstashRedisClient();
    return await client.get<T>(key);
  }

  throw new Error(
    "Redis is not configured. Set REDIS_URL, or set UPSTASH_REDIS_REST_URL(https://...) and UPSTASH_REDIS_REST_TOKEN.",
  );
}

async function setStringIfNotExistsWithTtl(key: string, value: string, ttlSeconds: number): Promise<boolean> {
  const store = resolveBackingStore();

  if (store === "redis-url") {
    const client = await requireRedisTcpClient();
    const result = await client.set(key, value, { EX: ttlSeconds, NX: true });
    return result === "OK";
  }

  if (store === "upstash-rest") {
    const client = requireUpstashRedisClient();
    const result = await client.set(key, value, {
      ex: ttlSeconds,
      nx: true,
    });
    return result === "OK";
  }

  throw new Error(
    "Redis is not configured. Set REDIS_URL, or set UPSTASH_REDIS_REST_URL(https://...) and UPSTASH_REDIS_REST_TOKEN.",
  );
}

async function deleteKey(key: string): Promise<void> {
  const store = resolveBackingStore();

  if (store === "redis-url") {
    const client = await requireRedisTcpClient();
    await client.del(key);
    return;
  }

  if (store === "upstash-rest") {
    const client = requireUpstashRedisClient();
    await client.del(key);
    return;
  }

  throw new Error(
    "Redis is not configured. Set REDIS_URL, or set UPSTASH_REDIS_REST_URL(https://...) and UPSTASH_REDIS_REST_TOKEN.",
  );
}

async function getString(key: string): Promise<string | null> {
  const store = resolveBackingStore();

  if (store === "redis-url") {
    const client = await requireRedisTcpClient();
    return await client.get(key);
  }

  if (store === "upstash-rest") {
    const client = requireUpstashRedisClient();
    return await client.get<string>(key);
  }

  throw new Error(
    "Redis is not configured. Set REDIS_URL, or set UPSTASH_REDIS_REST_URL(https://...) and UPSTASH_REDIS_REST_TOKEN.",
  );
}

async function persistJob(record: ScanJobRecord): Promise<void> {
  await setJsonWithTtl(getScanJobKey(record.jobId), resolveJobTtlSeconds(), record);
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
  const record = await getJson<ScanJobRecord>(getScanJobKey(jobId));

  if (!record || typeof record !== "object") {
    return null;
  }

  return record;
}

export async function tryAcquireScanWorkerLock(ownerId: string): Promise<boolean> {
  return await setStringIfNotExistsWithTtl(SCAN_WORKER_LOCK_KEY, ownerId, DEFAULT_SCAN_WORKER_LOCK_TTL_SECONDS);
}

export async function releaseScanWorkerLock(ownerId: string): Promise<void> {
  const currentOwner = await getString(SCAN_WORKER_LOCK_KEY);
  if (currentOwner !== ownerId) {
    return;
  }

  await deleteKey(SCAN_WORKER_LOCK_KEY);
}
