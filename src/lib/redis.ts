import { Redis } from "@upstash/redis";

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface JobData {
  status: JobStatus;
  userId?: string;
  photoKey?: string;
  progress?: string | null;
  resultUrl?: string | null;
  error?: string | null;
  createdAt?: string;
  completedAt?: string | null;
  duration_s?: number | null;
}

// Global in-memory mock for dev/build without Upstash config
const mockDb = new Map<string, JobData>();

let redis: Redis | null = null;
try {
  // If env vars are present, use real Redis, otherwise use memory map.
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = Redis.fromEnv();
  }
} catch {
  console.warn("Upstash Redis not configured. Using in-memory mock.");
}

export async function createJob(jobId: string, data: Partial<JobData>) {
  const job: JobData = { status: "queued", ...data, createdAt: new Date().toISOString() };
  if (redis) {
    await redis.set(`job:${jobId}`, job, { ex: 3600 });
  } else {
    mockDb.set(jobId, job);
  }
}

export async function updateJob(jobId: string, data: Partial<JobData>) {
  if (redis) {
    const existing = await getJob(jobId) || { status: "processing" as JobStatus };
    const updated = { ...existing, ...data } as JobData;
    await redis.set(`job:${jobId}`, updated, { ex: 3600 });
  } else {
    const existing = mockDb.get(jobId) || { status: "processing" as JobStatus, createdAt: new Date().toISOString() };
    mockDb.set(jobId, { ...existing, ...data } as JobData);
  }
}

export async function getJob(jobId: string): Promise<JobData | null> {
  if (redis) {
    return await redis.get<JobData>(`job:${jobId}`);
  }
  return mockDb.get(jobId) || null;
}
