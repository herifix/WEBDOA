import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getWhatsAppScheduleSetting,
  updateWhatsAppScheduleSetting,
} from "../../service/whatsAppScheduleService";

export function useFetchWhatsAppSchedule() {
  return useQuery({
    queryKey: ["tools-whatsapp-schedule"],
    queryFn: ({ signal }) => getWhatsAppScheduleSetting(signal),
  });
}

export function useUpdateWhatsAppSchedule() {
  return useMutation({
    mutationFn: (payload: { sendTime: string; isActive: boolean }) =>
      updateWhatsAppScheduleSetting(payload),
  });
}
