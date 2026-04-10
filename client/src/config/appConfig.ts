const rawMode = String(import.meta.env.MODE ?? "development").toLowerCase();

export const APP_CONFIG = {
  mode: rawMode,
  isDevelopment: rawMode === "development",
  isProduction: rawMode === "production",
  apiBaseUrl: String(import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, ""),
  apiProxyTarget: String(import.meta.env.VITE_API_PROXY_TARGET ?? "").replace(/\/+$/, ""),
};

export function buildApiUrl(pathValue?: string | null) {
  const value = String(pathValue ?? "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;

  const cleanPath = value.startsWith("/") ? value : `/${value}`;
  if (!APP_CONFIG.apiBaseUrl) {
    return cleanPath;
  }

  return `${APP_CONFIG.apiBaseUrl}${cleanPath}`;
}

export function buildMediaUrl(pathValue?: string | null) {
  const value = String(pathValue ?? "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;

  const cleanPath = value.replace(/^\/+/, "");
  const mediaPath = cleanPath.startsWith("uploads/") ? `api/${cleanPath}` : cleanPath;
  if (!APP_CONFIG.apiBaseUrl) {
    return `/${mediaPath}`;
  }

  return `${APP_CONFIG.apiBaseUrl}/${mediaPath}`;
}
