import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { fetchPTs } from "../../service/masterService";

export function useFetchPTs() {
  return useQuery({
    queryKey: ["master", "pt"],
    queryFn: ({ signal }) => fetchPTs(signal),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      const err = error as AxiosError;
      const status = err.response?.status;
      if (status && status >= 400 && status < 500) return false;

      return failureCount < 1;
    },
  });
}
