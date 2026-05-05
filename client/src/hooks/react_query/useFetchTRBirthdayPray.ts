import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getBirthdayDashboard,
  getTRBirthdayPrayHistoryByDonatur,
  getTRBirthdayPrayByDonatur,
  saveTRBirthdayPray,
  sendWhatsAppBirthdayPray,
} from "../../service/trBirthdayPrayService";

export function useFetchBirthdayDashboard(tgl: string) {
  return useQuery({
    queryKey: ["birthday-dashboard", tgl],
    queryFn: () => getBirthdayDashboard(tgl),
  });
}

export function useFetchTRBirthdayPrayByDonatur(idDonatur: number, year: number) {
  return useQuery({
    queryKey: ["tr-birthday-pray", idDonatur, year],
    queryFn: () => getTRBirthdayPrayByDonatur(idDonatur, year),
    enabled: idDonatur > 0,
  });
}

export function useFetchTRBirthdayPrayHistoryByDonatur(idDonatur: number) {
  return useQuery({
    queryKey: ["tr-birthday-pray-history", idDonatur],
    queryFn: () => getTRBirthdayPrayHistoryByDonatur(idDonatur),
    enabled: idDonatur > 0,
  });
}

export function useSaveTRBirthdayPray() {
  return useMutation({
    mutationFn: (formData: FormData) => saveTRBirthdayPray(formData),
  });
}

export function useSendWhatsAppBirthdayPray() {
  return useMutation({
    mutationFn: (payload: { idDonatur: number; year?: number }) =>
      sendWhatsAppBirthdayPray(payload),
  });
}
