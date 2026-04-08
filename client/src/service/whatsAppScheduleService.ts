import http from "../api/http";
import { getAPIErrorMessage } from "../helper/httpRequestErrorHelper";
import type { WhatsAppScheduleSetting } from "../Model/ModelWhatsAppSchedule";

type SettingResponse = {
  success: boolean;
  message: string;
  data: WhatsAppScheduleSetting;
};

type UpdateResponse = {
  success: boolean;
  message: string;
  data: number;
};

export async function getWhatsAppScheduleSetting(
  signal?: AbortSignal
): Promise<WhatsAppScheduleSetting> {
  try {
    const res = await http.get<SettingResponse>("api/Tools/WhatsappSchedule/GetSetting", {
      signal,
    });

    if (!res.data.success) {
      throw new Error(res.data.message || "Gagal mengambil setting WhatsApp.");
    }

    return res.data.data;
  } catch (e) {
    throw new Error(getAPIErrorMessage(e));
  }
}

export async function updateWhatsAppScheduleSetting(payload: {
  sendTime: string;
  isActive: boolean;
}): Promise<UpdateResponse> {
  try {
    const res = await http.put<UpdateResponse>("api/Tools/WhatsappSchedule/Update", payload);

    if (!res.data.success) {
      throw new Error(res.data.message || "Gagal menyimpan setting WhatsApp.");
    }

    return res.data;
  } catch (e) {
    throw new Error(getAPIErrorMessage(e));
  }
}
