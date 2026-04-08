import http from "../api/http";
import { getAPIErrorMessage } from "../helper/httpRequestErrorHelper";
import type { AppMenuItem } from "../Model/ModelMenu";

type MenuResponse = {
  success: boolean;
  message: string;
  data: AppMenuItem[];
};

export async function getSidebarMenu(
  userid: string,
  pt: string,
  signal?: AbortSignal
): Promise<AppMenuItem[]> {
  try {
    const res = await http.get<MenuResponse>("/api/Auth/menu", {
      params: { userid, pt },
      signal,
    });

    if (!res.data.success) {
      throw new Error(res.data.message || "Gagal mengambil menu.");
    }

    return res.data.data ?? [];
  } catch (e) {
    throw new Error(getAPIErrorMessage(e));
  }
}
