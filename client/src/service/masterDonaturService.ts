import http from "../api/http";
import type { ModelMasterDonatur } from "../Model/ModelMasterDonatur";

export async function getDonaturDashboard(Tgl: string): Promise<ModelMasterDonatur[]> {
  const response = await http.get("/api/Master/Donatur/GetDataByTgl", {
    params: {
      Tgl: Tgl,
    },
  });
  return response.data.data;
}