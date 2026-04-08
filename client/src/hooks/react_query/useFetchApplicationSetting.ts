import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getApplicationSetting,
  updateApplicationSetting,
} from "../../service/applicationSettingService";

export function useFetchApplicationSetting() {
  return useQuery({
    queryKey: ["tools-application-setting"],
    queryFn: ({ signal }) => getApplicationSetting(signal),
  });
}

export function useUpdateApplicationSetting() {
  return useMutation({
    mutationFn: (payload: {
      msgTemplate: string;
      msgLink: string;
      existingMsgImage: string;
      msgImageFile?: File | null;
    }) => updateApplicationSetting(payload),
  });
}
