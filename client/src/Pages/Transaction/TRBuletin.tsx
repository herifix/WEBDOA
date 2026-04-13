import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, FileText, Paperclip, Search, Upload } from "lucide-react";
import ConfirmDialog from "../../components/ConfirmDialog";
import FindDataPopup from "../../components/FindForm";
import StatusBanner from "../../components/StatusBanner";
import ERPToolbar from "../../components/ToolbarHR";
import type { FindDataRow, JenisPencarian } from "../../Model/ModelFindData";
import type { TRBuletinItem } from "../../Model/ModelTRBuletin";
import { buildMediaUrl } from "../../config/appConfig";
import { FORM_IDS } from "../../config/formIds";
import { FORM_MODE } from "../../TypeData/forMode";
import {
  useDeleteTRBuletin,
  useFetchTRBuletinById,
  useFetchTRBuletinList,
  useSaveTRBuletin,
} from "../../hooks/react_query/useFetchTRBuletin";
import { useERPFormMode } from "../../hooks/react_query/userERPFormMode";
import { useFormMessage } from "../../hooks/useFormMessage";
import { useFormMenuPermissions } from "../../utils/menuAccess";

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildPreviewMessage(pesanText: string, defaultPendoaName: string) {
  return pesanText
    .replace(/<donatur>/gi, "Nama Donatur")
    .replace(/<pendoa>/gi, defaultPendoaName || "-");
}

export default function TRBuletinPage() {
  const queryClient = useQueryClient();
  const formMode = useERPFormMode();
  const { permissions } = useFormMenuPermissions(FORM_IDS.buletin);
  const {
    formError,
    setFormError,
    formSuccess,
    setFormSuccess,
    clearFormMessage,
    clearFormSuccess,
  } = useFormMessage();

  const listQuery = useFetchTRBuletinList();
  const [selectedId, setSelectedId] = useState(0);
  const detailQuery = useFetchTRBuletinById(selectedId);
  const saveMutation = useSaveTRBuletin();
  const deleteMutation = useDeleteTRBuletin();

  const [idBuletin, setIdBuletin] = useState(0);
  const [description, setDescription] = useState("");
  const [pesanText, setPesanText] = useState("");
  const [pathFile, setPathFile] = useState("");
  const [createdDate, setCreatedDate] = useState("");
  const [defaultPendoaName, setDefaultPendoaName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [openFind, setOpenFind] = useState(false);
  const [jenisFind, setJenisFind] = useState<JenisPencarian>("buletin");

  const rows = listQuery.data ?? [];

  useEffect(() => {
    if (!rows.length) {
      if (!formMode.isEditing) {
        setSelectedId(0);
        resetToNewForm();
      }
      return;
    }

    const currentRow = rows.find((item) => item.id_buletin === selectedId);
    if (currentRow) {
      return;
    }

    if (!formMode.isEditing) {
      setSelectedId(rows[0].id_buletin);
    }
  }, [formMode.isEditing, rows, selectedId]);

  useEffect(() => {
    if (!selectedFile) {
      setSelectedFileUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setSelectedFileUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  useEffect(() => {
    if (!detailQuery.data || formMode.isEditing) {
      return;
    }

    applyDetailToForm(detailQuery.data);
  }, [detailQuery.data, formMode.isEditing]);

  const attachmentUrl = useMemo(() => {
    if (selectedFileUrl) return selectedFileUrl;
    if (!pathFile) return "";
    return buildMediaUrl(pathFile);
  }, [pathFile, selectedFileUrl]);

  const previewMessage = useMemo(
    () => buildPreviewMessage(pesanText, defaultPendoaName),
    [defaultPendoaName, pesanText]
  );

  const previewParagraphs = useMemo(
    () => previewMessage.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean),
    [previewMessage]
  );

  function applyDetailToForm(data: TRBuletinItem) {
    setIdBuletin(data.id_buletin ?? 0);
    setDescription(data.description ?? "");
    setPesanText(data.pesanText ?? "");
    setPathFile(data.pathFile ?? "");
    setCreatedDate(data.createdDate ?? "");
    setDefaultPendoaName(data.defaultPendoaName ?? "");
    setSelectedFile(null);
  }

  function resetToNewForm() {
    setIdBuletin(0);
    setDescription("");
    setPesanText("");
    setPathFile("");
    setCreatedDate("");
    setSelectedFile(null);
    setDefaultPendoaName(detailQuery.data?.defaultPendoaName ?? defaultPendoaName);
  }

  async function handleRefresh() {
    clearFormMessage();
    await queryClient.invalidateQueries({ queryKey: ["tr-buletin-list"] });
    await listQuery.refetch();
    await detailQuery.refetch();
  }

  function handleNew() {
    clearFormMessage();
    formMode.toNew();
    setSelectedId(0);
    resetToNewForm();
  }

  function openPopup(searchType: JenisPencarian) {
    setJenisFind(searchType);
    setOpenFind(true);
  }

  function handleSelectedFind(row: FindDataRow) {
    setOpenFind(false);
    clearFormMessage();

    const id = Number(row.id ?? row.code ?? 0);
    if (id <= 0) {
      setFormError("Data buletin tidak valid.");
      return;
    }

    formMode.toView();
    setSelectedId(id);
  }

  function handleEdit() {
    if (idBuletin <= 0) {
      setFormError("Pilih data buletin dulu.");
      return;
    }

    clearFormMessage();
    formMode.toEdit();
  }

  async function handleCancel() {
    clearFormMessage();
    formMode.toView();

    if (selectedId > 0) {
      const result = await detailQuery.refetch();
      if (result.data) {
        applyDetailToForm(result.data);
      }
      return;
    }

    const result = await detailQuery.refetch();
    if (result.data) {
      applyDetailToForm(result.data);
      return;
    }

    resetToNewForm();
  }

  async function handleSave() {
    clearFormMessage();

    if (!pesanText.trim()) {
      setFormError("Pesan text wajib diisi.");
      return;
    }

    if (!description.trim()) {
      setFormError("Description wajib diisi.");
      return;
    }

    if (!selectedFile && !pathFile.trim()) {
      setFormError("Attachment wajib diisi.");
      return;
    }

    const formData = new FormData();
    if (idBuletin > 0) {
      formData.append("id_buletin", String(idBuletin));
    }
    formData.append("description", description);
    formData.append("pesanText", pesanText);
    formData.append("existingPathFile", pathFile);
    if (selectedFile) {
      formData.append("attachmentFile", selectedFile);
    }

    try {
      const response = await saveMutation.mutateAsync(formData);
      const savedId = Number(response.data ?? 0);

      await queryClient.invalidateQueries({ queryKey: ["tr-buletin-list"] });
      await queryClient.invalidateQueries({ queryKey: ["tr-buletin-detail"] });
      await listQuery.refetch();

      setSelectedId(savedId);
      formMode.toView();

      setFormSuccess(response.message || "TR Buletin berhasil disimpan.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan TR Buletin.";
      setFormError(message);
    }
  }

  function handleDeleteClick() {
    clearFormSuccess();

    if (idBuletin <= 0) {
      setFormError("Pilih data buletin dulu.");
      return;
    }

    setShowDeleteConfirm(true);
  }

  async function handleConfirmDelete() {
    try {
      const response = await deleteMutation.mutateAsync(idBuletin);
      setShowDeleteConfirm(false);
      formMode.toView();

      await queryClient.invalidateQueries({ queryKey: ["tr-buletin-list"] });
      await queryClient.invalidateQueries({ queryKey: ["tr-buletin-detail"] });
      const nextList = await listQuery.refetch();
      const nextRows = nextList.data ?? [];

      if (nextRows.length > 0) {
        setSelectedId(nextRows[0].id_buletin);
      } else {
        setSelectedId(0);
        resetToNewForm();
      }

      setFormSuccess(response.message || "TR Buletin berhasil dihapus.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus TR Buletin.";
      setFormError(message);
    }
  }

  if (!permissions.canView) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-base font-semibold text-rose-700">
        Anda tidak memiliki akses untuk membuka form ini.
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-70px)] w-full flex-col bg-slate-50 p-1 md:p-2 lg:p-0">
      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="mb-1 mt-1 shrink-0 p-0">
          <ERPToolbar
            mode={formMode.mode}
            onNew={handleNew}
            onEdit={handleEdit}
            onSave={handleSave}
            onCancel={handleCancel}
            onDelete={handleDeleteClick}
            onRefresh={handleRefresh}
            loadingSave={saveMutation.isPending}
            showNew={permissions.canAdd}
            showEdit={permissions.canEdit}
            showDelete={permissions.canDelete}
            showPrint={false}
            showApprove={false}
            showExport={false}
            disableEdit={idBuletin <= 0}
            disableDelete={idBuletin <= 0}
          />
        </div>

        <StatusBanner tone="error" message={formError} />
        <StatusBanner tone="success" message={formSuccess} />

        <div className="grid min-h-0 flex-1 gap-3 p-2 xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
          <section className="min-h-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-start justify-between gap-4 text-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Form Buletin</h2>
                </div>

                <div className="text-right">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    Created Date
                  </div>
                  <div className="text-sm font-semibold text-slate-700">
                    {formatDateTime(createdDate)}
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      readOnly={formMode.mode === FORM_MODE.VIEW}
                      className="inputtextbox w-full"
                      placeholder="Masukkan description buletin"
                    />
                    <button
                      type="button"
                      className="btnfind"
                      onClick={() => openPopup("buletin")}
                      disabled={saveMutation.isPending || deleteMutation.isPending}
                      title="Find Description"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Pesan Text
                </label>
                <textarea
                  value={pesanText}
                  onChange={(e) => setPesanText(e.target.value)}
                  readOnly={formMode.mode === FORM_MODE.VIEW}
                  className="min-h-[220px] w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 read-only:bg-slate-100"
                  placeholder="Tulis pesan buletin di sini. Placeholder yang tersedia: <donatur> dan <pendoa>."
                />
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Placeholder tersedia: <code>&lt;donatur&gt;</code> dan <code>&lt;pendoa&gt;</code>.
                Preview menggunakan <code>&lt;donatur&gt; = Nama Donatur</code> dan{" "}
                <code>&lt;pendoa&gt;</code> dari Pendoa default.
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  File Attachment
                </label>

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-600 transition hover:border-cyan-400 hover:bg-cyan-50">
                  <Upload className="h-4 w-4" />
                  <span>{selectedFile ? selectedFile.name : "Pilih file attachment"}</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                    disabled={formMode.mode === FORM_MODE.VIEW}
                  />
                </label>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <Paperclip className="h-4 w-4" />
                  <span>{selectedFile?.name || pathFile || "Belum ada file."}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="flex min-h-0 h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex items-center gap-2 text-slate-800">
              <Eye className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Preview Pesan</h2>
            </div>

            <div className="mb-3 flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                Simulasi WhatsApp
              </div>
              <div className="min-h-0 flex-1 overflow-auto rounded-2xl bg-emerald-50 p-4 text-sm leading-7 text-slate-700">
                {previewParagraphs.length > 0 ? (
                  previewParagraphs.map((paragraph, index) => (
                    <p key={`${index}-${paragraph.slice(0, 20)}`} className={index > 0 ? "mt-3" : ""}>
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="text-slate-400">Preview pesan akan muncul di sini.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-semibold text-slate-800">Attachment</div>
              {attachmentUrl ? (
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-700 hover:bg-cyan-100"
                >
                  <Paperclip className="h-4 w-4" />
                  Buka attachment
                </a>
              ) : (
                <div className="text-sm text-slate-400">Belum ada attachment untuk dipreview.</div>
              )}
            </div>
          </section>
        </div>

      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Hapus Buletin"
        message="Yakin mau hapus data buletin ini?"
        confirmLabel="Hapus"
        loading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setShowDeleteConfirm(false)}
      />

      <FindDataPopup
        open={openFind}
        jenisPencarian={jenisFind}
        title="Find Buletin"
        onSelect={handleSelectedFind}
        onClose={() => setOpenFind(false)}
      />
    </div>
  );
}
