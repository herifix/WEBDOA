import http from "../api/http";
import type { DataPage, PagedResponse } from "../Model/ModelMaster";
import type { ModelMasterPendoa } from "../Model/ModelMasterPendoa";

export async function getAllMasterPendoa(params: DataPage) {
  const response = await http.get<PagedResponse<ModelMasterPendoa>>(
    "api/Master/Pendoa/GetDataAll",
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

export async function createPendoa(formData: FormData) {
  const response = await http.put("api/Master/Pendoa/Create", formData);
  return response.data;
}

export async function updatePendoa(formData: FormData) {
  const response = await http.put("api/Master/Pendoa/Update", formData);
  return response.data;
}

export async function getDataById(id: number) {
  const response = await http.get("api/Master/Pendoa/GetDataById", {
    params: { id },
  });
  return response.data;
}

export async function deletePendoa(id: number) {
  const response = await http.put(`api/Master/Pendoa/Delete/${id}`, {
    params: { id },
  });
  return response.data;
}
