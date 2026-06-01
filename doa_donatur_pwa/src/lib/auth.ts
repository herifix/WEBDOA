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
  return safeGetJSON<Session | null>(SESSION_KEY, null);
}

export function isAuthenticated() {
  return Boolean(getSession()?.token);
}
