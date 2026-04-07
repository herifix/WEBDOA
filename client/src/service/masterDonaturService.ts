import http from "../api/http";
import type { DataPage, PagedResponse } from "../Model/ModelMaster";
import type { ModelMasterDonatur } from "../Model/ModelMasterDonatur";

export async function getMasterDonaturByDate(Tgl: string): Promise<ModelMasterDonatur[]> {
  const response = await http.get("/api/Master/Donatur/GetDataByTgl", {
    params: {
      Tgl: Tgl,
    },
  });
  return response.data.data;
}

export async function getAllMasterDonatur(params: DataPage) {
  const response = await http.get<PagedResponse<ModelMasterDonatur>>(
    "api/Master/Donatur/GetDataAll",
    {
      params: {
        PageNumber: params.pageNumber ?? 1,
        PageSize: params.pageSize ,
        Search: params.search ?? "",
      },
    }
  );

  return response.data;
}

export async function createDonatur(formData: FormData) {
  const response = await http.put("api/Master/Donatur/Create", formData);
  return response.data;
}

export async function updateDonatur(formData: FormData) {
  const response = await http.put("api/Master/Donatur/Update", formData);
  return response.data;
}

export async function getDataById(id: number) {
  const response = await http.get("api/Master/Donatur/GetDataById", {
    params: { id },
  });
  return response.data;
}

export async function deleteDonatur(id: number) {
  const response = await http.put(`api/Master/Donatur/Delete/${id}`, {
    params: { id },
  });
  return response.data;
}
