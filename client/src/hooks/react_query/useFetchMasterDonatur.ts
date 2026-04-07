import { useQuery,useMutation } from "@tanstack/react-query";
import { getAllMasterDonatur,getMasterDonaturByDate,updateDonatur,createDonatur, deleteDonatur } from "../../service/masterDonaturService";
import type { DataPage } from "../../Model/ModelMaster";

export function useFetchDonaturDashboard(tgl: string) {
  return useQuery({
    queryKey: ["donatur-dashboard"],
    queryFn: () => getMasterDonaturByDate(tgl),
  });
}

export function useFetchMasterDonatur(params: DataPage) {
  return useQuery({
    queryKey: ["master-Donatur-list", params],
    queryFn: () => getAllMasterDonatur(params),
  });
}

export function useUpdateDonatur() {
  return useMutation({
    mutationFn: (formData: FormData) => updateDonatur(formData),
  });
}

export function useCreateDonatur() {
  return useMutation({
    mutationFn: (formData: FormData) => createDonatur(formData),
  });
}

export function useDeleteDonatur() {
  return useMutation({
    mutationFn: (id: number) => deleteDonatur(id),
  });
}
