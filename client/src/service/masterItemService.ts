import http from "../api/http";
import type { DataPage, PagedResponse } from "../Model/ModelMaster";
import type { ModelMasterItem } from "../Model/ModelMasterItem";

export async function getAllItemMaster(params: DataPage) {
  const response = await http.get<PagedResponse<ModelMasterItem>>(
    "api/Master/Item/GetAll",
    {
      params: {
        Area: params.area ?? "",
        PageNumber: params.pageNumber ?? 1,
        PageSize: params.pageSize ,
        Search: params.search ?? "",
      },
    }
  );

  return response.data;
}

export async function getDataByCode(code: string, area: string) {
  const resp = await http.get("api/Master/Item/GetDataByCode", {
    params: { code, area },
  });

  return resp.data;
}

export async function updateItem(formData: FormData) {
  const response = await http.put("api/Master/item/Update", formData);
  return response.data;
}