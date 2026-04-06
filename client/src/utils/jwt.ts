export type JwtClaims = {
  sub?: string;
  name?: string;
  role?: string | string[]; // kadang string, kadang array
  exp?: number;
  [key: string]: string | string[] | number | undefined;
};

function base64UrlDecode(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "===".slice((base64.length + 3) % 4);
  const decoded = atob(padded);
  // handle UTF-8
  try {
    return decodeURIComponent(
      decoded.split("").map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
    );
  } catch {
    return decoded;
  }
}

export function decodeJwt(token: string): JwtClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
}

export function normalizeRoles(claims: JwtClaims | null): string[] {
  if (!claims) return [];
  const r = claims.role;
  if (Array.isArray(r)) return r.map(String);
  if (typeof r === "string") return [r];
  // fallback kalau backend pakai key lain, misalnya "Userlvl"
  const alt = claims.Userlvl ?? claims.userlvl ?? claims.level;
  return alt ? [String(alt)] : [];
}

export function isTokenExpired(claims: JwtClaims | null): boolean {
  const exp = claims?.exp;
  if (!exp) return false; // kalau tidak ada exp, anggap tidak expired
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec >= exp;
}
