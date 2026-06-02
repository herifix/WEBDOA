import type { ThemeMode } from "../lib/theme";

type ThemeToggleProps = {
  themeMode: ThemeMode;
  onToggle: () => void;
};

export default function ThemeToggle({ themeMode, onToggle }: ThemeToggleProps) {
  const isLight = themeMode === "light";
  const label = isLight ? "Ganti ke theme malam" : "Ganti ke theme siang";

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={label}
      title={label}
      onClick={onToggle}
    >
      {isLight ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2.5v2" />
          <path d="M12 19.5v2" />
          <path d="m4.6 4.6 1.4 1.4" />
          <path d="m18 18 1.4 1.4" />
          <path d="M2.5 12h2" />
          <path d="M19.5 12h2" />
          <path d="m4.6 19.4 1.4-1.4" />
          <path d="m18 6 1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.5 14.4A8.2 8.2 0 0 1 9.6 3.5 8.6 8.6 0 1 0 20.5 14.4Z" />
        </svg>
      )}
    </button>
  );
}
