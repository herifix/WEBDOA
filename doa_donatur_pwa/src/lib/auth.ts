import { loginApi } from "./api";
import { safeGetJSON, safeRemove, safeSetJSON } from "./storage";

export type Session = {
  token: string;
  userid: string;
  userpt: string;
  loginAt: string;
};

export const SESSION_KEY = "doa.session";
export const DEFAULT_USER_PT = "GKY";

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeSession(value: unknown): Session | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Partial<Session>;
  if (!hasText(candidate.token) || !hasText(candidate.userid) || !hasText(candidate.userpt)) {
    return null;
  }

  return {
    token: candidate.token.trim(),
    userid: candidate.userid.trim(),
    userpt: candidate.userpt.trim(),
    loginAt: hasText(candidate.loginAt) ? candidate.loginAt : ""
  };
}

export async function login(username: string, password: string) {
  const trimmedUser = username.trim();
  if (!trimmedUser || !password) {
    throw new Error("User ID dan password wajib diisi.");
  }

  const token = await loginApi(trimmedUser, password, DEFAULT_USER_PT);
  const session: Session = {
    token,
    userid: trimmedUser,
    userpt: DEFAULT_USER_PT,
    loginAt: new Date().toISOString()
  };

  safeSetJSON(SESSION_KEY, session);
  return session;
}

export function logout() {
  safeRemove(SESSION_KEY);
}

export function getSession() {
  const session = normalizeSession(safeGetJSON<unknown>(SESSION_KEY, null));
  if (!session) {
    safeRemove(SESSION_KEY);
  }

  return session;
}

export function isAuthenticated() {
  return Boolean(getSession()?.token);
}
