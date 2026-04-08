import { useMutation, useQuery } from "@tanstack/react-query";
import type { DataPage } from "../../Model/ModelMaster";
import {
  changePassword,
  createMasterUser,
  deleteMasterUser,
  getAllMasterUser,
  getMasterUserMenuPermissions,
  updateMasterUser,
} from "../../service/masterUserService";
import type { ChangePasswordRequest } from "../../Model/ModelMasterUser";

export function useFetchMasterUser(params: DataPage) {
  return useQuery({
    queryKey: ["master-user-list", params],
    queryFn: () => getAllMasterUser(params),
  });
}

export function useCreateMasterUser() {
  return useMutation({
    mutationFn: (formData: FormData) => createMasterUser(formData),
  });
}

export function useUpdateMasterUser() {
  return useMutation({
    mutationFn: (formData: FormData) => updateMasterUser(formData),
  });
}

export function useDeleteMasterUser() {
  return useMutation({
    mutationFn: ({ pt, userid }: { pt: string; userid: string }) =>
      deleteMasterUser(pt, userid),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) => changePassword(payload),
  });
}

export function useFetchMasterUserMenuPermissions(pt: string, userid: string) {
  return useQuery({
    queryKey: ["master-user-menu-permissions", pt, userid],
    queryFn: () => getMasterUserMenuPermissions(pt, userid),
  });
}
