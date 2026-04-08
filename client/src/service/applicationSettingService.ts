import http from "../api/http";
import { getAPIErrorMessage } from "../helper/httpRequestErrorHelper";
import type { ApplicationSetting } from "../Model/ModelApplicationSetting";

type SettingResponse = {
  success: boolean;
  message: string;
  data: ApplicationSetting;
};

type UpdateResponse = {
  success: boolean;
  message: string;
  data: number;
};

export async function getApplicationSetting(
  signal?: AbortSignal
): Promise<ApplicationSetting> {
  try {
    const res = await http.get<SettingResponse>("api/Tools/ApplicationSetting/GetSetting", {
      signal,
    });

    if (!res.data.success) {
      throw new Error(res.data.message || "Gagal mengambil application setting.");
    }

    return res.data.data;
  } catch (e) {
    throw new Error(getAPIErrorMessage(e));
  }
}

export async function updateApplicationSetting(payload: ApplicationSetting): Promise<UpdateResponse> {
  try {
    const res = await http.put<UpdateResponse>("api/Tools/ApplicationSetting/Update", payload);

    if (!res.data.success) {
      throw new Error(res.data.message || "Gagal menyimpan application setting.");
    }

    return res.data;
  } catch (e) {
    throw new Error(getAPIErrorMessage(e));
  }
}
