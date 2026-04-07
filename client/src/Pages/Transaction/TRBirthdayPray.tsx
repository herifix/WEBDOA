import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mic, Pause, Play, Square, Trash2 } from "lucide-react";
import ConfirmDialog from "../../components/ConfirmDialog";
import ERPToolbar from "../../components/ToolbarHR";
import StatusBanner from "../../components/StatusBanner";
import { useFormMessage } from "../../hooks/useFormMessage";
import {
  useFetchTRBirthdayPrayHistoryByDonatur,
  useFetchTRBirthdayPrayByDonatur,
  useSaveTRBirthdayPray,
} from "../../hooks/react_query/useFetchTRBirthdayPray";
import http from "../../api/http";

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

function toMediaUrl(pathValue: string) {
  if (!pathValue) return "";
  if (/^https?:\/\//i.test(pathValue)) return pathValue;

  const baseUrl = String(http.defaults.baseURL ?? "").replace(/\/+$/, "");
  const cleanPath = pathValue.replace(/^\/+/, "");
  return `${baseUrl}/${cleanPath}`;
}

function formatRecordingTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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
  const { mutateAsync: saveAsync, isPending: isSaving } = useSaveTRBirthdayPray();

  const [pesan, setPesan] = useState("");
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [saveToAllSameBirthdayDate, setSaveToAllSameBirthdayDate] = useState(true);
  const [recordingSupported, setRecordingSupported] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    setRecordingSupported(
      typeof window !== "undefined" &&
        typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== "undefined"
    );
  }, []);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (recordingIntervalRef.current !== null) {
        window.clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isRecording || isPaused) {
      if (recordingIntervalRef.current !== null) {
        window.clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      return;
    }

    recordingIntervalRef.current = window.setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (recordingIntervalRef.current !== null) {
        window.clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    };
  }, [isPaused, isRecording]);

  useEffect(() => {
    if (!detailQuery.data) return;

    setPesan(detailQuery.data.pesan ?? "");
    setAudioPreviewUrl(toMediaUrl(detailQuery.data.pathPesanSuara ?? ""));
    setSelectedAudioFile(null);
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

  const pageData = detailQuery.data;

  const audioFileName = useMemo(() => {
    if (selectedAudioFile) return selectedAudioFile.name;
    const originalPath = pageData?.pathPesanSuara ?? "";
    if (!originalPath) return "";

    const parts = originalPath.split("/");
    return parts[parts.length - 1] ?? "";
  }, [pageData?.pathPesanSuara, selectedAudioFile]);

  const hasUnsavedChanges = useMemo(() => {
    if (!pageData) return false;

    const originalPesan = (pageData.pesan ?? "").trim();
    const currentPesan = pesan.trim();
    const hasNewAudio = selectedAudioFile !== null;

    return originalPesan !== currentPesan || hasNewAudio || isRecording;
  }, [isRecording, pageData, pesan, selectedAudioFile]);

  function handleBackToDashboard() {
    if (hasUnsavedChanges) {
      setShowLeaveConfirm(true);
      return;
    }

    navigate("/dashboard");
  }

  async function startRecording() {
    clearFormMessage();

    if (!recordingSupported) {
      setFormError("Browser ini belum mendukung rekaman microphone.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recordedChunksRef.current = [];
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        if (blob.size > 0) {
          const extension = blob.type.includes("mpeg") ? "mp3" : "webm";
          const file = new File(
            [blob],
            `birthday-pray-${idDonatur}-${Date.now()}.${extension}`,
            { type: blob.type || "audio/webm" }
          );

          setSelectedAudioFile(file);
        }

        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        recordedChunksRef.current = [];
        setIsRecording(false);
        setIsPaused(false);
      };

      mediaRecorder.start();
      setSelectedAudioFile(null);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingSeconds(0);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal mengakses microphone.";
      setFormError(`Gagal mengakses microphone. ${message}`);
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;
      recordedChunksRef.current = [];
      setIsRecording(false);
      setIsPaused(false);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }

  function togglePauseRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (recorder.state === "recording") {
      recorder.pause();
      setIsPaused(true);
      return;
    }

    if (recorder.state === "paused") {
      recorder.resume();
      setIsPaused(false);
    }
  }

  function clearSelectedAudio() {
    setSelectedAudioFile(null);
    setAudioPreviewUrl(toMediaUrl(pageData?.pathPesanSuara ?? ""));
    setRecordingSeconds(0);
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

    if (selectedAudioFile) {
      formData.append("pesanSuaraFile", selectedAudioFile);
    }

    try {
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
      await detailQuery.refetch();
      await historyQuery.refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menyimpan data.";
      setFormError(message);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-slate-50 p-2">
      <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <ERPToolbar
          mode="edit"
          onSave={() => {
            void handleSave();
          }}
          onCancel={() => navigate("/dashboard")}
          onRefresh={() => {
            clearFormMessage();
            void detailQuery.refetch();
          }}
          showEdit={false}
          showDelete={false}
          showApprove={false}
          showUnapprove={false}
          showPrint={false}
          showExport={false}
          loadingSave={isSaving}
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
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-base font-semibold text-slate-800">Informasi Donatur</h2>
                <div className="mt-3 grid grid-cols-[140px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
                  <div className="text-slate-500">Nama Donatur</div>
                  <div className="font-medium text-slate-800">{pageData.namaDonatur}</div>

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
                  className="mt-3 min-h-[220px] w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  placeholder="Tulis pesan doa ulang tahun..."
                />
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
                <input
                  type="file"
                  accept="audio/*"
                  className="mt-3 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-cyan-700"
                  onChange={(e) => setSelectedAudioFile(e.target.files?.[0] ?? null)}
                />

                <div className="mt-3 flex flex-nowrap gap-2">
                  <button
                    type="button"
                    className="inline-flex shrink-0 items-center gap-1 rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => {
                      void startRecording();
                    }}
                    disabled={!recordingSupported || isRecording}
                  >
                    <Mic className="h-3.5 w-3.5" />
                    Mulai
                  </button>

                  <button
                    type="button"
                    className="inline-flex shrink-0 items-center gap-1 rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={togglePauseRecording}
                    disabled={!isRecording}
                  >
                    {isPaused ? (
                      <Play className="h-3.5 w-3.5" />
                    ) : (
                      <Pause className="h-3.5 w-3.5" />
                    )}
                    {isPaused ? "Resume" : "Pause"}
                  </button>

                  <button
                    type="button"
                    className="inline-flex shrink-0 items-center gap-1 rounded bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={stopRecording}
                    disabled={!isRecording}
                  >
                    <Square className="h-3.5 w-3.5" />
                    Stop
                  </button>

                  <button
                    type="button"
                    className="inline-flex shrink-0 items-center gap-1 rounded bg-slate-500 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={clearSelectedAudio}
                    disabled={!selectedAudioFile}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                  </button>
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  {isRecording
                    ? isPaused
                      ? `Rekaman dijeda di ${formatRecordingTime(recordingSeconds)}`
                      : `Microphone sedang merekam... ${formatRecordingTime(recordingSeconds)}`
                    : recordingSupported
                    ? "Anda bisa upload file audio atau rekam langsung dari microphone."
                    : "Browser ini belum mendukung rekaman microphone."}
                </div>

                {audioFileName ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    File: <span className="font-medium text-slate-800">{audioFileName}</span>
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
                    Belum ada file suara.
                  </div>
                )}

                {audioPreviewUrl ? (
                  <audio className="mt-3 w-full" controls src={audioPreviewUrl}>
                    Browser tidak mendukung audio playback.
                  </audio>
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
                      const historyAudioUrl = toMediaUrl(item.pathPesanSuara ?? "");

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
          navigate("/dashboard");
        }}
        onClose={() => setShowLeaveConfirm(false)}
      />
    </div>
  );
}
