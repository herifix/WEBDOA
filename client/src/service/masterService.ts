import http from "../api/http";
import type { PtItem } from "../Model/pt";
import { getAPIErrorMessage } from "../helper/httpRequestErrorHelper";


export async function fetchPTs(
  signal?: AbortSignal,
): Promise<PtItem[]> {
  try {
    const res = await http.get<PtItem[]>("/api/Auth/GetlistPT", {
      signal,
    });

// console.log("FETCH PTs:", res.data);

    return res.data;
  } catch (e) {
    const message = getAPIErrorMessage(e);

    throw new Error(message);
  }
}
