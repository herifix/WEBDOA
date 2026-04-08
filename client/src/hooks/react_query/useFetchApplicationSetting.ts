import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getApplicationSetting,
  updateApplicationSetting,
} from "../../service/applicationSettingService";
import type { ApplicationSetting } from "../../Model/ModelApplicationSetting";

export function useFetchApplicationSetting() {
  return useQuery({
    queryKey: ["tools-application-setting"],
    queryFn: ({ signal }) => getApplicationSetting(signal),
  });
}

export function useUpdateApplicationSetting() {
  return useMutation({
    mutationFn: (payload: ApplicationSetting) => updateApplicationSetting(payload),
  });
}
