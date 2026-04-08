import http from "../api/http";
import type { DataPage, PagedResponse } from "../Model/ModelMaster";
import type { ChangePasswordRequest, ModelMasterUser } from "../Model/ModelMasterUser";
import { getAPIErrorMessage } from "../helper/httpRequestErrorHelper";

export async function getAllMasterUser(params: DataPage) {
  const response = await http.get<PagedResponse<ModelMasterUser>>(
    "api/Tools/User/GetDataAll",
    {
      params: {
        PageNumber: params.pageNumber ?? 1,
        PageSize: params.pageSize,
        Search: params.search ?? "",
      },
    }
  );

  return response.data;
}

export async function getMasterUserById(pt: string, userid: string) {
  const response = await http.get("api/Tools/User/GetDataById", {
    params: { pt, userid },
  });
  return response.data;
}

export async function getCurrentPassword(pt: string, userid: string) {
  const response = await http.get("api/Tools/User/GetCurrentPassword", {
    params: { pt, userid },
  });
  return response.data;
}

export async function createMasterUser(formData: FormData) {
  const response = await http.put("api/Tools/User/Create", formData);
  return response.data;
}

export async function updateMasterUser(formData: FormData) {
  const response = await http.put("api/Tools/User/Update", formData);
  return response.data;
}

export async function deleteMasterUser(pt: string, userid: string) {
  const response = await http.put("api/Tools/User/Delete", null, {
    params: { pt, userid },
  });
  return response.data;
}

export async function changePassword(payload: ChangePasswordRequest) {
  try {
    const response = await http.put("api/Tools/User/ChangePassword", payload);
    return response.data;
  } catch (error) {
    throw new Error(getAPIErrorMessage(error));
  }
}
