import http from "../api/http";
import type {
  ModelDataUserRequest,
  ModelDataUserResponse,
} from "../Model/LoginModel";
import { getAPIErrorMessage } from "../helper/httpRequestErrorHelper";

export async function postLogin(
  payload: ModelDataUserRequest,
  signal?: AbortSignal
): Promise<ModelDataUserResponse> {
  try {
    const res = await http.post<ModelDataUserResponse>("/api/Auth/login", payload, {
      signal,
    });
    return res.data;
  } catch (e) {
    throw new Error(getAPIErrorMessage(e));
  }
}
