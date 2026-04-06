import { useQuery } from "@tanstack/react-query";
import { getDonaturDashboard } from "../../service/masterDonaturService";

export function useFetchDonaturDashboard(tgl: string) {
  return useQuery({
    queryKey: ["donatur-dashboard"],
    queryFn: () => getDonaturDashboard(tgl),
  });
}