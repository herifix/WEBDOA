import { useRef, useState } from "react";
import type { TextBoxMasterRef } from "../../components/TextBoxMaster";
import { useERPFormMode } from "./userERPFormMode";
import { FORM_MODE } from "../../TypeData/forMode";
import { useUpdateItem } from "./useFecthMasterItem";

type ActiveTab = "general" | "detail";

export function useMasterItemPage() {
  // area tetap
  const [area] = useState("MJKKB");

  // form utama
  const [idItem, setIdItem] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [itemDesc, setItemDesc] = useState("");

  const [classcode, setClassCode] = useState("");
  const [classname, setClassName] = useState("");

  const [baseunitcode, setBaseUnitCode] = useState("");
  const [baseunitname, setBaseUnitName] = useState("");

  const [grupcode, setGrupCode] = useState("");
  const [grupname, setGrupName] = useState("");

  const [activeDate, setactiveDate] = useState<Date | null>(new Date());

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
  const { mutateAsync: updateItemAsync } = useUpdateItem();
  async function handleUpdate() {
        try {
            const formData = new FormData();
            formData.append("iditem", idItem.toString());
            formData.append("code", itemCode);
            formData.append("name", itemDesc);
            formData.append("classcode", classcode);
            formData.append("img1", imageFileName ?? ""); // nama file lama jika tidak ada file baru
            formData.append("baseunitcode", baseunitcode);
            formData.append("activedate", activeDate ? new Date(activeDate).toISOString() : "");
            formData.append("userupdate", localStorage.getItem("userid") ?? "");

            if (imageFile) {
            formData.append("img1File", imageFile);
            }

            const response = await updateItemAsync(formData);

            if (!response.success) {
                throw new Error("Gagal update data");
            }

            const result = await response.json();
            console.log("update sukses", result);
        } catch (err) {
            console.error(err);
            
        }
    }

    const handleNew = () => {
        resetForm();
        toNew();
    };


  const handleSave = async () => {
    try {
        console.log("state",mode);
      setIsSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if  (mode === FORM_MODE.NEW) {
        await handleUpdate();
      }
      else if  (mode === FORM_MODE.EDIT) {
        await handleUpdate();
      }

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
    setIdItem("0");
    setItemCode("");
    setItemDesc("");

    setClassCode("");
    setClassName("");

    setBaseUnitCode("");
    setBaseUnitName("");

    setGrupCode("");
    setGrupName("");

    setactiveDate(new Date());
    setActiveTab("general");

    clearLookupRefs();
    clearImage();
  };

  return {
    // state form
    area,
    idItem,
    setIdItem,
    itemCode,
    setItemCode,
    itemDesc,
    setItemDesc,
    classcode,
    setClassCode,
    classname,
    setClassName,
    baseunitcode,
    setBaseUnitCode,
    baseunitname,
    setBaseUnitName,
    grupcode,
    setGrupCode,
    grupname,
    setGrupName,
    activeDate,
    setactiveDate,

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

    // helper
    clearLookupRefs,
    resetForm,
    handleUpdate,
    handleNew,
  };
}