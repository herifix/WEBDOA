import type { Donor } from "../data/donors";
import { normalizeDateKey } from "./date";
import { safeGetJSON, safeSetJSON } from "./storage";

const DEFAULT_API_BASE_URL = "https://yobel.intsoftware.co.id";
const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(
  /\/+$/,
  ""
);

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type SessionLike = {
  token?: string;
};

export type DashboardBirthdayItem = {
  id_donatur: number;
  nama: string;
  tglLahir: string | null;
  birthdayDate: string | null;
  noHP: string;
  status: boolean;
  lastDonation: string | null;
  sudahDidoakan: boolean;
  sudahAdaPesanDoa: boolean;
  sudahAdaPesanSuara: boolean;
  id_TRBirthdayPray: number | null;
  prayCreatedDate: string | null;
  isWASent?: boolean;
};

type LoginResponse = {
  access_token: string;
};

function getSessionToken() {
  return safeGetJSON<SessionLike>("doa.session", {}).token ?? "";
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(path.replace(/^\/+/, ""), `${API_BASE_URL}/`);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function apiRequest<T>(path: string, init?: RequestInit, params?: Record<string, string>) {
  const token = getSessionToken();
  const headers = new Headers(init?.headers);

  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildUrl(path, params), {
    ...init,
    headers
  });

  if (!response.ok) {
    const fallbackMessage = response.status === 401 ? "Login tidak valid atau sesi berakhir." : "";
    throw new Error(fallbackMessage || `API gagal (${response.status}).`);
  }

  const body = (await response.json()) as T;
  return body;
}

export async function loginApi(userid: string, password: string, userpt = "GKY") {
  const body = await apiRequest<LoginResponse>("/api/Auth/login", {
    method: "POST",
    body: JSON.stringify({ userid, password, userpt })
  });

  if (!body.access_token) {
    throw new Error("Login berhasil tetapi token tidak diterima.");
  }

  return body.access_token;
}

export async function getBirthdayDashboard(tgl: string) {
  const response = await apiRequest<ApiEnvelope<DashboardBirthdayItem[]>>(
    "/api/Transaction/TRBirthdayPray/GetDashboard",
    undefined,
    { tgl }
  );

  if (response.success === false) {
    throw new Error(response.message || "Gagal mengambil dashboard ulang tahun.");
  }

  return response.data ?? [];
}

export async function getBirthdaysByDate(tgl: string) {
  const response = await apiRequest<ApiEnvelope<DashboardBirthdayItem[]>>(
    "/api/Transaction/TRBirthdayPray/UpcomingBirthdayByTgl",
    undefined,
    { tgl }
  );

  if (response.success === false) {
    throw new Error(response.message || "Gagal mengambil data ulang tahun.");
  }

  return response.data ?? [];
}

export async function saveVoiceFFmpeg(params: {
  donor: Donor;
  file: File;
}) {
  const idDonatur = params.donor.apiId ?? Number(params.donor.id);
  if (!Number.isFinite(idDonatur) || idDonatur <= 0) {
    throw new Error("Data donatur dari API belum tersedia. Tidak bisa menyimpan rekaman.");
  }

  const formData = new FormData();
  formData.append("idDonatur", String(idDonatur));
  if (params.donor.idTRBirthdayPray && params.donor.idTRBirthdayPray > 0) {
    formData.append("idTRBirthdayPray", String(params.donor.idTRBirthdayPray));
  }
  formData.append("pesanSuaraFile", params.file, params.file.name);
  formData.append("saveToAllSameBirthdayDate", "false");

  const response = await apiRequest<ApiEnvelope<number>>(
    "/api/Transaction/TRBirthdayPray/SaveVoiceFFmpeg",
    {
      method: "PUT",
      body: formData
    }
  );

  if (response.success === false) {
    throw new Error(response.message || "Gagal menyimpan rekaman doa.");
  }

  return response.data ?? 0;
}

export function mapApiBirthdayItem(item: DashboardBirthdayItem): Donor {
  const birthday = normalizeDateKey(item.birthdayDate) || normalizeDateKey(item.tglLahir);

  return {
    id: String(item.id_donatur),
    apiId: item.id_donatur,
    idTRBirthdayPray: item.id_TRBirthdayPray ?? null,
    name: item.nama,
    phone: item.noHP,
    birthday,
    hasVoice: Boolean(item.sudahAdaPesanSuara)
  };
}

export function readCache<T>(key: string, fallback: T) {
  return safeGetJSON<T>(key, fallback);
}

export function writeCache(key: string, value: unknown) {
  safeSetJSON(key, value);
}
