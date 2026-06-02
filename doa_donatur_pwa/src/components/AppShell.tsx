import { useEffect, useState, type ReactNode } from "react";
import type { ThemeMode } from "../lib/theme";
import ThemeToggle from "./ThemeToggle";

type AppShellProps = {
  children: ReactNode;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
};

export default function AppShell({ children, themeMode, onToggleTheme }: AppShellProps) {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="app-shell">
      {!online ? <div className="offline-banner">Mode offline aktif</div> : null}
      <ThemeToggle themeMode={themeMode} onToggle={onToggleTheme} />
      {children}
    </div>
  );
}
