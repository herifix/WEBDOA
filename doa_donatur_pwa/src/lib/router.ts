export function getRoute() {
  if (typeof window === "undefined") return "/login";
  const rawHash = window.location.hash.replace(/^#/, "");
  return rawHash || "/login";
}

export function navigate(path: string) {
  window.location.hash = path.startsWith("/") ? path : `/${path}`;
}

export function parseQuery(route = getRoute()) {
  const query = route.split("?")[1] ?? "";
  const params = new URLSearchParams(query);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export function listenRouteChange(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}
