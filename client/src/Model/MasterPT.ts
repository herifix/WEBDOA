import http from "../api/http";

export interface PtItem {
  ptCode: string;
  ptName: string;
  logoFile?: string;
}

export const getPTList = () =>
  http.get<PtItem[]>("/api/Auth/GetlistPT");
