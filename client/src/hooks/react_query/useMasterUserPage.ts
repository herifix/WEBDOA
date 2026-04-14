import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useERPFormMode } from "./userERPFormMode";
import { FORM_MODE } from "../../TypeData/forMode";
import { useCreateMasterUser, useDeleteMasterUser, useUpdateMasterUser } from "./useFetchMasterUser";
import { useFormMessage } from "../useFormMessage";
import { handleMutationError, handleMutationSuccess } from "./masterCrudHelpers";
import type { MasterUserPermissionRow } from "../../Model/ModelMasterUser";
import { getMasterUserMenuPermissions } from "../../service/masterUserService";
import { useAuthClaims } from "../../hooks/useAuthClaims";

export function useMasterUserPage() {
  const queryClient = useQueryClient();
  const claims = useAuthClaims();
  const { mode, toNew, toEdit, toView } = useERPFormMode();
  const [isSaving, setIsSaving] = useState(false);

  const [pt, setPt] = useState("");
  const [userid, setUserid] = useState("");
  const [nama, setNama] = useState("");
  const [lvl, setLvl] = useState("1");
  const [kunci, setKunci] = useState("");
  const [gantiKunci, setGantiKunci] = useState(false);
  const [permissions, setPermissions] = useState<MasterUserPermissionRow[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(13);

  const {
    formError,
    setFormError,
    formSuccess,
    setFormSuccess,
    clearFormError,
    clearFormSuccess,
    clearFormMessage,
  } = useFormMessage();

  const { mutateAsync: createAsync } = useCreateMasterUser();
  const { mutateAsync: updateAsync } = useUpdateMasterUser();
  const { mutateAsync: deleteAsync } = useDeleteMasterUser();

  const validateForm = () => {
    if (!pt.trim()) {
      setFormError("PT wajib diisi.");
      return false;
    }

    if (!userid.trim()) {
      setFormError("User ID wajib diisi.");
      return false;
    }

    if (!nama.trim()) {
      setFormError("Nama wajib diisi.");
      return false;
    }

    if (!lvl.trim()) {
      setFormError("Level wajib diisi.");
      return false;
    }

    if (mode === FORM_MODE.NEW && !kunci.trim()) {
      setFormError("Password wajib diisi saat create.");
      return false;
    }

    clearFormMessage();
    return true;
  };

  const resetForm = useCallback(() => {
    setPt("");
    setUserid("");
    setNama("");
    setLvl("1");
    setKunci("");
    setGantiKunci(false);
    setPermissions([]);
  }, []);

  const loadPermissions = useCallback(async (nextPt = "", nextUserid = "") => {
    try {
      setIsLoadingPermissions(true);
      const response = await getMasterUserMenuPermissions(nextPt.trim(), nextUserid.trim());
      setPermissions(response.data ?? []);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Gagal mengambil hak akses user."
      );
    } finally {
      setIsLoadingPermissions(false);
    }
  }, [setFormError]);

  const updatePermission = (
    idForm: number,
    key: "canView" | "canAdd" | "canEdit" | "canPrint" | "canDelete",
    value: boolean
  ) => {
    setPermissions((current) =>
      current.map((item) =>
        item.id_form !== idForm
          ? item
          : {
              ...item,
              [key]: value,
            }
      )
    );
  };

  const setPermissionRowAll = (idForm: number, value: boolean) => {
    setPermissions((current) =>
      current.map((item) =>
        item.id_form !== idForm
          ? item
          : {
              ...item,
              canView: value,
              canAdd: value,
              canEdit: value,
              canPrint: value,
              canDelete: value,
            }
      )
    );
  };

  const setPermissionColumn = (
    key: "canView" | "canAdd" | "canEdit" | "canPrint" | "canDelete",
    value: boolean,
    idForms?: number[]
  ) => {
    const idFormSet = idForms ? new Set(idForms) : null;

    setPermissions((current) =>
      current.map((item) => {
        if (idFormSet && !idFormSet.has(item.id_form)) {
          return item;
        }

        if (key === "canView") {
          return value
            ? { ...item, canView: true }
            : {
                ...item,
                canView: false,
                canAdd: false,
                canEdit: false,
                canPrint: false,
                canDelete: false,
              };
        }

        return {
          ...item,
          canView: value ? true : item.canView,
          [key]: value,
        };
      })
    );
  };

  const copyPermissionsFromUser = async (sourcePt: string, sourceUserid: string) => {
    const normalizedPt = sourcePt.trim();
    const normalizedUserid = sourceUserid.trim();

    if (!normalizedPt || !normalizedUserid) {
      setFormError("PT dan User ID sumber wajib diisi untuk copy hak akses.");
      return false;
    }

    try {
      clearFormMessage();
      setIsLoadingPermissions(true);
      const response = await getMasterUserMenuPermissions(normalizedPt, normalizedUserid);
      const sourcePermissions = response.data ?? [];
      const sourceMap = new Map(sourcePermissions.map((item) => [item.id_form, item]));

      setPermissions((current) =>
        current.map((item) => {
          const sourceItem = sourceMap.get(item.id_form);
          if (!sourceItem) return item;

          return {
            ...item,
            canView: sourceItem.canView,
            canAdd: sourceItem.canAdd,
            canEdit: sourceItem.canEdit,
            canPrint: sourceItem.canPrint,
            canDelete: sourceItem.canDelete,
          };
        })
      );

      setFormSuccess(`Hak akses berhasil dicopy dari ${normalizedPt}/${normalizedUserid}.`);
      return true;
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Gagal copy hak akses dari user lain."
      );
      return false;
    } finally {
      setIsLoadingPermissions(false);
    }
  };

const handleNew = useCallback(() => {
    // Set defaults from claims first
    if (claims.pt?.trim()) {
      setPt(claims.pt);
    } else {
      setPt("");
    }
    if (claims.userlvl?.trim()) {
      setLvl(claims.userlvl);
    } else {
      setLvl("1");
    }
    
    // Then reset other fields, preserving PT/level defaults
    setUserid("");
    setNama("");
    setKunci("");
    setGantiKunci(false);
    setPermissions([]);
    
    clearFormMessage();
    toNew();
    void loadPermissions(claims.pt || "", "");
  }, [claims, clearFormMessage, loadPermissions, toNew]);

  const handleSave = async () => {
    try {
      if (!validateForm()) return;

      clearFormMessage();
      setIsSaving(true);

      const formData = new FormData();
      formData.append("pt", pt.trim());
      formData.append("userid", userid.trim());
      formData.append("nama", nama.trim());
      formData.append("lvl", lvl.trim());
      formData.append("kunci", kunci);
      formData.append("gantiKunci", String(gantiKunci));
      formData.append("permissionsJson", JSON.stringify(permissions));

      if (mode === FORM_MODE.NEW) {
        const result = await createAsync(formData);
        if (!result.success) {
          throw new Error(result.message || "Gagal create data");
        }
      } else if (mode === FORM_MODE.EDIT) {
        const result = await updateAsync(formData);
        if (!result.success) {
          throw new Error(result.message || "Gagal update data");
        }
      }

      await handleMutationSuccess({
        queryClient,
        queryKey: "master-user-list",
        setPage,
        clearFormError,
        setFormSuccess,
        successMessage:
          mode === FORM_MODE.NEW
            ? "Data user berhasil disimpan."
            : "Data user berhasil diperbarui.",
        toView,
      });

      setKunci("");
      await loadPermissions(pt, userid);
    } catch (err) {
      handleMutationError({
        err,
        clearFormSuccess,
        setFormError,
        fallbackMessage: "Gagal menyimpan data user.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (!pt.trim() || !userid.trim()) {
        setFormError("Pilih data dulu.");
        return;
      }

      const result = await deleteAsync({ pt: pt.trim(), userid: userid.trim() });
      if (!result.success) {
        throw new Error(result.message || "Gagal delete data");
      }

      await handleMutationSuccess({
        queryClient,
        queryKey: "master-user-list",
        setPage,
        clearFormError,
        setFormSuccess,
        successMessage: "Data user berhasil dihapus.",
        toView,
      });

      resetForm();
      await queryClient.invalidateQueries({ queryKey: ["master-user-menu-permissions"] });
    } catch (err) {
      handleMutationError({
        err,
        clearFormSuccess,
        setFormError,
        fallbackMessage: "Gagal menghapus data user.",
      });
    }
  };

  return {
    pt,
    setPt,
    userid,
    setUserid,
    nama,
    setNama,
    lvl,
    setLvl,
    kunci,
    setKunci,
    gantiKunci,
    setGantiKunci,
    permissions,
    setPermissions,
    isLoadingPermissions,
    searchInput,
    setSearchInput,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    mode,
    toEdit,
    toView,
    FORM_MODE,
    isSaving,
    formError,
    setFormError,
    formSuccess,
    setFormSuccess,
    clearFormSuccess,
    clearFormMessage,
    loadPermissions,
    updatePermission,
    setPermissionRowAll,
    setPermissionColumn,
    copyPermissionsFromUser,
    resetForm,
    validateForm,
    handleNew,
    handleSave,
    handleDelete,
  };
}
