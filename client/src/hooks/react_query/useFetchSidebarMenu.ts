import { useQuery } from "@tanstack/react-query";
import { getSidebarMenu } from "../../service/menuService";

export function useFetchSidebarMenu(userid: string, pt: string) {
  return useQuery({
    queryKey: ["sidebar-menu", userid, pt],
    queryFn: ({ signal }) => getSidebarMenu(userid, pt, signal),
    enabled: Boolean(userid && pt),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: true,
  });
}
