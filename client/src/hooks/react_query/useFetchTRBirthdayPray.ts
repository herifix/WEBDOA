import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getBirthdayDashboard,
  getTRBirthdayPrayHistoryByDonatur,
  getTRBirthdayPrayByDonatur,
  saveTRBirthdayPray,
  uploadVoiceMp3,
  sendWhatsAppBirthdayPray,
  sendTestWhatsAppText,
  sendTestWhatsAppVoice,
  getPhoneNumbers,
  getTRBirthdayPrayMediaDebugInfo,
  getTRBirthdayPrayWhatsAppDeliveryStatus,
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

export function useUploadVoiceMp3() {
  return useMutation({
    mutationFn: (formData: FormData) => uploadVoiceMp3(formData),
  });
}

export function useSendWhatsAppBirthdayPray() {
  return useMutation({
    mutationFn: (payload: { idDonatur: number; year?: number }) =>
      sendWhatsAppBirthdayPray(payload),
  });
}

export function useSendTestWhatsAppText() {
  return useMutation({
    mutationFn: (payload: { idDonatur: number; year?: number; messageText?: string }) =>
      sendTestWhatsAppText(payload),
  });
}

export function useSendTestWhatsAppVoice() {
  return useMutation({
    mutationFn: (payload: { idDonatur: number; year?: number }) =>
      sendTestWhatsAppVoice(payload),
  });
}

export function useFetchPhoneNumbers() {
  return useMutation({
    mutationFn: () => getPhoneNumbers(),
  });
}

export function useFetchTRBirthdayPrayMediaDebugInfo() {
  return useMutation({
    mutationFn: (payload: { idDonatur: number; year?: number }) =>
      getTRBirthdayPrayMediaDebugInfo(payload.idDonatur, payload.year),
  });
}

export function useFetchTRBirthdayPrayWhatsAppDeliveryStatus() {
  return useMutation({
    mutationFn: (payload: { idDonatur: number; year?: number }) =>
      getTRBirthdayPrayWhatsAppDeliveryStatus(payload.idDonatur, payload.year),
  });
}
