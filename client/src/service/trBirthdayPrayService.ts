import http from "../api/http";
import type {
  DashboardBirthdayItem,
  TRBirthdayPrayDetail,
  TRBirthdayPrayHistoryItem,
  TRBirthdayPrayMediaDebugInfo,
} from "../Model/ModelTRBirthdayPray";

export async function getBirthdayDashboard(tgl: string): Promise<DashboardBirthdayItem[]> {
  const response = await http.get("api/Transaction/TRBirthdayPray/GetDashboard", {
    params: { tgl },
  });

  if (response.data?.success === false) {
    throw new Error(response.data?.message || "Gagal mengambil data dashboard birthday.");
  }

  return response.data.data ?? [];
}

export async function getTRBirthdayPrayByDonatur(
  idDonatur: number,
  year: number
): Promise<TRBirthdayPrayDetail> {
  const response = await http.get("api/Transaction/TRBirthdayPray/GetDataByDonatur", {
    params: { idDonatur, year },
  });

  return response.data.data;
}

export async function getTRBirthdayPrayHistoryByDonatur(
  idDonatur: number
): Promise<TRBirthdayPrayHistoryItem[]> {
  const response = await http.get("api/Transaction/TRBirthdayPray/GetHistoryByDonatur", {
    params: { idDonatur },
  });

  return response.data.data ?? [];
}

export async function saveTRBirthdayPray(formData: FormData) {
  const response = await http.put("api/Transaction/TRBirthdayPray/Save", formData);
  return response.data;
}

export async function sendWhatsAppBirthdayPray(payload: { idDonatur: number; year?: number }) {
  const response = await http.post("api/Transaction/TRBirthdayPray/SendWhatsApp", payload);
  return response.data;
}

export async function sendTestWhatsAppText(payload: { idDonatur: number; year?: number }) {
  const response = await http.post("api/Transaction/TRBirthdayPray/SendTestWhatsAppText", payload);
  return response.data;
}

export async function sendTestWhatsAppVoice(payload: { idDonatur: number; year?: number }) {
  const response = await http.post("api/Transaction/TRBirthdayPray/SendTestWhatsAppVoice", payload);
  return response.data;
}

export async function getPhoneNumbers() {
  const response = await http.get("api/Transaction/TRBirthdayPray/GetPhoneNumbers");
  return response.data;
}

export async function getTRBirthdayPrayMediaDebugInfo(
  idDonatur: number,
  year?: number
): Promise<TRBirthdayPrayMediaDebugInfo> {
  const response = await http.get("api/Transaction/TRBirthdayPray/GetMediaDebugInfo", {
    params: { idDonatur, year },
  });

  if (response.data?.success === false) {
    throw new Error(response.data?.message || "Gagal mengambil debug media.");
  }

  return response.data.data;
}
