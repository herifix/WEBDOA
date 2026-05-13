import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Mic, RefreshCcw, Send, Square, Trash2 } from "lucide-react";
import ConfirmDialog from "../../components/ConfirmDialog";
import ERPToolbar from "../../components/ToolbarHR";
import StatusBanner from "../../components/StatusBanner";
import { useFormMessage } from "../../hooks/useFormMessage";
import { useFetchApplicationSetting } from "../../hooks/react_query/useFetchApplicationSetting";
import {
  useFetchTRBirthdayPrayHistoryByDonatur,
  useFetchTRBirthdayPrayByDonatur,
  useSaveTRBirthdayPray,
  useUploadVoiceMp3,
  useSendWhatsAppBirthdayPray,
  useSendTestWhatsAppText,
  useSendTestWhatsAppVoice,
  useFetchPhoneNumbers,
  useFetchTRBirthdayPrayMediaDebugInfo,
} from "../../hooks/react_query/useFetchTRBirthdayPray";
import { FORM_IDS } from "../../config/formIds";
import { buildMediaUrl } from "../../config/appConfig";
import { useFormMenuPermissions } from "../../utils/menuAccess";
import { convertRecordedBlobToMp3File } from "../../utils/audioMp3";

function formatDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return "";

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

function formatShortDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function buildTemplateMessage(
  template: string,
  replacements: {
    donatur: string;
    pendoa: string;
    link: string;
    pesandoa: string;
  }
) {
  return template
    .replace(/<donatur>/gi, replacements.donatur)
    .replace(/<pendoa>/gi, replacements.pendoa)
    .replace(/<link>/gi, replacements.link)
    .replace(/<pesandoa>/gi, replacements.pesandoa);
}

function splitTextWithLinks(value: string) {
  return value.split(/(https?:\/\/[^\s]+)/gi).filter(Boolean);
}

function validateWhatsAppTemplateSend(params: {
  templateName?: string;
  namaPenerima?: string;
  namaPendoa?: string;
  link?: string;
  isiDoa?: string;
}) {
  if (!params.templateName?.trim()) {
    return "Nama template WhatsApp belum diatur.";
  }

  const missingFields: string[] = [];

  if (!params.namaPenerima?.trim()) {
    missingFields.push("nama penerima");
  }

  if (!params.namaPendoa?.trim()) {
    missingFields.push("pendoa");
  }

  if (!params.link?.trim()) {
    missingFields.push("link");
  }

  if (!params.isiDoa?.trim()) {
    missingFields.push("isi doa");
  }

  if (missingFields.length > 0) {
    return `Parameter template WhatsApp belum lengkap. Lengkapi: ${missingFields.join(", ")}.`;
  }

  return "";
}

export default function TRBirthdayPrayPage() {
  const navigate = useNavigate();
  const params = useParams();
  const idDonatur = Number(params.idDonatur ?? 0);
  const currentYear = new Date().getFullYear();

  const {
    formError,
    setFormError,
    formSuccess,
    setFormSuccess,
    clearFormMessage,
  } = useFormMessage();

  const detailQuery = useFetchTRBirthdayPrayByDonatur(idDonatur, currentYear);
  const historyQuery = useFetchTRBirthdayPrayHistoryByDonatur(idDonatur);
  const applicationSettingQuery = useFetchApplicationSetting();
  const { mutateAsync: saveAsync, isPending: isSaving } = useSaveTRBirthdayPray();
  const { mutateAsync: uploadVoiceMp3Async, isPending: isUploadingVoice } = useUploadVoiceMp3();
  const { mutateAsync: sendWAAsync, isPending: isSendingWA } = useSendWhatsAppBirthdayPray();
  const { mutateAsync: sendTestTextAsync, isPending: isSendingTestText } = useSendTestWhatsAppText();
  const { mutateAsync: sendTestVoiceAsync, isPending: isSendingTestVoice } = useSendTestWhatsAppVoice();
  const { mutateAsync: fetchPhoneNumbersAsync, isPending: isFetchingPhones } = useFetchPhoneNumbers();
  const { mutateAsync: fetchMediaDebugInfoAsync, isPending: isFetchingMediaDebug } = useFetchTRBirthdayPrayMediaDebugInfo();
  const { permissions } = useFormMenuPermissions(FORM_IDS.transaksiBirthdayPray);
  const currentUserId = localStorage.getItem("userid") ?? "";

  const [pesan, setPesan] = useState("");
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isEncodingRecording, setIsEncodingRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [saveToAllSameBirthdayDate, setSaveToAllSameBirthdayDate] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    if (!detailQuery.data) return;

    setPesan(detailQuery.data.pesan ?? "");
    setAudioPreviewUrl(
      buildMediaUrl(detailQuery.data.pathPesanSuaraUrl || detailQuery.data.pathPesanSuara || "")
    );
    setSelectedAudioFile(null);
    setIsRecording(false);
    setIsEncodingRecording(false);
    setRecordingStatus("");
    setSaveToAllSameBirthdayDate(true);
  }, [detailQuery.data]);

  useEffect(() => {
    if (!selectedAudioFile) return undefined;

    const objectUrl = URL.createObjectURL(selectedAudioFile);
    setAudioPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedAudioFile]);

  useEffect(() => {
    return () => {
      stopRecordingTracks();
    };
  }, []);

  const pageData = detailQuery.data;

  const audioFileName = useMemo(() => {
    if (selectedAudioFile) return selectedAudioFile.name;
    const originalPath = pageData?.pathPesanSuara ?? "";
    if (!originalPath) return "";

    const parts = originalPath.split("/");
    return parts[parts.length - 1] ?? "";
  }, [pageData?.pathPesanSuara, selectedAudioFile]);

  const previewTemplateMessage = useMemo(() => {
    if (!pageData) return "";

    const template = applicationSettingQuery.data?.msgTemplate ?? "";
    if (!template.trim()) return "";

    return buildTemplateMessage(template, {
      donatur: pageData.namaDonatur || "-",
      pendoa: pageData.namaPendoa || "-",
      link: applicationSettingQuery.data?.msgLink || "",
      pesandoa: pesan.trim(),
    }).trim();
  }, [applicationSettingQuery.data, pageData, pesan]);

  const previewCardImageUrl = useMemo(
    () => buildMediaUrl(applicationSettingQuery.data?.msgImage ?? ""),
    [applicationSettingQuery.data?.msgImage]
  );

  const previewMessage = useMemo(() => {
    const template = applicationSettingQuery.data?.msgTemplate ?? "";
    const hasPesanDoaPlaceholder = /<pesandoa>/i.test(template);
    const sections = [previewTemplateMessage];
    const trimmedPesan = pesan.trim();

    if (trimmedPesan && !hasPesanDoaPlaceholder) {
      sections.push(trimmedPesan);
    }

    return sections.filter(Boolean).join("\n\n");
  }, [applicationSettingQuery.data?.msgTemplate, previewTemplateMessage, pesan]);

  const previewParagraphs = useMemo(
    () => previewMessage.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean),
    [previewMessage]
  );

  const previewTimeLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date()).toLowerCase(),
    []
  );

  const hasUnsavedChanges = useMemo(() => {
    if (!pageData) return false;

    const originalPesan = (pageData.pesan ?? "").trim();
    const currentPesan = pesan.trim();
    const hasNewAudio = selectedAudioFile !== null;

    return originalPesan !== currentPesan || hasNewAudio;
  }, [pageData, pesan, selectedAudioFile]);

  function stopRecordingTracks() {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }

  function handleBackToDashboard() {
    if (hasUnsavedChanges) {
      setShowLeaveConfirm(true);
      return;
    }

    navigate("/dashboard", {
      state: { focusDonaturId: idDonatur, fromTRBirthdayPray: true },
    });
  }

  function clearSelectedAudio() {
    setSelectedAudioFile(null);
    setRecordingStatus("");
    setAudioPreviewUrl(
      buildMediaUrl(pageData?.pathPesanSuaraUrl || pageData?.pathPesanSuara || "")
    );
  }

  function handleAudioFileChange(file: File | null) {
    clearFormMessage();

    if (!file) {
      setSelectedAudioFile(null);
      return;
    }

    const fileName = (file.name || "").toLowerCase();
    if (!fileName.endsWith(".mp3") ) {
      setFormError("File pesan suara harus berformat MP3.");
      return;
    }

    setSelectedAudioFile(file);
    setRecordingStatus("File MP3 siap disimpan.");
  }

  async function handleStartRecording() {
    clearFormMessage();

    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      setFormError("Browser ini belum mendukung perekaman suara.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setFormError("Akses microphone tidak tersedia di browser ini.");
      return;
    }

    try {
      stopRecordingTracks();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream);

      recordedChunksRef.current = [];
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        void processRecordedAudio(recorder.mimeType || "audio/webm");
      };

      recorder.start();
      setIsRecording(true);
      setRecordingStatus("Sedang merekam suara dari microphone...");
    } catch (error) {
      stopRecordingTracks();
      setIsRecording(false);
      setRecordingStatus("");
      setFormError(
        error instanceof Error
          ? `Tidak bisa mulai merekam: ${error.message}`
          : "Tidak bisa mulai merekam suara."
      );
    }
  }

  function handleStopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return;
    }

    setRecordingStatus("Rekaman selesai. Sedang mengubah ke MP3...");
    recorder.stop();
    setIsRecording(false);
  }

  async function processRecordedAudio(mimeType: string) {
    const chunks = recordedChunksRef.current;
    recordedChunksRef.current = [];
    stopRecordingTracks();
    mediaRecorderRef.current = null;

    if (chunks.length === 0) {
      setRecordingStatus("");
      setFormError("Rekaman suara kosong. Silakan coba lagi.");
      return;
    }

    setIsEncodingRecording(true);

    try {
      const recordedBlob = new Blob(chunks, { type: mimeType || "audio/webm" });
      const mp3File = await convertRecordedBlobToMp3File(
        recordedBlob,
        `birthday-pray-${idDonatur || "donatur"}-${Date.now()}.mp3`
      );

      setSelectedAudioFile(mp3File);
      setRecordingStatus("Rekaman berhasil diubah ke MP3 dan siap disimpan.");
      setFormSuccess("Rekaman suara siap disimpan sebagai MP3.");
    } catch (error) {
      setRecordingStatus("");
      setFormError(
        error instanceof Error
          ? `Gagal mengubah rekaman menjadi MP3: ${error.message}`
          : "Gagal mengubah rekaman menjadi MP3."
      );
    } finally {
      setIsEncodingRecording(false);
    }
  }

  async function uploadSelectedAudioFile(file: File) {
    const uploadFormData = new FormData();
    uploadFormData.append("audio", file, file.name);
    return await uploadVoiceMp3Async(uploadFormData);
  }

  if (!permissions.canView) {
    return (
      <div className="flex min-h-full items-center justify-center p-8 text-center text-base font-semibold text-rose-700">
        Anda tidak memiliki akses untuk membuka form ini.
      </div>
    );
  }

  async function handleSave() {
    clearFormMessage();

    if (idDonatur <= 0) {
      setFormError("Data donatur tidak valid.");
      return;
    }

    if (!hasUnsavedChanges) {
      setFormError("Belum ada perubahan data yang perlu disimpan.");
      return;
    }

    const formData = new FormData();
    formData.append("idDonatur", String(idDonatur));

    if (pageData?.id_TRBirthdayPray) {
      formData.append("idTRBirthdayPray", String(pageData.id_TRBirthdayPray));
    }
    
    formData.append("pesan", pesan.trim());

    formData.append(
      "saveToAllSameBirthdayDate",
      String(saveToAllSameBirthdayDate)
    );

    try {
      if (selectedAudioFile) {
        setRecordingStatus("Mengupload file suara MP3 ke server...");
        const uploadResult = await uploadSelectedAudioFile(selectedAudioFile);
        if (!uploadResult?.id) {
          throw new Error("Upload file suara tidak menghasilkan metadata yang valid.");
        }

        formData.append("voiceRecordingId", String(uploadResult.id));
      }

      const result = await saveAsync(formData);

      if (!result?.success) {
        throw new Error(result?.message || "Gagal menyimpan data.");
      }

      const warningText =
        !pesan.trim() ||
        (!selectedAudioFile && !(pageData?.pathPesanSuara ?? "").trim())
          ? " Status dashboard akan Complete jika pesan doa dan pesan suara sudah terisi."
          : "";

      setFormSuccess(
        `${result.message || "Data berhasil disimpan."}${warningText}`
      );
      setRecordingStatus("");
      await detailQuery.refetch();
      await historyQuery.refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menyimpan data.";
      setRecordingStatus("");
      setFormError(message);
    }
  }

  async function handleSendWhatsApp() {
    clearFormMessage();

    if (idDonatur <= 0) {
      setFormError("Data donatur tidak valid.");
      return;
    }

    if (hasUnsavedChanges) {
      setFormError("Silakan simpan perubahan terlebih dahulu sebelum mengirim WhatsApp.");
      return;
    }

    const validationMessage = validateWhatsAppTemplateSend({
      templateName: applicationSettingQuery.data?.whatsappTemplateName,
      namaPenerima: pageData?.namaDonatur,
      namaPendoa: pageData?.namaPendoa,
      link: applicationSettingQuery.data?.msgLink,
      isiDoa: pageData?.pesan,
    });

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    try {
      const result = await sendWAAsync({ idDonatur, year: currentYear });

      if (!result?.success) {
        let friendlyMsg = "Gagal mengirim WhatsApp. ";
        const errMsg = result?.message || "";

        if (errMsg.includes("BadRequest")) {
          friendlyMsg += "Data tidak diterima sistem. Mohon periksa nama Template WA di Pengaturan.";
        } else if (errMsg.includes("401") || errMsg.includes("Unauthorized")) {
          friendlyMsg += "Token API tidak valid atau kadaluarsa.";
        } else {
          friendlyMsg += "Terjadi kesalahan pada koneksi ke Gateway.";
        }
        
        throw new Error(friendlyMsg + (errMsg ? ` (${errMsg})` : ""));
      }

      setFormSuccess(result.message || "Pesan WhatsApp berhasil dikirim.");
      // Refresh data to update IsWASent status
      void detailQuery.refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal mengirim WhatsApp.";
      setFormError(message);
      alert("Error: " + message);
    }
  }

  const handleSendTestText = async () => {
    try {
      clearFormMessage();
      const result = await sendTestTextAsync({ idDonatur, year: currentYear });
      if (result.success) {
        setFormSuccess("Test Teks Berhasil: " + result.message);
      } else {
        setFormError("Test Teks Gagal: " + result.message);
      }
    } catch (error) {
      setFormError("Error Test Teks: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleSendTestVoice = async () => {
    try {
      clearFormMessage();
      const result = await sendTestVoiceAsync({ idDonatur, year: currentYear });
      if (result.success) {
        setFormSuccess("Test Suara Berhasil: " + result.message);
      } else {
        setFormError("Test Suara Gagal: " + result.message);
      }
    } catch (error) {
      setFormError("Error Test Suara: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleGetPhoneNumbers = async () => {
    try {
      clearFormMessage();
      const result = await fetchPhoneNumbersAsync();
      if (result.success) {
        console.log("Phone Numbers Data:", result.data);
        alert("Data Nomor Telepon (cek console untuk detail):\n\n" + JSON.stringify(result.data, null, 2));
      } else {
        alert("Gagal ambil nomor: " + result.message);
      }
    } catch (error) {
      alert("Error: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleGetMediaDebugInfo = async () => {
    try {
      clearFormMessage();
      const result = await fetchMediaDebugInfoAsync({ idDonatur, year: currentYear });
      console.log("TRBirthdayPray Media Debug:", result);
      alert("Debug Voice URL (cek console untuk detail):\n\n" + JSON.stringify(result, null, 2));
    } catch (error) {
      alert("Error Debug Voice URL: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-slate-50 p-2">
      <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <ERPToolbar
          mode="edit"
          onSave={() => {
            void handleSave();
          }}
          onCancel={handleBackToDashboard}
          onRefresh={() => {
            clearFormMessage();
            void detailQuery.refetch();
          }}
          showSave={permissions.canEdit}
          showEdit={false}
          showDelete={false}
          showApprove={false}
          showUnapprove={false}
          showPrint={false}
          showExport={false}
          loadingSave={isSaving || isUploadingVoice || isEncodingRecording}
          customButtons={[
            {
              key: "back-dashboard",
              label: "Back to Dashboard",
              icon: <ArrowLeft className="h-4 w-4" />,
              onClick: handleBackToDashboard,
              className: "bg-slate-700 text-white hover:bg-slate-800",
            },
          ]}
        />

        <StatusBanner tone="error" message={formError} />
        <StatusBanner tone="success" message={formSuccess} />

        {detailQuery.isLoading ? (
          <div className="px-4 py-6 text-sm text-slate-500">Loading...</div>
        ) : detailQuery.isError || !pageData || pageData.id_donatur <= 0 ? (
          <div className="px-4 py-6 text-sm text-red-500">
            Gagal mengambil data transaksi birthday pray.
          </div>
        ) : (
          <div className="grid flex-1 gap-4 p-2 lg:grid-cols-[minmax(0,1fr)_430px]">
            <div className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h2 className="text-base font-semibold text-slate-800">Informasi Donatur</h2>
                  <div className="mt-3 grid grid-cols-[122px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
                    <div className="text-slate-500">Nama Donatur</div>
                    <div className="font-medium text-slate-800">
                      <a
                        href={`/master-donatur?focusDonaturId=${pageData.id_donatur}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-600 underline-offset-4 hover:text-cyan-700 hover:underline"
                      >
                        {pageData.namaDonatur}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    <div className="text-slate-500">Tgl Lahir</div>
                    <div className="font-medium text-slate-800">
                      {formatDate(pageData.tglLahir)}
                    </div>

                    <div className="text-slate-500">Ulang Tahun Tahun Ini</div>
                    <div className="font-medium text-slate-800">
                      {formatDate(pageData.birthdayDate)}
                    </div>

                    <div className="text-slate-500">No HP Donatur</div>
                    <div className="font-medium text-slate-800">{pageData.noHPDonatur}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h2 className="text-base font-semibold text-slate-800">Pesan Doa</h2>
                  <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="checkboxclass"
                      checked={saveToAllSameBirthdayDate}
                      onChange={(e) =>
                        setSaveToAllSameBirthdayDate(e.target.checked)
                      }
                    />
                    <span>
                      Pesan Doa untuk seluruh {formatShortDate(pageData.birthdayDate)}
                    </span>
                  </label>
                  <textarea
                    value={pesan}
                    onChange={(e) => setPesan(e.target.value)}
                    className="mt-3 min-h-[230px] w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                    placeholder="Tulis pesan doa ulang tahun..."
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-800">Preview Pesan WhatsApp</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Template diambil dari `Application Setting` dan placeholder akan diganti otomatis.
                    </p>
                  </div>
                  {applicationSettingQuery.data?.msgLink ? (
                    <a
                      href={applicationSettingQuery.data.msgLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      Buka Link
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => {
                      void handleSendWhatsApp();
                    }}
                    disabled={isSendingWA || !pageData || pageData.id_donatur <= 0}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      pageData.isWASent
                        ? "bg-amber-500 shadow-amber-200 hover:bg-amber-600 hover:shadow-amber-300"
                        : "bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700 hover:shadow-emerald-300"
                    }`}
                  >
                    {isSendingWA ? (
                      <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                    ) : pageData.isWASent ? (
                      <RefreshCcw className="h-3.5 w-3.5" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    {pageData.isWASent ? "Resend to WhatsApp" : "Send to WhatsApp"}
                  </button>

                  {currentUserId === "1" && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSendTestText()}
                        disabled={isSendingTestText || !pageData || pageData.id_donatur <= 0}
                        className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60"
                        title="Test Kirim Teks Saja (User 1 Only)"
                      >
                        {isSendingTestText ? <RefreshCcw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                        Test Text
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSendTestVoice()}
                        disabled={isSendingTestVoice || !pageData || pageData.id_donatur <= 0 || !pageData.pathPesanSuara}
                        className="inline-flex items-center gap-2 rounded-full bg-fuchsia-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-fuchsia-200 transition hover:bg-fuchsia-700 disabled:opacity-60"
                        title="Test Kirim Suara Saja (User 1 Only)"
                      >
                        {isSendingTestVoice ? <RefreshCcw className="h-3 w-3 animate-spin" /> : <Mic className="h-3 w-3" />}
                        Test Voice
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleGetPhoneNumbers()}
                        disabled={isFetchingPhones}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-700 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 disabled:opacity-60"
                        title="Ambil Data Phone Numbers (User 1 Only)"
                      >
                        {isFetchingPhones ? <RefreshCcw className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
                        Get Phones
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleGetMediaDebugInfo()}
                        disabled={isFetchingMediaDebug || !pageData || pageData.id_donatur <= 0}
                        className="inline-flex items-center gap-2 rounded-full bg-cyan-700 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-cyan-200 transition hover:bg-cyan-800 disabled:opacity-60"
                        title="Lihat URL final file suara (User 1 Only)"
                      >
                        {isFetchingMediaDebug ? <RefreshCcw className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
                        Debug Voice URL
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 overflow-hidden rounded-[28px] border border-slate-900/80 bg-[#0b141a] shadow-[0_22px_60px_rgba(15,23,42,0.25)]">
                  <div className="bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_35%),linear-gradient(180deg,#0b141a,#111b21)] px-5 py-5">
                    <div className="mx-auto max-w-[880px] rounded-[22px] rounded-tr-md bg-[#005c4b] px-4 py-4 text-white shadow-[0_12px_30px_rgba(0,0,0,0.25)]">
                      <div className="mb-4 text-lg font-bold text-[#f6c56f]">
                        Gema Kasih Yobel
                      </div>

                      <div className="rounded-[18px] bg-[#1f2c34] p-3 shadow-inner">
                        <div className="flex gap-4">
                          {previewCardImageUrl ? (
                            <img
                              src={previewCardImageUrl}
                              alt="Preview pesan"
                              className="h-[96px] w-[96px] shrink-0 rounded-2xl object-cover"
                            />
                          ) : (
                            <div className="flex h-[96px] w-[96px] shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(160deg,#ef4444,#f59e0b)] text-center text-[11px] font-black uppercase tracking-[0.24em] text-white">
                              Birthday
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="text-xl font-bold text-white">
                              Happy Birthday dari Gema Kasih Yobel
                            </div>
                            <div className="mt-2 text-sm font-medium leading-6 text-slate-200">
                              Ucapan syukur dan doa ulang tahun dari rekan-rekan pendoa.
                            </div>
                            <div className="mt-2 truncate text-sm font-semibold text-slate-400">
                              {applicationSettingQuery.data?.msgLink || "Link belum diatur"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {applicationSettingQuery.isLoading ? (
                        <div className="pt-4 text-sm text-emerald-100/80">Memuat template preview...</div>
                      ) : previewParagraphs.length > 0 ? (
                        <div className="space-y-5 pt-4 text-[15px] leading-8 text-white">
                          {previewParagraphs.map((paragraph, paragraphIndex) => (
                            <p key={`${paragraphIndex}-${paragraph.slice(0, 24)}`} className="whitespace-pre-wrap wrap-break-word">
                              {splitTextWithLinks(paragraph).map((part, partIndex) => {
                                if (/^https?:\/\//i.test(part)) {
                                  return (
                                    <a
                                      key={`${paragraphIndex}-${partIndex}`}
                                      href={part}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="font-semibold text-[#53ddec] underline underline-offset-4"
                                    >
                                      {part}
                                    </a>
                                  );
                                }

                                return <span key={`${paragraphIndex}-${partIndex}`}>{part}</span>;
                              })}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <div className="pt-4 text-sm text-emerald-100/80">
                          Template pesan belum tersedia. Silakan isi di menu Application Setting.
                        </div>
                      )}

                      <div className="mt-5 flex items-end justify-end gap-2 text-[11px] font-semibold text-emerald-100/70">
                        <span>{previewTimeLabel}</span>
                        <span className="text-[#7fd3c5]">✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-base font-semibold text-slate-800">Pendoa Default</h2>
                <div className="mt-3 grid grid-cols-[120px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
                  <div className="text-slate-500">Nama</div>
                  <div className="font-medium text-slate-800">{pageData.namaPendoa}</div>

                  <div className="text-slate-500">No HP</div>
                  <div className="font-medium text-slate-800">{pageData.noHPPendoa}</div>

                  <div className="text-slate-500">Created</div>
                  <div className="font-medium text-slate-800">
                    {formatDateTime(pageData.createdDate)}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h2 className="text-base font-semibold text-slate-800">Pesan Suara</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => void handleStartRecording()}
                    disabled={isRecording || isEncodingRecording || isUploadingVoice}
                  >
                    <Mic className="h-3.5 w-3.5" />
                    {isRecording ? "Sedang Rekam..." : "Mulai Rekam"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={handleStopRecording}
                    disabled={!isRecording}
                  >
                    <Square className="h-3.5 w-3.5" />
                    Stop Rekam
                  </button>
                </div>

                {recordingStatus ? (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    {recordingStatus}
                  </div>
                ) : null}

                <input
                  type="file"
                  accept=".mp3,audio/mpeg"
                  className="mt-3 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-cyan-700"
                  disabled={isRecording || isEncodingRecording || isUploadingVoice}
                  onChange={(e) => handleAudioFileChange(e.target.files?.[0] ?? null)}
                />

                <div className="mt-3 flex flex-nowrap gap-2">
                  <button
                    type="button"
                    className="inline-flex shrink-0 items-center gap-1 rounded bg-slate-500 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={clearSelectedAudio}
                    disabled={!selectedAudioFile || isRecording || isEncodingRecording || isUploadingVoice}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                  </button>
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  Rekaman browser akan diubah dulu menjadi MP3 sebelum disimpan. Upload manual juga hanya menerima file MP3 maksimal 10 MB.
                </div>

                {audioFileName ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    <div>
                      File: <span className="font-medium text-slate-800">{audioFileName}</span>
                    </div>
                    {selectedAudioFile ? (
                      <div className="mt-1 text-xs text-slate-500">
                        Status: belum disimpan ke transaksi. File MP3 akan diupload saat tombol Save ditekan.
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
                    Belum ada file suara.
                  </div>
                )}

                {audioPreviewUrl ? (
                  <div className="mt-3 space-y-2">
                    <audio className="w-full" controls src={audioPreviewUrl}>
                      Browser tidak mendukung audio playback.
                    </audio>

                    <a
                      href={audioPreviewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded bg-cyan-600 px-3 py-1 text-xs font-semibold text-white hover:bg-cyan-700"
                    >
                      Buka URL File Suara
                    </a>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h2 className="text-base font-semibold text-slate-800">Histori Birthday Pray</h2>

                {historyQuery.isLoading ? (
                  <div className="mt-3 text-sm text-slate-500">Loading histori...</div>
                ) : !historyQuery.data || historyQuery.data.length === 0 ? (
                  <div className="mt-3 rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
                    Belum ada histori birthday pray untuk donatur ini.
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {historyQuery.data.map((item) => {
                      const historyAudioUrl = buildMediaUrl(
                        item.pathPesanSuaraUrl || item.pathPesanSuara || ""
                      );

                      return (
                        <div
                          key={item.id_TRBirthdayPray}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-800">
                                {formatDate(item.birthdayDate)}
                              </div>
                              <div className="text-xs text-slate-500">
                                Pendoa: {item.namaPendoa || "-"}
                              </div>
                              <div className="text-xs text-slate-500">
                                Dibuat: {formatDateTime(item.createdDate)}
                              </div>
                            </div>

                            <div className="text-xs font-medium text-slate-500">
                              ID #{item.id_TRBirthdayPray}
                            </div>
                          </div>

                          <div className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
                            {item.pesan || "-"}
                          </div>

                          {historyAudioUrl ? (
                            <div className="mt-3 space-y-2">
                              <audio className="w-full" controls src={historyAudioUrl}>
                                Browser tidak mendukung audio playback.
                              </audio>

                              <a
                                href={historyAudioUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex rounded bg-cyan-600 px-3 py-1 text-xs font-semibold text-white hover:bg-cyan-700"
                              >
                                Buka File Suara
                              </a>
                            </div>
                          ) : (
                            <div className="mt-3 text-xs text-slate-500">
                              Tidak ada file suara.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showLeaveConfirm}
        title="Perubahan Belum Disimpan"
        message="Masih ada data yang belum disimpan. Tetap kembali ke dashboard?"
        confirmLabel="Ya, Kembali"
        confirmClassName="bg-amber-600 hover:bg-amber-700"
        onConfirm={() => {
          setShowLeaveConfirm(false);
          navigate("/dashboard", {
            state: { focusDonaturId: idDonatur, fromTRBirthdayPray: true },
          });
        }}
        onClose={() => setShowLeaveConfirm(false)}
      />
    </div>
  );
}
