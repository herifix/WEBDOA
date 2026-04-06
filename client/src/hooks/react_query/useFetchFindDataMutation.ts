import { useMutation } from "@tanstack/react-query";
import type { FindDataRequest } from "../../Model/ModelFindData";
import { fetchFindData } from "../../service/FindService";

export function useFetchFindDataMutation() {
  return useMutation({
    mutationFn: (payload: FindDataRequest) => fetchFindData(payload),
  });
}