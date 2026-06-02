import { useCallback, useEffect, useState } from "react";
import type { Session } from "./auth";
import { safeGetJSON, safeSetJSON } from "./storage";

export type ThemeMode = "light" | "dark";

const DEFAULT_THEME: ThemeMode = "dark";
const ANONYMOUS_THEME_KEY = "doa.theme.anonymous";
const DARK_THEME_COLOR = "#17151d";
const LIGHT_THEME_COLOR = "#f8f3e8";

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark";
}

function readTheme(storageKey: string) {
  const stored = safeGetJSON<unknown>(storageKey, null);
  return isThemeMode(stored) ? stored : DEFAULT_THEME;
}

export function getThemeStorageKey(session: Session | null) {
  if (!session?.userid) return ANONYMOUS_THEME_KEY;
  const userpt = session.userpt.trim() || "default";
  const userid = session.userid.trim() || "anonymous";
  return `doa.theme.${userpt}.${userid}`;
}

export function useThemeMode(storageKey: string) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => readTheme(storageKey));

  useEffect(() => {
    setThemeMode(readTheme(storageKey));
  }, [storageKey]);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;

    const themeColor = themeMode === "light" ? LIGHT_THEME_COLOR : DARK_THEME_COLOR;
    let metaThemeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.name = "theme-color";
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = themeColor;
  }, [themeMode]);

  const setStoredThemeMode = useCallback(
    (nextThemeMode: ThemeMode) => {
      setThemeMode(nextThemeMode);
      safeSetJSON(storageKey, nextThemeMode);
    },
    [storageKey]
  );

  const toggleThemeMode = useCallback(() => {
    setThemeMode((currentThemeMode) => {
      const nextThemeMode: ThemeMode = currentThemeMode === "light" ? "dark" : "light";
      safeSetJSON(storageKey, nextThemeMode);
      return nextThemeMode;
    });
  }, [storageKey]);

  return {
    themeMode,
    setThemeMode: setStoredThemeMode,
    toggleThemeMode
  };
}
