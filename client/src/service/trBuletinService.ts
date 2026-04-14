import http from "../api/http";
import type { TRBuletinItem } from "../Model/ModelTRBuletin";

export async function getTRBuletinList(): Promise<TRBuletinItem[]> {
  const response = await http.get("api/Transaction/TRBuletin/GetDataAll");
  return response.data.data ?? [];
}

export async function getTRBuletinById(id_buletin: number): Promise<TRBuletinItem> {
  const response = await http.get("api/Transaction/TRBuletin/GetDataById", {
    params: { id_buletin },
  });

  return response.data.data;
}

export async function saveTRBuletin(formData: FormData) {
  const response = await http.put("api/Transaction/TRBuletin/Save", formData);
  return response.data;
}

export async function deleteTRBuletin(id_buletin: number) {
  const response = await http.put("api/Transaction/TRBuletin/Delete", {
    id_buletin,
  });

  return response.data;
}

export async function publishTRBuletin(id_buletin: number) {
  const response = await http.post("api/Transaction/TRBuletin/Publish", {
    id_buletin,
  });

  return response.data;
}
