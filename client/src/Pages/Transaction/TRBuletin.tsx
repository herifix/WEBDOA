import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, FileText, Paperclip, Search, Trash2, Upload } from "lucide-react";
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
import { getTRBuletinById } from "../../service/trBuletinService";
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

  const attachmentMeta = useMemo(() => {
    const fileName = selectedFile?.name || pathFile.split("/").pop() || "Attachment";
    const extension = fileName.includes(".") ? fileName.split(".").pop()?.toUpperCase() : "FILE";
    const fileSizeMb = selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : "";
    const extraParts = [extension, fileSizeMb].filter(Boolean);

    return {
      fileName,
      extension: extension || "FILE",
      extraText: extraParts.join(" • "),
    };
  }, [pathFile, selectedFile]);

  const attachmentPreviewKind = useMemo(() => {
    const fileName = (selectedFile?.name || pathFile || "").toLowerCase();
    const mimeType = selectedFile?.type?.toLowerCase() || "";

    if (mimeType.includes("pdf") || fileName.endsWith(".pdf")) return "pdf";
    if (mimeType.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp)$/i.test(fileName)) return "image";
    return "file";
  }, [pathFile, selectedFile]);

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
    setSelectedFileUrl("");
    setDefaultPendoaName(detailQuery.data?.defaultPendoaName ?? defaultPendoaName);
  }

  function handleRemoveAttachment() {
    setSelectedFile(null);
    setSelectedFileUrl("");
    setPathFile("");
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
    if (formMode.mode !== FORM_MODE.VIEW) {
      return;
    }

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

    if (!description.trim()) {
      setFormError("Description wajib diisi.");
      return;
    }

    const formData = new FormData();
    if (idBuletin > 0) {
      formData.append("id_buletin", String(idBuletin));
    }
    formData.append("description", description);
    formData.append("pesanText", pesanText);
    
    // Kirim existingPathFile hanya jika ada value (tidak kosong)
    // Jika kosong/null = signal untuk clear attachment
    if (pathFile) {
      formData.append("existingPathFile", pathFile);
    }
    
    if (selectedFile) {
      formData.append("attachmentFile", selectedFile);
    }

    try {
      const response = await saveMutation.mutateAsync(formData);
      const savedId = Number(response.data ?? 0);

      await queryClient.invalidateQueries({ queryKey: ["tr-buletin-list"] });
      await queryClient.invalidateQueries({ queryKey: ["tr-buletin-detail"] });
      await listQuery.refetch();
      const latestDetail = await queryClient.fetchQuery({
        queryKey: ["tr-buletin-detail", savedId],
        queryFn: () => getTRBuletinById(savedId),
      });

      setSelectedId(savedId);
      applyDetailToForm(latestDetail);
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
            showSave
            showCancel
            showDelete={permissions.canDelete}
            showPrint={false}
            showApprove={false}
            showExport={false}
            disableNew={formMode.isEditing}
            disableEdit={formMode.isEditing || idBuletin <= 0}
            disableSave={!formMode.isEditing}
            disableCancel={!formMode.isEditing}
            disableDelete={formMode.isEditing || idBuletin <= 0}
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
                      disabled={
                        formMode.mode !== FORM_MODE.VIEW ||
                        saveMutation.isPending ||
                        deleteMutation.isPending
                      }
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

                <div className="flex gap-2">
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-600 transition hover:border-cyan-400 hover:bg-cyan-50">
                    <Upload className="h-4 w-4" />
                    <span>{selectedFile ? selectedFile.name : "Pilih file attachment"}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                      disabled={formMode.mode === FORM_MODE.VIEW}
                    />
                  </label>

                  {formMode.mode !== FORM_MODE.VIEW && (selectedFile || pathFile) ? (
                    <button
                      type="button"
                      onClick={handleRemoveAttachment}
                      className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-rose-600 transition hover:bg-rose-100"
                      title="Hapus attachment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

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

            <div className="mb-3 flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-800 bg-[#111b21] p-4 shadow-sm">
              <div className="min-h-0 flex-1 overflow-auto rounded-2xl bg-[#0b141a] p-4">
                <div className="mx-auto max-w-[420px]">
                  <div className="rounded-2xl bg-[#202c33] px-4 py-3 text-[15px] leading-7 text-[#e9edef] shadow-[0_12px_24px_rgba(0,0,0,0.25)]">
                    {previewMessage.trim() ? (
                      <div className="whitespace-pre-wrap break-words">
                        {previewMessage}
                      </div>
                    ) : (
                      <p className="text-[#8696a0]">Preview pesan akan muncul di sini.</p>
                    )}
                  </div>

                  <div className="mt-3 overflow-hidden rounded-2xl border border-[#2a3942] bg-[#202c33] shadow-[0_12px_24px_rgba(0,0,0,0.25)]">
                    <div className="border-b border-[#2a3942] bg-[#111b21]">
                      {attachmentUrl ? (
                        attachmentPreviewKind === "pdf" ? (
                          <div className="relative h-[170px] overflow-hidden bg-white">
                            <iframe
                              title="Preview PDF Buletin"
                              src={`${attachmentUrl}#toolbar=0&navpanes=0&scrollbar=0&page=1&view=FitH`}
                              scrolling="no"
                              className="pointer-events-none absolute left-0 top-0 h-[420px] w-full bg-white"
                            />
                          </div>
                        ) : attachmentPreviewKind === "image" ? (
                          <img
                            src={attachmentUrl}
                            alt={attachmentMeta.fileName}
                            className="block h-[170px] w-full object-cover object-top"
                          />
                        ) : (
                          <div className="flex h-[180px] items-center justify-center px-6 py-5 text-center text-sm text-[#8696a0]">
                            Preview file tidak tersedia untuk tipe ini.
                          </div>
                        )
                      ) : (
                        <div className="flex h-[180px] items-center justify-center px-6 py-5 text-center text-sm text-[#8696a0]">
                          Belum ada attachment untuk dipreview.
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-3 px-4 py-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f02849] text-[11px] font-bold text-white">
                        {attachmentMeta.extension}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-2 text-[15px] font-semibold leading-5 text-[#e9edef]">
                          {attachmentMeta.fileName}
                        </div>
                        <div className="mt-1 text-sm text-[#8696a0]">
                          {attachmentMeta.extraText || "Attachment siap dikirim"}
                        </div>
                      </div>
                      <div className="shrink-0 self-end text-xs text-[#8696a0]">9:18 am</div>
                    </div>

                    <div className="border-t border-[#2a3942] bg-[#202c33] px-4 py-2 text-center">
                      {attachmentUrl ? (
                        <a
                          href={attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block text-base font-extrabold tracking-wide !text-white no-underline hover:!text-white/90 visited:!text-white"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="inline-block text-base font-extrabold tracking-wide text-[#c7d1d8]">Download</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
