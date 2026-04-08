import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useERPFormMode } from "./userERPFormMode";
import { FORM_MODE } from "../../TypeData/forMode";
import { useCreateMasterUser, useDeleteMasterUser, useUpdateMasterUser } from "./useFetchMasterUser";
import { useFormMessage } from "../useFormMessage";
import { handleMutationError, handleMutationSuccess } from "./masterCrudHelpers";

export function useMasterUserPage() {
  const queryClient = useQueryClient();
  const { mode, toNew, toEdit, toView } = useERPFormMode();
  const [isSaving, setIsSaving] = useState(false);

  const [pt, setPt] = useState("");
  const [userid, setUserid] = useState("");
  const [nama, setNama] = useState("");
  const [lvl, setLvl] = useState("1");
  const [kunci, setKunci] = useState("");
  const [gantiKunci, setGantiKunci] = useState(false);

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

  const resetForm = () => {
    setPt("");
    setUserid("");
    setNama("");
    setLvl("1");
    setKunci("");
    setGantiKunci(false);
  };

  const handleNew = () => {
    resetForm();
    clearFormMessage();
    toNew();
  };

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
    resetForm,
    validateForm,
    handleNew,
    handleSave,
    handleDelete,
  };
}
