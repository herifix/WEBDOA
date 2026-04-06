import { useQuery } from "@tanstack/react-query";
import type { FindDataRequest } from "../../Model/ModelFindData";
import { fetchFindData } from "../../service/FindService";

// queryKey: ["find-data" per masing jenis pencarian, keyword] Find supp, item, cuss (pencarian data master saja karena jarang berubah)
export function useFetchFindData(payload: FindDataRequest, enabled: boolean = true) {
  return useQuery({
    queryKey: ["find-data", payload.jenisPencarian, payload.keyword],
    queryFn: ({ signal }) => fetchFindData(payload, signal),
    enabled,
    staleTime: 0,
  });
}