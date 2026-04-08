import { decodeJwt, normalizeRoles } from "./jwt";

export function getCurrentClaims() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  return decodeJwt(token);
}

export function getCurrentUserName() {
  const claims = getCurrentClaims();
  return String(claims?.name ?? localStorage.getItem("userid") ?? "User");
}

export function getCurrentUserLevel() {
  const claims = getCurrentClaims();
  const roles = normalizeRoles(claims);
  return roles[0] ?? "";
}

export function isSuperAdminLevel(level?: string | null) {
  const normalizedLevel = String(level ?? "").trim().toLowerCase();
  return normalizedLevel === "0" || normalizedLevel === "1" || normalizedLevel === "admin";
}

export function isCurrentUserSuperAdmin() {
  return isSuperAdminLevel(getCurrentUserLevel());
}

export function canManageMasterUser() {
  return isCurrentUserSuperAdmin();
}

export function mustChangePassword() {
  const forcedFlag = localStorage.getItem("forceChangePassword");
  if (forcedFlag === "1") return true;
  if (forcedFlag === "0") return false;

  const claims = getCurrentClaims();
  const raw =
    claims?.gantiKunci ??
    claims?.GantiKunci ??
    claims?.mustChangePassword;

  return String(raw ?? "0") === "1" || String(raw ?? "").toLowerCase() === "true";
}
