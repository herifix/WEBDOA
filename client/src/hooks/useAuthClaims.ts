import { decodeJwt } from "../utils/jwt";

interface AuthClaims {
  pt?: string;
  userpt?: string;
  Userpt?: string;
  userlvl?: string;
  Userlvl?: string;
  sub?: string;
  name?: string;
  role?: string;
  gantiKunci?: string;
  GantiKunci?: string;
  [key: string]: string | number | string[] | undefined;
}

export function useAuthClaims(): AuthClaims {
  if (typeof window === "undefined") {
    return {};
  }

  const token = localStorage.getItem("token");
  if (!token) {
    return {};
  }

  const decodedPayload = decodeJwt(token);
  if (!decodedPayload) {
    localStorage.removeItem("token");
    return {};
  }

  const normalizedPt =
    String(
      decodedPayload.pt ??
        decodedPayload.userpt ??
        decodedPayload.Userpt ??
        localStorage.getItem("userpt") ??
        ""
    ).trim();

  const normalizedUserlvl = String(
    decodedPayload.userlvl ?? decodedPayload.Userlvl ?? decodedPayload.level ?? ""
  ).trim();

  return {
    ...decodedPayload,
    pt: normalizedPt,
    userpt: String(decodedPayload.userpt ?? "").trim() || normalizedPt,
    Userpt: String(decodedPayload.Userpt ?? "").trim() || normalizedPt,
    userlvl: normalizedUserlvl,
    Userlvl: String(decodedPayload.Userlvl ?? "").trim() || normalizedUserlvl,
  };
}


