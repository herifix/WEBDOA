import { useRef, useState } from "react";
import type { TextBoxMasterRef } from "../../components/TextBoxMaster";
import { useERPFormMode } from "./userERPFormMode";
import { FORM_MODE } from "../../TypeData/forMode";
import { useUpdatePendoa,useCreatePendoa, useDeletePendoa } from "./useFetchMasterPendoa";
import { useQueryClient } from "@tanstack/react-query";

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

  //@todo Fungsi Update
  const { mutateAsync: updatePendoaAsync } = useUpdatePendoa();
  async function handleUpdate() {
        try {
            const formData = new FormData();
            formData.append("idPendoa", idPendoa.toString());            
            formData.append("nama", nama);
            formData.append("dfl", dfl.toString());
            formData.append("nohp", nohp);

            const result = await updatePendoaAsync(formData);

            if (!result.success) {
                throw new Error("Gagal update data");
            }

            // const result = await response.json();
            //console.log("update sukses", result);
        } catch (err) {
            console.error(err);
            
        }
    }

const { mutateAsync: createPendoaAsync } = useCreatePendoa();
  async function CreateSave() {
        try {
            const formData = new FormData();

            formData.append("nama", nama);
            formData.append("dfl", dfl.toString());
            formData.append("nohp", nohp);

            const result = await createPendoaAsync(formData);

            if (!result.success) {
                throw new Error("Gagal create data");
            }

            // const result = await response.json();
            //console.log("create sukses", result);
        } catch (err) {
            console.error(err);
            
        }
    }

    const handleNew = () => {
        resetForm();
        toNew();
    };

const { mutateAsync: DeletePendoaAsync } = useDeletePendoa();

async function DeleteData() {
  try {
    if (!idPendoa) {
      alert("Pilih data dulu");
      return false;
    }

    const confirmDelete = confirm("Yakin mau hapus?");
    if (!confirmDelete) return false;

    const result = await DeletePendoaAsync(Number(idPendoa));

    if (!result.success) {
      throw new Error("Gagal delete data");
    }

    alert("Delete berhasil");
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

    setPage(1);

    await queryClient.invalidateQueries({
      queryKey: ["master-pendoa-list"],
    });

    toView();
  } catch (err) {
    console.error(err);
    alert("Gagal delete data");
  }
};

  const handleSave = async () => {
    try {
        console.log("state",mode);
      setIsSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if  (mode === FORM_MODE.NEW) {
        await CreateSave();
      }
      else if  (mode === FORM_MODE.EDIT) {
        await handleUpdate();
      }

      
      setPage(1);
      await queryClient.invalidateQueries({
        queryKey: ["master-pendoa-list"],
      });
      toView();
    } catch (err) {
        console.error(err);
        alert("Fail save data");}
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
    handleSave,
    handleDelete,

    // helper
    clearLookupRefs,
    resetForm,
    handleUpdate,
    handleNew,
  };
}