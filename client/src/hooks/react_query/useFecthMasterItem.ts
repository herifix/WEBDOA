import { useQuery,useMutation  } from "@tanstack/react-query";
import { getAllItemMaster,updateItem } from "../../service/masterItemService";
import type { DataPage } from "../../Model/ModelMaster";

export function useFetchMasterItem(params: DataPage) {
  return useQuery({
    queryKey: ["master-item-list", params],
    queryFn: () => getAllItemMaster(params),
  });
}

export function useUpdateItem() {
  return useMutation({
    mutationFn: (formData: FormData) => updateItem(formData),
  });
}

