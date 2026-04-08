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

export async function updateApplicationSetting(payload: {
  msgTemplate: string;
  msgLink: string;
  existingMsgImage: string;
  msgImageFile?: File | null;
}): Promise<UpdateResponse> {
  try {
    const formData = new FormData();
    formData.append("msgTemplate", payload.msgTemplate);
    formData.append("msgLink", payload.msgLink);
    formData.append("existingMsgImage", payload.existingMsgImage);

    if (payload.msgImageFile) {
      formData.append("msgImageFile", payload.msgImageFile);
    }

    const res = await http.put<UpdateResponse>("api/Tools/ApplicationSetting/Update", formData);

    if (!res.data.success) {
      throw new Error(res.data.message || "Gagal menyimpan application setting.");
    }

    return res.data;
  } catch (e) {
    throw new Error(getAPIErrorMessage(e));
  }
}
