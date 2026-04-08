import { useRef, useState } from "react";
import type { TextBoxMasterRef } from "../../components/TextBoxMaster";
import { useERPFormMode } from "./userERPFormMode";
import { FORM_MODE } from "../../TypeData/forMode";
import { useUpdatePendoa,useCreatePendoa, useDeletePendoa } from "./useFetchMasterPendoa";
import { useQueryClient } from "@tanstack/react-query";
import { useFormMessage } from "../useFormMessage";
import {
  isValidInternationalPhoneNumber,
  normalizeInternationalPhoneNumber,
} from "../../utils/validation";
import { handleMutationError, handleMutationSuccess } from "./masterCrudHelpers";

type ActiveTab = "general" | "detail";

export function useMasterPendoaPage() {
  // area tetap
  const [area] = useState("MJKKB");
  const queryClient = useQueryClient();

  // form utama
  const [idPendoa, setIdPendoa] = useState("");
  const [nama, setNama] = useState("");

  const [nohp, setNohp] = useState("");
  const [dfl, setDfl] = useState<boolean>(false);

  const [createddate, setCreatedDate] = useState("");

  // grid / search
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(13);  // Set max row grid run dev ulang untuk lihat hasilnya

  // image
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // tab
  const [activeTab, setActiveTab] = useState<ActiveTab>("general");

  // textbox refs
  const classRef = useRef<TextBoxMasterRef>(null);
  const baseunitRef = useRef<TextBoxMasterRef>(null);
  const grupRef = useRef<TextBoxMasterRef>(null);
  const warehouseRef = useRef<TextBoxMasterRef>(null);

  // mode form
  const { mode, toNew, toEdit, toView, toApproved } = useERPFormMode();
  const [isSaving, setIsSaving] = useState(false);
  const {
    formError,
    setFormError,
    formSuccess,
    setFormSuccess,
    clearFormError,
    clearFormSuccess,
    clearFormMessage,
  } = useFormMessage();

  const validateForm = () => {
    const trimmedNama = nama.trim();
    const normalizedNohp = normalizeInternationalPhoneNumber(nohp);

    if (!trimmedNama) {
      setFormError("Nama pendoa wajib diisi.");
      return false;
    }

    if (!normalizedNohp) {
      setFormError("No HP wajib diisi.");
      return false;
    }

    if (!isValidInternationalPhoneNumber(normalizedNohp)) {
      setFormError("No HP harus menggunakan format internasional yang valid, misalnya +628123456789.");
      return false;
    }

    clearFormMessage();
    return true;
  };

  //@todo Fungsi Update
  const { mutateAsync: updatePendoaAsync } = useUpdatePendoa();
  async function handleUpdate() {
    const normalizedNohp = normalizeInternationalPhoneNumber(nohp);
    const formData = new FormData();
    formData.append("idPendoa", idPendoa.toString());
    formData.append("nama", nama.trim());
    formData.append("dfl", dfl.toString());
    formData.append("nohp", normalizedNohp);

    const result = await updatePendoaAsync(formData);

    if (!result.success) {
      throw new Error(result.message || "Gagal update data");
    }
  }

  const { mutateAsync: createPendoaAsync } = useCreatePendoa();
  async function CreateSave() {
    const normalizedNohp = normalizeInternationalPhoneNumber(nohp);
    const formData = new FormData();

    formData.append("nama", nama.trim());
    formData.append("dfl", dfl.toString());
    formData.append("nohp", normalizedNohp);

    const result = await createPendoaAsync(formData);

    if (!result.success) {
      throw new Error(result.message || "Gagal create data");
    }
  }

  const handleNew = () => {
    resetForm();
    clearFormMessage();
    toNew();
  };

  const { mutateAsync: DeletePendoaAsync } = useDeletePendoa();

async function DeleteData() {
  try {
    if (!idPendoa) {
      setFormError("Pilih data dulu.");
      return false;
    }

    const result = await DeletePendoaAsync(Number(idPendoa));

    if (!result.success) {
      throw new Error("Gagal delete data");
    }

    return true;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

const handleDelete = async () => {
  try {
    const deleted = await DeleteData();
    if (!deleted) return;

    await handleMutationSuccess({
      queryClient,
      queryKey: "master-pendoa-list",
      setPage,
      clearFormError,
      setFormSuccess,
      successMessage: "Data pendoa berhasil dihapus.",
      toView,
    });
  } catch (err) {
    console.error(err);
    handleMutationError({
      err,
      clearFormSuccess,
      setFormError,
      fallbackMessage: "Gagal delete data",
    });
  }
};

  const handleSave = async () => {
    try {
      if (!validateForm()) return;

      clearFormMessage();
      setIsSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if  (mode === FORM_MODE.NEW) {
        await CreateSave();
      }
      else if  (mode === FORM_MODE.EDIT) {
        await handleUpdate();
      }

      
      await handleMutationSuccess({
        queryClient,
        queryKey: "master-pendoa-list",
        setPage,
        clearFormError,
        setFormSuccess,
        successMessage:
          mode === FORM_MODE.NEW
            ? "Data pendoa berhasil disimpan."
            : "Data pendoa berhasil diperbarui.",
        toView,
      });
    } catch (err) {
        console.error(err);
        handleMutationError({
          err,
          clearFormSuccess,
          setFormError,
          fallbackMessage: "Fail save data",
        });}
    finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (file: File | null) => {
    setImageFile(file);
    setImageFileName(file?.name || null);

    setPreviewUrl((oldUrl) => {
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const clearImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setImageFileName(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearLookupRefs = () => {
    classRef.current?.clear();
    baseunitRef.current?.clear();
    grupRef.current?.clear();
    warehouseRef.current?.clear();
  };

  const resetForm = () => {
    setIdPendoa("0");
    setNama("");

    setNohp("");
    setDfl(false);

    setCreatedDate("");
    setActiveTab("general");

    clearLookupRefs();
    clearImage();
  };

  return {
    // state form
    area,
    idPendoa,
    setIdPendoa,
    nama,
    setNama,
    nohp,
    setNohp,
    dfl,
    setDfl,
    createddate,
    setCreatedDate,

    // search / grid
    searchInput,
    setSearchInput,
    search,
    setSearch,
    page,
    setPage,
    pageSize,

    // image
    imageFile,
    setImageFile,
    previewUrl,
    setPreviewUrl,
    fileInputRef,
    handleFileChange,
    clearImage,
    setImageFileName,
    imageFileName,
    // tab
    activeTab,
    setActiveTab,

    // refs
    classRef,
    baseunitRef,
    grupRef,
    warehouseRef,

    // mode
    mode,
    toNew,
    toEdit,
    toView,
    toApproved,
    FORM_MODE,

    // save
    isSaving,
    setIsSaving,
    formError,
    setFormError,
    formSuccess,
    setFormSuccess,
    clearFormError,
    clearFormSuccess,
    clearFormMessage,
    handleSave,
    handleDelete,

    // helper
    clearLookupRefs,
    resetForm,
    validateForm,
    handleUpdate,
    handleNew,
  };
}
