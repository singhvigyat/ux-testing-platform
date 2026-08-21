import fs from 'fs';
import path from 'path';
import type { QuotaSnapshot, StartJobResult } from './types';

type UsageRecord = {
  count: number;
  date: string;
  activeJobId: string | null;
};

type UsageFile = {
  users: Record<string, UsageRecord>;
  global: UsageRecord;
};

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'usage.json');
const GLOBAL_KEY = '__global__';

function dailyLimit(): number {
  const parsed = Number(process.env.DAILY_ANALYSIS_LIMIT);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
}

function globalDailyLimit(): number {
  const parsed = Number(process.env.GLOBAL_DAILY_LIMIT);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 40;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function nextResetAt(): string {
  const now = new Date();
  const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return reset.toISOString();
}

function emptyRecord(): UsageRecord {
  return { count: 0, date: todayUtc(), activeJobId: null };
}

function fresh(record: UsageRecord | undefined): UsageRecord {
  const today = todayUtc();
  if (!record || record.date !== today) {
    return emptyRecord();
  }
  return { ...record };
}

let cache: UsageFile = { users: {}, global: emptyRecord() };

function load(): void {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as UsageFile;
    cache = {
      users: parsed.users || {},
      global: fresh(parsed.global),
    };
  } catch {
    cache = { users: {}, global: emptyRecord() };
  }
}

function save(): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch (error) {
    console.warn('[Usage] Could not persist usage file:', (error as Error).message);
  }
}

load();

function quotaFrom(record: UsageRecord, limit: number): QuotaSnapshot {
  return {
    used: record.count,
    limit,
    remaining: Math.max(0, limit - record.count),
    resetAt: nextResetAt(),
  };
}

export function getQuota(userId: string): QuotaSnapshot {
  return quotaFrom(fresh(cache.users[userId]), dailyLimit());
}

export function getLimits(): { dailyLimit: number; globalDailyLimit: number } {
  return { dailyLimit: dailyLimit(), globalDailyLimit: globalDailyLimit() };
}

export function tryStartJob(userId: string, jobId: string): StartJobResult {
  const userLimit = dailyLimit();
  const serverLimit = globalDailyLimit();
  const user = fresh(cache.users[userId]);
  const global = fresh(cache.global);
  const quota = quotaFrom(user, userLimit);

  if (user.activeJobId) {
    return {
      ok: false,
      status: 409,
      code: 'JOB_IN_PROGRESS',
      error: 'You already have a reading in progress. Wait for it to finish.',
      quota,
    };
  }

  if (user.count >= userLimit) {
    return {
      ok: false,
      status: 429,
      code: 'QUOTA_EXCEEDED',
      error: `Daily limit reached (${userLimit} readings). Try again after midnight UTC.`,
      quota,
    };
  }

  if (global.count >= serverLimit) {
    return {
      ok: false,
      status: 429,
      code: 'GLOBAL_QUOTA_EXCEEDED',
      error: 'The shared daily capacity is full. Please try again tomorrow.',
      quota,
    };
  }

  user.count += 1;
  user.activeJobId = jobId;
  global.count += 1;
  cache.users[userId] = user;
  cache.global = global;
  save();

  return { ok: true, quota: quotaFrom(user, userLimit) };
}

export function finishJob(userId: string, jobId: string): void {
  const user = fresh(cache.users[userId]);
  if (user.activeJobId === jobId) {
    user.activeJobId = null;
    cache.users[userId] = user;
    save();
  }
}
