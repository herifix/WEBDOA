import { useEffect, useMemo, useState } from "react";
import AppShell from "./components/AppShell";
import { getSession, logout } from "./lib/auth";
import { getRoute, listenRouteChange, navigate, parseQuery } from "./lib/router";
import { getThemeStorageKey, useThemeMode } from "./lib/theme";
import BirthdayDetailPage from "./pages/BirthdayDetailPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";

function getPath(route: string) {
  return route.split("?")[0] || "/login";
}

export default function App() {
  const [route, setRoute] = useState(getRoute);
  const routePath = useMemo(() => getPath(route), [route]);
  const forceLoginReset = useMemo(() => {
    const query = parseQuery(route);
    return import.meta.env.DEV && routePath === "/login" && query.resetSession === "1";
  }, [route, routePath]);
  const session = forceLoginReset ? null : getSession();
  const authed = Boolean(session?.token);
  const themeStorageKey = useMemo(() => getThemeStorageKey(session), [session]);
  const { themeMode, toggleThemeMode } = useThemeMode(themeStorageKey);

  useEffect(() => listenRouteChange(() => setRoute(getRoute())), []);

  useEffect(() => {
    if (forceLoginReset) {
      logout();
      return;
    }

    if (!authed && routePath !== "/login") {
      navigate("/login");
      return;
    }

    if (authed && (routePath === "/" || routePath === "/login")) {
      navigate("/dashboard");
    }
  }, [authed, forceLoginReset, routePath]);

  let page = <LoginPage />;

  if (authed && routePath === "/dashboard") {
    page = <DashboardPage />;
  } else if (authed && routePath === "/birthdays") {
    page = <BirthdayDetailPage />;
  } else if (authed && routePath !== "/login") {
    page = <DashboardPage />;
  }

  return (
    <AppShell themeMode={themeMode} onToggleTheme={toggleThemeMode}>
      {page}
    </AppShell>
  );
}
