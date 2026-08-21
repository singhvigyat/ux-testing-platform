export type AuthUser = {
  id: string;
  email: string;
  name: string;
  picture: string;
};

export type QuotaSnapshot = {
  used: number;
  limit: number;
  remaining: number;
  resetAt: string;
};

export type StartJobResult =
  | { ok: true; quota: QuotaSnapshot }
  | { ok: false; status: number; error: string; code: string; quota?: QuotaSnapshot };
