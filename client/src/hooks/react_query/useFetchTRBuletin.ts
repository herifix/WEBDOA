import { useMutation, useQuery } from "@tanstack/react-query";
import {
  deleteTRBuletin,
  getTRBuletinById,
  getTRBuletinList,
  publishTRBuletin,
  saveTRBuletin,
} from "../../service/trBuletinService";

export function useFetchTRBuletinList() {
  return useQuery({
    queryKey: ["tr-buletin-list"],
    queryFn: () => getTRBuletinList(),
  });
}

export function useFetchTRBuletinById(id_buletin: number) {
  return useQuery({
    queryKey: ["tr-buletin-detail", id_buletin],
    queryFn: () => getTRBuletinById(id_buletin),
  });
}

export function useSaveTRBuletin() {
  return useMutation({
    mutationFn: (formData: FormData) => saveTRBuletin(formData),
  });
}

export function useDeleteTRBuletin() {
  return useMutation({
    mutationFn: (id_buletin: number) => deleteTRBuletin(id_buletin),
  });
}

export function usePublishTRBuletin() {
  return useMutation({
    mutationFn: (id_buletin: number) => publishTRBuletin(id_buletin),
  });
}
