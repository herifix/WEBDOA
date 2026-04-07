import { useQuery,useMutation  } from "@tanstack/react-query";
import { getAllMasterPendoa,updatePendoa,createPendoa,deletePendoa } from "../../service/masterDonaturPendoa";
import type { DataPage } from "../../Model/ModelMaster";

export function useFetchMasterPendoa(params: DataPage) {
  return useQuery({
    queryKey: ["master-pendoa-list", params],
    queryFn: () => getAllMasterPendoa(params),
  });
}

export function useUpdatePendoa() {
  return useMutation({
    mutationFn: (formData: FormData) => updatePendoa(formData),
  });
}

export function useCreatePendoa() {
  return useMutation({
    mutationFn: (formData: FormData) => createPendoa(formData),
  });
}

export function useDeletePendoa() {
  return useMutation({
    mutationFn: (id: number) => deletePendoa(id),
  });
}
