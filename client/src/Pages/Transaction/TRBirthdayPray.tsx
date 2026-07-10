import { useEffect, useMemo, useRef, useState } from "react";
import type { ClipboardEvent as ReactClipboardEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, ExternalLink, Mic, RefreshCcw, Send, Square, Trash2 } from "lucide-react";
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
  useDebugSendWhatsAppBirthdayPray,
  useSendTestWhatsAppText,
  useSendTestWhatsAppVoice,
  useFetchPhoneNumbers,
  useFetchTRBirthdayPrayMediaDebugInfo,
  useFetchTRBirthdayPrayWhatsAppDeliveryStatus,
} from "../../hooks/react_query/useFetchTRBirthdayPray";
import { FORM_IDS } from "../../config/formIds";
import { buildMediaUrl } from "../../config/appConfig";
import { useFormMenuPermissions } from "../../utils/menuAccess";
import { convertRecordedBlobToMp3File } from "../../utils/audioMp3";
import type {
  TRBirthdayPrayDebugSendResponse,
  TRBirthdayPrayDebugSendStage,
  TRBirthdayPrayWhatsAppDeliveryStatusResponse,
} from "../../Model/ModelTRBirthdayPray";

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

function formatWhatsAppStatusDebug(result: TRBirthdayPrayWhatsAppDeliveryStatusResponse) {
  const debug = result.data?.debug;
  if (!debug) return "";

  const fallback = debug.usedReplyFallback
    ? `, fallback=${debug.replyFallbackReason || "reply setelah send"}`
    : "";

  return ` Debug: path=${debug.messageArrayPath || "-"}, raw=${debug.rawMessageCount}, outbound=${debug.parsedOutboundCount}, inbound=${debug.parsedInboundCount}${fallback}.`;
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

const MAX_WHATSAPP_PREVIEW_LENGTH = 1024;
const MAX_CONSECUTIVE_SPACES = 4;
const PESAN_DOA_LIMIT_MARKER = "\u0000PESAN_DOA_INPUT\u0000";
const HIDDEN_CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/;
const FIVE_SPACES_PATTERN = / {5,}/;

type PreviewMessageReplacements = {
  donatur: string;
  pendoa: string;
  link: string;
};

type PhoneNumbersResultState = Readonly<{
  success: boolean;
  message: string;
  rawJson: string;
}>;

function buildBirthdayPreviewMessage(
  template: string,
  replacements: PreviewMessageReplacements,
  pesanDoa: string
) {
  const hasPesanDoaPlaceholder = /<pesandoa>/i.test(template);
  const templateMessage = template.trim()
    ? buildTemplateMessage(template, {
        ...replacements,
        pesandoa: pesanDoa,
      }).trim()
    : "";
  const sections = [templateMessage];
  const trimmedPesan = pesanDoa.trim();

  if (trimmedPesan && !hasPesanDoaPlaceholder) {
    sections.push(trimmedPesan);
  }

  return sections.filter(Boolean).join("\n\n");
}

function countOccurrences(value: string, search: string) {
  if (!search) return 0;

  return value.split(search).length - 1;
}

function calculateMaxPesanDoaLength(
  template: string,
  replacements: PreviewMessageReplacements
) {
  const previewWithMarker = buildBirthdayPreviewMessage(
    template,
    replacements,
    PESAN_DOA_LIMIT_MARKER
  );
  const markerCount = countOccurrences(previewWithMarker, PESAN_DOA_LIMIT_MARKER);

  if (markerCount <= 0) {
    return Math.max(0, MAX_WHATSAPP_PREVIEW_LENGTH - previewWithMarker.length);
  }

  const fixedPreviewLength =
    previewWithMarker.length - PESAN_DOA_LIMIT_MARKER.length * markerCount;
  return Math.max(
    0,
    Math.floor((MAX_WHATSAPP_PREVIEW_LENGTH - fixedPreviewLength) / markerCount)
  );
}

function validateWhatsAppTextFormat(value: string, label = "Pesan Doa") {
  if (/[\r\n]/.test(value)) {
    return `Enter tidak diperbolehkan pada ${label}.`;
  }

  if (/\t/.test(value)) {
    return `Tab tidak diperbolehkan pada ${label}.`;
  }

  if (HIDDEN_CONTROL_CHAR_PATTERN.test(value)) {
    return `Karakter kontrol tersembunyi tidak diperbolehkan pada ${label}.`;
  }

  if (FIVE_SPACES_PATTERN.test(value)) {
    return `Maksimal ${MAX_CONSECUTIVE_SPACES} spasi berurutan pada ${label}.`;
  }

  return "";
}

function splitTextWithLinks(value: string) {
  return value.split(/(https?:\/\/[^\s]+)/gi).filter(Boolean);
}

const SUPPORTED_PRAYER_MEDIA_EXTENSIONS = new Set(["mp3", "mp4"]);

function getBirthdayPrayMediaExtension(value?: string | null) {
  if (!value) return "";

  const withoutSuffix = value.trim().split(/[?#]/)[0] ?? "";
  const fileName = withoutSuffix.split(/[\\/]/).pop() ?? withoutSuffix;
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);

  return match?.[1] ?? "";
}

function isSupportedBirthdayPrayMediaFile(fileName: string) {
  return SUPPORTED_PRAYER_MEDIA_EXTENSIONS.has(getBirthdayPrayMediaExtension(fileName));
}

function getBirthdayPrayMediaKind(sourceHint?: string | null) {
  return getBirthdayPrayMediaExtension(sourceHint) === "mp4" ? "video" : "audio";
}

function BirthdayPrayMediaPreview({
  src,
  sourceHint,
}: {
  src: string;
  sourceHint?: string | null;
}) {
  if (getBirthdayPrayMediaKind(sourceHint || src) === "video") {
    return (
      <video className="max-h-72 w-full rounded-lg bg-black" controls preload="metadata" src={src}>
        Browser tidak mendukung video playback.
      </video>
    );
  }

  return (
    <audio className="w-full" controls preload="metadata" src={src}>
      Browser tidak mendukung audio playback.
    </audio>
  );
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

  if (!params.isiDoa?.trim()) {
    missingFields.push("isi doa");
  }

  if (missingFields.length > 0) {
    return `Parameter template WhatsApp belum lengkap. Lengkapi: ${missingFields.join(", ")}.`;
  }

  const textValidation =
    validateWhatsAppTextFormat(params.namaPenerima ?? "", "Nama penerima") ||
    validateWhatsAppTextFormat(params.namaPendoa ?? "", "Pendoa") ||
    validateWhatsAppTextFormat(params.link ?? "", "Link") ||
    validateWhatsAppTextFormat(params.isiDoa ?? "", "Pesan Doa");

  if (textValidation) {
    return textValidation;
  }

  return "";
}

function buildWhatsAppSendErrorMessage(rawMessage?: string | null) {
  const errMsg = rawMessage?.trim() ?? "";
  if (!errMsg) {
    return "Gagal mengirim WhatsApp. Gateway tidak mengembalikan detail error.";
  }

  const normalizedMessage = errMsg.toLowerCase();

  if (
    normalizedMessage.includes("133010") ||
    normalizedMessage.includes("phonenotregistered") ||
    normalizedMessage.includes("account not registered") ||
    normalizedMessage.includes("nomor whatsapp bisnis pengirim") ||
    normalizedMessage.includes("nomor telepon tidak terdaftar")
  ) {
    return `Gagal mengirim WhatsApp. Nomor WhatsApp bisnis pengirim di gateway/Meta belum terdaftar atau belum sinkron. Ini bukan indikasi bahwa nomor donatur penerima salah. Detail gateway: ${errMsg}`;
  }

  if (normalizedMessage.includes("401") || normalizedMessage.includes("unauthorized")) {
    return `Gagal mengirim WhatsApp. Token API gateway tidak valid atau sudah kedaluwarsa. Detail gateway: ${errMsg}`;
  }

  if (
    normalizedMessage.includes("template whatsapp tidak ditemukan") ||
    normalizedMessage.includes("template tidak ditemukan") ||
    normalizedMessage.includes("belum disetujui") ||
    normalizedMessage.includes("parameter template tidak cocok")
  ) {
    return `Gagal mengirim WhatsApp. Template WA di gateway belum cocok atau belum siap dipakai. Periksa nama template, status approval, dan parameter template di Pengaturan. Detail gateway: ${errMsg}`;
  }

  if (normalizedMessage.includes("badrequest")) {
    return `Gagal mengirim WhatsApp. Data ditolak oleh gateway. Detail gateway: ${errMsg}`;
  }

  return `Gagal mengirim WhatsApp. ${errMsg}`;
}

function formatDebugJson(value: unknown) {
  if (value == null || value === "") {
    return "-";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
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
  const { mutateAsync: debugSendWAAsync, isPending: isDebugSendingWA } = useDebugSendWhatsAppBirthdayPray();
  const { mutateAsync: sendTestTextAsync, isPending: isSendingTestText } = useSendTestWhatsAppText();
  const { mutateAsync: sendTestVoiceAsync, isPending: isSendingTestVoice } = useSendTestWhatsAppVoice();
  const { mutateAsync: fetchPhoneNumbersAsync, isPending: isFetchingPhones } = useFetchPhoneNumbers();
  const { mutateAsync: fetchMediaDebugInfoAsync, isPending: isFetchingMediaDebug } = useFetchTRBirthdayPrayMediaDebugInfo();
  const {
    mutateAsync: fetchWhatsAppStatusAsync,
    isPending: isCheckingWhatsAppStatus,
  } = useFetchTRBirthdayPrayWhatsAppDeliveryStatus();
  const { permissions } = useFormMenuPermissions(FORM_IDS.transaksiBirthdayPray);
  const currentUserId = localStorage.getItem("userid") ?? "";
  const isAdminDebugUser = currentUserId === "1";

  const [pesan, setPesan] = useState("");
  const [pesanDoaInputMessage, setPesanDoaInputMessage] = useState("");
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isEncodingRecording, setIsEncodingRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [saveToAllSameBirthdayDate, setSaveToAllSameBirthdayDate] = useState(true);
  const [debugSendMode, setDebugSendMode] = useState<"dry_run" | "live">("dry_run");
  const [debugSendResult, setDebugSendResult] = useState<TRBirthdayPrayDebugSendResponse | null>(null);
  const [phoneNumbersResult, setPhoneNumbersResult] = useState<PhoneNumbersResultState | null>(null);
  const [showDebugSendConfirm, setShowDebugSendConfirm] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    if (!detailQuery.data) return;

    setPesan(detailQuery.data.pesan ?? "");
    setPesanDoaInputMessage("");
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

  const effectivePreviewLink = useMemo(
    () => buildMediaUrl(pageData?.pathPesanSuaraUrl || pageData?.pathPesanSuara || ""),
    [pageData?.pathPesanSuaraUrl, pageData?.pathPesanSuara]
  );

  const previewMessageTemplate = applicationSettingQuery.data?.msgTemplate ?? "";
  const previewMessageReplacements = useMemo<PreviewMessageReplacements>(
    () => ({
      donatur: pageData?.namaDonatur || "-",
      pendoa: pageData?.namaPendoa || "-",
      link: "",
    }),
    [pageData?.namaDonatur, pageData?.namaPendoa]
  );

  const previewCardImageUrl = useMemo(
    () => buildMediaUrl(applicationSettingQuery.data?.msgImage ?? ""),
    [applicationSettingQuery.data?.msgImage]
  );

  const previewMessage = useMemo(() => {
    if (!pageData) return "";

    return buildBirthdayPreviewMessage(
      previewMessageTemplate,
      previewMessageReplacements,
      pesan.trim()
    );
  }, [pageData, pesan, previewMessageReplacements, previewMessageTemplate]);

  const maxPesanDoaLength = useMemo(
    () => calculateMaxPesanDoaLength(previewMessageTemplate, previewMessageReplacements),
    [previewMessageReplacements, previewMessageTemplate]
  );
  const pesanDoaFormatMessage = useMemo(
    () => validateWhatsAppTextFormat(pesan),
    [pesan]
  );
  const isPesanDoaOverLimit = pesan.length > maxPesanDoaLength;

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

  const savedVoiceAvailable = Boolean(
    (pageData?.pathPesanSuara ?? "").trim() || (pageData?.pathPesanSuaraUrl ?? "").trim()
  );
  const savedPrayerTextAvailable = Boolean((pageData?.pesan ?? "").trim());
  const isWhatsAppReady = Boolean(
    pageData &&
    pageData.id_donatur > 0 &&
    savedVoiceAvailable &&
    savedPrayerTextAvailable &&
    !hasUnsavedChanges
  );

  const debugStageCards = useMemo(
    () =>
      debugSendResult?.data
        ? [
            {
              key: "main-template",
              title: "Main Template",
              stage: debugSendResult.data.mainTemplate,
            },
            {
              key: "follow-up-voice",
              title: "Follow-up Voice",
              stage: debugSendResult.data.followUpVoiceTemplate,
            },
          ]
        : [],
    [debugSendResult]
  );

  function getWhatsAppSendValidationMessage() {
    if (idDonatur <= 0) {
      return "Data donatur tidak valid.";
    }

    if (hasUnsavedChanges) {
      return "Silakan simpan perubahan terlebih dahulu sebelum mengirim WhatsApp.";
    }

    if (!effectivePreviewLink.trim()) {
      return "Rekaman audio belum tersedia. Simpan pesan suara terlebih dahulu sebelum mengirim WhatsApp.";
    }

    if (isPesanDoaOverLimit) {
      return `Pesan Doa terlalu panjang (${pesan.length}/${maxPesanDoaLength}). Kurangi teks sebelum kirim WhatsApp.`;
    }

    return validateWhatsAppTemplateSend({
      templateName: applicationSettingQuery.data?.whatsappTemplateName,
      namaPenerima: pageData?.namaDonatur,
      namaPendoa: pageData?.namaPendoa,
      link: effectivePreviewLink,
      isiDoa: pageData?.pesan,
    });
  }

  function renderDebugStageCard(title: string, stage: TRBirthdayPrayDebugSendStage) {
    const toneClass = stage.success
      ? "border-emerald-200 bg-emerald-50"
      : stage.skipped
        ? "border-amber-200 bg-amber-50"
        : "border-rose-200 bg-rose-50";

    return (
      <div key={`${stage.stageName}-${title}`} className={`rounded-2xl border p-4 ${toneClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-800">{title}</div>
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide">
            <span className="rounded-full bg-white/80 px-2 py-1 text-slate-700">
              {stage.success ? "success" : "failed"}
            </span>
            {stage.skipped ? (
              <span className="rounded-full bg-white/80 px-2 py-1 text-amber-700">
                skipped
              </span>
            ) : null}
            {stage.statusCode ? (
              <span className="rounded-full bg-white/80 px-2 py-1 text-slate-700">
                HTTP {stage.statusCode}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
          <div>
            <span className="font-semibold text-slate-700">Template:</span>{" "}
            {stage.templateName || "-"}
          </div>
          <div>
            <span className="font-semibold text-slate-700">Language:</span>{" "}
            {stage.languageCode || "-"}
          </div>
          <div>
            <span className="font-semibold text-slate-700">Attempted:</span>{" "}
            {stage.attempted ? "Ya" : "Tidak"}
          </div>
          <div>
            <span className="font-semibold text-slate-700">Skip Reason:</span>{" "}
            {stage.skippedReason || "-"}
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-sm text-slate-700">
          {stage.message || "-"}
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Payload Summary
            </div>
            <pre className="max-h-64 overflow-auto rounded-xl bg-slate-950 px-3 py-3 text-[11px] leading-5 text-slate-100">
              {formatDebugJson(stage.payloadSummary)}
            </pre>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Gateway Response
            </div>
            <pre className="max-h-64 overflow-auto rounded-xl bg-slate-950 px-3 py-3 text-[11px] leading-5 text-slate-100">
              {formatDebugJson(stage.gatewayResponse)}
            </pre>
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Raw Response Body
          </div>
          <pre className="max-h-56 overflow-auto rounded-xl bg-slate-900 px-3 py-3 text-[11px] leading-5 text-slate-100">
            {stage.responseBody || "-"}
          </pre>
        </div>
      </div>
    );
  }

  function handlePesanChange(value: string) {
    const formatMessage = validateWhatsAppTextFormat(value);
    if (formatMessage) {
      setPesanDoaInputMessage(formatMessage);
      return;
    }

    const nextValue =
      value.length > maxPesanDoaLength
        ? value.slice(0, maxPesanDoaLength)
        : value;

    setPesan(nextValue);
    setPesanDoaInputMessage(
      value.length > maxPesanDoaLength
        ? "Pesan Doa dipotong sampai batas maksimal."
        : ""
    );
  }

  function handlePesanKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      setPesanDoaInputMessage("Enter tidak diperbolehkan pada Pesan Doa.");
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      setPesanDoaInputMessage("Tab tidak diperbolehkan pada Pesan Doa.");
    }
  }

  function handlePesanPaste(event: ReactClipboardEvent<HTMLTextAreaElement>) {
    const pastedText = event.clipboardData.getData("text");
    const target = event.currentTarget;
    const nextValue =
      pesan.slice(0, target.selectionStart) +
      pastedText +
      pesan.slice(target.selectionEnd);
    const formatMessage = validateWhatsAppTextFormat(nextValue);

    if (!formatMessage) {
      return;
    }

    event.preventDefault();
    setPesanDoaInputMessage(formatMessage);
  }

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

    const fileExtension = getBirthdayPrayMediaExtension(file.name);
    if (!isSupportedBirthdayPrayMediaFile(file.name)) {
      setFormError("File pesan suara harus berformat MP3 atau MP4.");
      return;
    }

    setSelectedAudioFile(file);
    setRecordingStatus(`File ${fileExtension.toUpperCase()} siap disimpan.`);
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

    if (pesanDoaFormatMessage) {
      setFormError(pesanDoaFormatMessage);
      return;
    }

    if (isPesanDoaOverLimit) {
      setFormError(
        `Pesan Doa terlalu panjang (${pesan.length}/${maxPesanDoaLength}). Kurangi teks sebelum disimpan.`
      );
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
        setRecordingStatus("Mengupload file suara MP3/MP4 ke server...");
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

      setFormSuccess(result.message || "Data berhasil disimpan.");
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
    const validationMessage = getWhatsAppSendValidationMessage();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    try {
      const result = await sendWAAsync({ idDonatur, year: currentYear });

      if (!result?.success) {
        throw new Error(buildWhatsAppSendErrorMessage(result.message));
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

  async function runDebugSendWhatsApp(runLive: boolean) {
    clearFormMessage();
    const validationMessage = getWhatsAppSendValidationMessage();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setDebugSendResult(null);

    try {
      const result = await debugSendWAAsync({
        idDonatur,
        year: currentYear,
        runLive,
        includeFollowUpVoice: true,
      });

      setDebugSendResult(result);

      if (result.success) {
        const successLabel = runLive ? "Debug send live selesai." : "Debug send simulasi selesai.";
        setFormSuccess(`${successLabel} ${result.data?.finalSummary || result.message || ""}`.trim());
      } else {
        setFormError(result.message || "Debug send WhatsApp gagal.");
      }

      void detailQuery.refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Debug send WhatsApp gagal dijalankan.";
      setFormError(message);
    }
  }

  function handleDebugSendWhatsApp() {
    clearFormMessage();
    const validationMessage = getWhatsAppSendValidationMessage();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    if (debugSendMode === "live") {
      setShowDebugSendConfirm(true);
      return;
    }

    void runDebugSendWhatsApp(false);
  }

  const handleSendTestText = async () => {
    try {
      clearFormMessage();
      const formatMessage = validateWhatsAppTextFormat(pesan, "Pesan Doa");
      if (formatMessage) {
        setFormError(formatMessage);
        return;
      }

      const result = await sendTestTextAsync({
        idDonatur,
        year: currentYear,
        messageText: pesan.trim(),
      });
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
      const rawJson = formatDebugJson(result.data);
      setPhoneNumbersResult({
        success: Boolean(result.success),
        message: result.message || "",
        rawJson,
      });

      if (result.success) {
        setFormSuccess("Data phone numbers berhasil diambil.");
      } else {
        setFormError("Gagal ambil nomor: " + (result.message || "Gateway tidak mengembalikan data nomor."));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPhoneNumbersResult({
        success: false,
        message,
        rawJson: "-",
      });
      setFormError("Error Get Phones: " + message);
    }
  };

  const handleCopyPhoneNumbersResult = async () => {
    if (!phoneNumbersResult || !phoneNumbersResult.rawJson || phoneNumbersResult.rawJson === "-") {
      setFormError("Belum ada hasil Get Phones yang bisa dicopy.");
      return;
    }

    try {
      if (typeof navigator === "undefined" || typeof navigator.clipboard?.writeText !== "function") {
        throw new Error("Clipboard browser tidak tersedia.");
      }

      await navigator.clipboard.writeText(phoneNumbersResult.rawJson);
      setFormSuccess("Hasil Get Phones berhasil dicopy.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setFormError("Gagal copy hasil Get Phones: " + message);
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

  const handleCheckWhatsAppStatus = async () => {
    try {
      clearFormMessage();
      const result = await fetchWhatsAppStatusAsync({ idDonatur, year: currentYear, debug: true });
      console.log("TRBirthdayPray WhatsApp Status:", result);

      if (result.success) {
        setFormSuccess((result.message || "Status WhatsApp berhasil dicek.") + formatWhatsAppStatusDebug(result));
      } else {
        setFormError("Cek status WA gagal: " + (result.message || "Gateway tidak mengembalikan status."));
      }
    } catch (error) {
      setFormError("Error Cek Status WA: " + (error instanceof Error ? error.message : String(error)));
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
                    onChange={(e) => handlePesanChange(e.target.value)}
                    onKeyDown={handlePesanKeyDown}
                    onPaste={handlePesanPaste}
                    maxLength={maxPesanDoaLength}
                    className="mt-3 min-h-[230px] w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                    placeholder="Tulis pesan doa ulang tahun..."
                  />
                  <div className="mt-2 flex items-start justify-between gap-3 text-xs">
                    <div className="min-h-4 flex-1 font-medium text-rose-600">
                      {pesanDoaInputMessage}
                    </div>
                    <div
                      className={
                        isPesanDoaOverLimit
                          ? "font-semibold text-rose-600"
                          : pesan.length >= maxPesanDoaLength
                            ? "font-semibold text-amber-600"
                            : "text-slate-500"
                      }
                    >
                      {pesan.length}/{maxPesanDoaLength}
                    </div>
                  </div>
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
                  {effectivePreviewLink ? (
                    <a
                      href={effectivePreviewLink}
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
                    disabled={isSendingWA || !isWhatsAppReady}
                    title={
                      isWhatsAppReady
                        ? "Kirim WhatsApp"
                        : "Lengkapi dan simpan Pesan Doa serta Pesan Suara terlebih dahulu."
                    }
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

                  {isAdminDebugUser && (
                    <div className="flex flex-wrap gap-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                        <span>Debug Send WA</span>
                        <div className="inline-flex rounded-full border border-amber-300 bg-white p-0.5">
                          <button
                            type="button"
                            onClick={() => setDebugSendMode("dry_run")}
                            className={`rounded-full px-3 py-1 transition ${
                              debugSendMode === "dry_run"
                                ? "bg-amber-500 text-white"
                                : "text-amber-700 hover:bg-amber-100"
                            }`}
                          >
                            Simulasi
                          </button>
                          <button
                            type="button"
                            onClick={() => setDebugSendMode("live")}
                            className={`rounded-full px-3 py-1 transition ${
                              debugSendMode === "live"
                                ? "bg-rose-600 text-white"
                                : "text-amber-700 hover:bg-amber-100"
                            }`}
                          >
                            Live
                          </button>
                        </div>
                      </div>
                      <div className="group relative">
                        <button
                          type="button"
                          onClick={handleDebugSendWhatsApp}
                          disabled={isDebugSendingWA || !isWhatsAppReady}
                          aria-describedby="debug-send-wa-tooltip"
                          className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-700 disabled:opacity-60"
                        >
                          {isDebugSendingWA ? (
                            <RefreshCcw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                          Debug Send WA
                        </button>
                        <div
                          id="debug-send-wa-tooltip"
                          role="tooltip"
                          className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-[320px] rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-left text-[11px] leading-5 text-slate-100 shadow-2xl group-hover:block group-focus-within:block"
                        >
                          <div className="font-bold text-amber-300">Fungsi</div>
                          <div className="mt-1">
                            Menjalankan flow kirim WhatsApp yang sama seperti tombol kirim utama,
                            tetapi khusus untuk debug. Hasilnya menampilkan payload, respons
                            gateway, dan status tiap tahap tanpa mengubah <code>IsWASent</code>.
                          </div>
                          <div className="mt-3 font-bold text-amber-300">Cara Pakai</div>
                          <div className="mt-1">
                            1. Simpan dulu perubahan dan pastikan preview audio sudah tersedia.
                            <br />
                            2. Pilih <code>Simulasi</code> untuk cek payload tanpa kirim ke gateway.
                            <br />
                            3. Pilih <code>Live</code> untuk kirim sungguhan dan lihat error/sukses
                            gateway yang sebenarnya.
                            <br />
                            4. Saat mode <code>Live</code>, sistem akan meminta konfirmasi sebelum
                            mengirim.
                          </div>
                        </div>
                      </div>
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
                        onClick={() => void handleCheckWhatsAppStatus()}
                        disabled={isCheckingWhatsAppStatus || !pageData || pageData.id_donatur <= 0}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-800 disabled:opacity-60"
                        title="Cek status delivery WhatsApp terakhir tanpa kirim ulang"
                      >
                        {isCheckingWhatsAppStatus ? <RefreshCcw className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
                        Check WA Status
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

                {isAdminDebugUser && debugSendResult?.data ? (
                  <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Hasil Debug Send WA</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Jalur ini memakai flow gateway yang sama, tetapi tidak mengubah
                          `IsWASent`.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide">
                        <span
                          className={`rounded-full px-3 py-1 ${
                            debugSendResult.data.mode === "live"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {debugSendResult.data.mode === "live" ? "live" : "dry run"}
                        </span>
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-700">
                          persist skipped: {debugSendResult.data.persistSkipped ? "yes" : "no"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Normalized Phone
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-800">
                          {debugSendResult.data.normalizedPhone || "-"}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-3 md:col-span-2">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Effective Audio URL
                        </div>
                        <div className="mt-2 break-all text-sm font-medium text-slate-800">
                          {debugSendResult.data.effectiveAudioUrl || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Final Summary:</span>{" "}
                      {debugSendResult.data.finalSummary || debugSendResult.message || "-"}
                    </div>

                    <div className="mt-4 grid gap-4">
                      {debugStageCards.map((item) => renderDebugStageCard(item.title, item.stage))}
                    </div>
                  </div>
                ) : null}

                {isAdminDebugUser && phoneNumbersResult ? (
                  <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Hasil Get Phones</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Payload gateway ditampilkan apa adanya dan bisa langsung dicopy.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                            phoneNumbersResult.success
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {phoneNumbersResult.success ? "success" : "failed"}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleCopyPhoneNumbersResult()}
                          disabled={!phoneNumbersResult.rawJson || phoneNumbersResult.rawJson === "-"}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-900 disabled:opacity-60"
                        >
                          <Copy className="h-3 w-3" />
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Message:</span>{" "}
                      {phoneNumbersResult.message || "-"}
                    </div>

                    <div className="mt-4">
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Raw Gateway Data
                      </div>
                      <pre className="max-h-72 overflow-auto rounded-2xl bg-slate-950 px-4 py-4 text-[11px] leading-5 text-slate-100">
                        {phoneNumbersResult.rawJson}
                      </pre>
                    </div>
                  </div>
                ) : null}

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
                              {effectivePreviewLink || "Link rekaman belum tersedia"}
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
                  accept=".mp3,.mp4,audio/mpeg,audio/mp3,audio/mp4,video/mp4"
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
                  Rekaman browser akan diubah dulu menjadi MP3 sebelum disimpan. Upload manual menerima file MP3 atau MP4 maksimal 10 MB.
                </div>

                {audioFileName ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    <div>
                      File: <span className="font-medium text-slate-800">{audioFileName}</span>
                    </div>
                    {selectedAudioFile ? (
                      <div className="mt-1 text-xs text-slate-500">
                        Status: belum disimpan ke transaksi. File{" "}
                        {getBirthdayPrayMediaExtension(selectedAudioFile.name).toUpperCase() || "media"} akan diupload saat tombol Save ditekan.
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
                    <BirthdayPrayMediaPreview
                      src={audioPreviewUrl}
                      sourceHint={
                        selectedAudioFile?.name ||
                        pageData?.pathPesanSuaraUrl ||
                        pageData?.pathPesanSuara ||
                        audioPreviewUrl
                      }
                    />

                    <a
                      href={audioPreviewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded bg-cyan-600 px-3 py-1 text-xs font-semibold text-white hover:bg-cyan-700"
                    >
                      Buka URL File Media
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
                      const historyMediaUrl = buildMediaUrl(
                        item.pathPesanSuaraUrl || item.pathPesanSuara || ""
                      );
                      const historyMediaSourceHint =
                        item.pathPesanSuaraUrl || item.pathPesanSuara || historyMediaUrl;

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

                          {historyMediaUrl ? (
                            <div className="mt-3 space-y-2">
                              <BirthdayPrayMediaPreview
                                src={historyMediaUrl}
                                sourceHint={historyMediaSourceHint}
                              />

                              <a
                                href={historyMediaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex rounded bg-cyan-600 px-3 py-1 text-xs font-semibold text-white hover:bg-cyan-700"
                              >
                                Buka File Media
                              </a>
                            </div>
                          ) : (
                            <div className="mt-3 text-xs text-slate-500">
                              Tidak ada file media.
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
      <ConfirmDialog
        open={showDebugSendConfirm}
        title="Kirim Debug Send WA Live?"
        message={`Akan mengirim WhatsApp sungguhan ke ${pageData?.noHPDonatur || "-"} dalam mode Live. Jalur debug ini tidak akan mengubah status IsWASent. Lanjutkan?`}
        confirmLabel="Ya, Kirim Live"
        cancelLabel="Batal"
        confirmClassName="bg-rose-600 hover:bg-rose-700"
        loading={isDebugSendingWA}
        onConfirm={() => {
          setShowDebugSendConfirm(false);
          void runDebugSendWhatsApp(true);
        }}
        onClose={() => setShowDebugSendConfirm(false)}
      />
    </div>
  );
}
