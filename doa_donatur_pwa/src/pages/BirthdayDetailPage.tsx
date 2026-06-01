import { useEffect, useMemo, useRef, useState } from "react";
import DonorCard, { type VoiceDraft } from "../components/DonorCard";
import IconButton from "../components/IconButton";
import VoiceRecorderModal, { type RecorderState } from "../components/VoiceRecorderModal";
import { mockDonors, type Donor } from "../data/donors";
import {
  getBirthdaysByDate,
  mapApiBirthdayItem,
  readCache,
  saveVoiceFFmpeg,
  writeCache
} from "../lib/api";
import { formatShortDateId } from "../lib/date";
import { navigate, parseQuery } from "../lib/router";

function chooseMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
}

const voiceAudioConstraints: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: { ideal: 1 },
  sampleRate: { ideal: 48000 },
  sampleSize: { ideal: 16 }
};

function extensionForMimeType(mimeType: string) {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

function getMockDonorsForDate(dateKey: string) {
  return mockDonors.filter((donor) => donor.birthday === dateKey);
}

function compareDonorsForDisplay(first: Donor, second: Donor) {
  const firstCompleted = Boolean(first.hasVoice);
  const secondCompleted = Boolean(second.hasVoice);

  if (firstCompleted !== secondCompleted) {
    return firstCompleted ? 1 : -1;
  }

  return first.name.localeCompare(second.name, "id", { sensitivity: "base" });
}

export default function BirthdayDetailPage() {
  const dateKey = parseQuery().date || "2026-05-29";
  const cacheKey = `doa.cache.birthdays.${dateKey}`;
  const [donors, setDonors] = useState<Donor[]>(() => readCache<Donor[]>(cacheKey, []));
  const [activeDonor, setActiveDonor] = useState<Donor | null>(null);
  const [activeDraft, setActiveDraft] = useState<VoiceDraft | null>(null);
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [recorderError, setRecorderError] = useState("");
  const [savingDonorId, setSavingDonorId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<AudioNode[]>([]);
  const chunksRef = useRef<BlobPart[]>([]);
  const recordingMimeRef = useRef("");
  const activeDraftRef = useRef<VoiceDraft | null>(null);

  const titleDate = useMemo(() => formatShortDateId(dateKey), [dateKey]);
  const sortedDonors = useMemo(
    () => [...donors].sort(compareDonorsForDisplay),
    [donors]
  );

  useEffect(() => {
    let active = true;

    async function loadBirthdays() {
      setLoading(true);
      setMessage("");
      const cached = readCache<Donor[]>(cacheKey, []);

      try {
        const apiData = await getBirthdaysByDate(dateKey);
        const mapped = apiData.map(mapApiBirthdayItem).filter((donor) => donor.birthday === dateKey);
        if (!active) return;
        const resolved = mapped.length > 0 ? mapped : getMockDonorsForDate(dateKey);
        setDonors(resolved);
        writeCache(cacheKey, resolved);
      } catch (error) {
        if (!active) return;
        setDonors(cached.length > 0 ? cached : getMockDonorsForDate(dateKey));
        setMessage(
          error instanceof Error
            ? `Memakai data tersimpan. ${error.message}`
            : "Memakai data tersimpan."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadBirthdays();

    return () => {
      active = false;
    };
  }, [cacheKey, dateKey]);

  useEffect(() => {
    activeDraftRef.current = activeDraft;
  }, [activeDraft]);

  useEffect(() => {
    return () => {
      stopActiveRecorder();
      stopRecordingTracks();
      revokeActiveDraft();
    };
  }, []);

  function stopStream(stream: MediaStream | null) {
    stream?.getTracks().forEach((track) => track.stop());
  }

  function stopRecordingTracks() {
    audioNodesRef.current.forEach((node) => {
      try {
        node.disconnect();
      } catch {
        // Some browsers throw when a node is already disconnected.
      }
    });
    audioNodesRef.current = [];

    stopStream(streamRef.current);
    if (sourceStreamRef.current !== streamRef.current) {
      stopStream(sourceStreamRef.current);
    }

    streamRef.current = null;
    sourceStreamRef.current = null;

    const audioContext = audioContextRef.current;
    audioContextRef.current = null;
    if (audioContext && audioContext.state !== "closed") {
      void audioContext.close().catch(() => undefined);
    }
  }

  async function createVoiceOptimizedStream() {
    let sourceStream: MediaStream;

    try {
      sourceStream = await navigator.mediaDevices.getUserMedia({ audio: voiceAudioConstraints });
    } catch {
      sourceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    sourceStreamRef.current = sourceStream;

    const AudioContextConstructor =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextConstructor) {
      return sourceStream;
    }

    let audioContext: AudioContext | null = null;
    const nodes: AudioNode[] = [];

    try {
      try {
        audioContext = new AudioContextConstructor({ sampleRate: 48000 });
      } catch {
        audioContext = new AudioContextConstructor();
      }

      const source = audioContext.createMediaStreamSource(sourceStream);
      const highpass = audioContext.createBiquadFilter();
      const lowpass = audioContext.createBiquadFilter();
      const compressor = audioContext.createDynamicsCompressor();
      const gain = audioContext.createGain();
      const destination = audioContext.createMediaStreamDestination();

      highpass.type = "highpass";
      highpass.frequency.value = 85;
      highpass.Q.value = 0.7;

      lowpass.type = "lowpass";
      lowpass.frequency.value = 8500;
      lowpass.Q.value = 0.7;

      compressor.threshold.value = -24;
      compressor.knee.value = 24;
      compressor.ratio.value = 3;
      compressor.attack.value = 0.005;
      compressor.release.value = 0.18;

      gain.gain.value = 1.2;

      source.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(compressor);
      compressor.connect(gain);
      gain.connect(destination);

      nodes.push(source, highpass, lowpass, compressor, gain, destination);
      audioNodesRef.current = nodes;
      audioContextRef.current = audioContext;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      return destination.stream;
    } catch {
      nodes.forEach((node) => {
        try {
          node.disconnect();
        } catch {
          // Ignore partial graph cleanup failures.
        }
      });

      if (audioContext && audioContext.state !== "closed") {
        void audioContext.close().catch(() => undefined);
      }

      audioContextRef.current = null;
      audioNodesRef.current = [];
      return sourceStream;
    }
  }

  function createVoiceMediaRecorder(stream: MediaStream, mimeType: string) {
    const options: MediaRecorderOptions = { audioBitsPerSecond: 96000 };
    if (mimeType) options.mimeType = mimeType;

    try {
      return new MediaRecorder(stream, options);
    } catch {
      if (mimeType) {
        try {
          return new MediaRecorder(stream, { mimeType });
        } catch {
          return new MediaRecorder(stream);
        }
      }

      return new MediaRecorder(stream);
    }
  }

  function stopActiveRecorder() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        // The recorder may already be stopping in some browsers.
      }
    }
    recorderRef.current = null;
  }

  function revokeActiveDraft() {
    const draft = activeDraftRef.current;
    if (draft) {
      URL.revokeObjectURL(draft.url);
      activeDraftRef.current = null;
    }
  }

  function setDraft(draft: VoiceDraft | null) {
    revokeActiveDraft();
    activeDraftRef.current = draft;
    setActiveDraft(draft);
  }

  function resetRecorderModal() {
    setDraft(null);
    setActiveDonor(null);
    setRecorderState("idle");
    setRecordingStartedAt(null);
    setRecordedSeconds(0);
    setRecorderError("");
    chunksRef.current = [];
  }

  async function refreshAfterSave(fallbackDonorId: string) {
    try {
      const apiData = await getBirthdaysByDate(dateKey);
      const mapped = apiData.map(mapApiBirthdayItem).filter((donor) => donor.birthday === dateKey);
      const resolved = mapped.map((donor) =>
        donor.id === fallbackDonorId ? { ...donor, hasVoice: true } : donor
      );
      setDonors(resolved);
      writeCache(cacheKey, resolved);
    } catch {
      setDonors((current) => {
        const next = current.map((donor) =>
          donor.id === fallbackDonorId ? { ...donor, hasVoice: true } : donor
        );
        writeCache(cacheKey, next);
        return next;
      });
    }
  }

  function handleOpenRecorder(donor: Donor) {
    setMessage("");
    resetRecorderModal();
    setActiveDonor(donor);
  }

  async function handleStartRecording() {
    if (!activeDonor) return;

    setRecorderError("");
    setMessage("");

    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setRecorderError("Browser ini belum mendukung perekaman suara.");
      return;
    }

    try {
      stopRecordingTracks();
      setDraft(null);
      chunksRef.current = [];

      const stream = await createVoiceOptimizedStream();
      const mimeType = chooseMimeType();
      const recorder = createVoiceMediaRecorder(stream, mimeType);
      const startedAt = Date.now();

      streamRef.current = stream;
      recorderRef.current = recorder;
      recordingMimeRef.current = recorder.mimeType || mimeType || "audio/webm";
      setRecordingStartedAt(startedAt);
      setRecordedSeconds(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const chunks = chunksRef.current;
        chunksRef.current = [];
        recorderRef.current = null;
        setRecordingStartedAt(null);
        stopRecordingTracks();

        if (chunks.length === 0) {
          setRecorderState("idle");
          setRecorderError("Rekaman kosong. Silakan coba lagi.");
          return;
        }

        const mime = recordingMimeRef.current || "audio/webm";
        const blob = new Blob(chunks, { type: mime });
        const extension = extensionForMimeType(mime);
        const file = new File([blob], `doa-${activeDonor.id}-${Date.now()}.${extension}`, { type: mime });
        const url = URL.createObjectURL(blob);
        const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

        setDraft({ url, file });
        setRecordedSeconds(durationSeconds);
        setRecorderState("recorded");
      };

      recorder.start();
      setRecorderState("recording");
    } catch (error) {
      stopRecordingTracks();
      setRecordingStartedAt(null);
      setRecorderState(activeDraftRef.current ? "recorded" : "idle");
      setRecorderError(error instanceof Error ? error.message : "Tidak bisa mulai merekam suara.");
    }
  }

  function handleStopRecording() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }

  function handleCancelRecorder() {
    if (recorderState === "recording" || recorderState === "saving") return;
    resetRecorderModal();
  }

  async function handleSendPrayer() {
    if (!activeDonor || !activeDraft || recorderState !== "recorded") return;

    setSavingDonorId(activeDonor.id);
    setRecorderState("saving");
    setRecorderError("");
    setMessage("");

    try {
      await saveVoiceFFmpeg({ donor: activeDonor, file: activeDraft.file });
      const savedDonorId = activeDonor.id;
      resetRecorderModal();
      await refreshAfterSave(savedDonorId);
      setMessage("Rekaman doa berhasil dikirim.");
    } catch (error) {
      setRecorderState("recorded");
      setRecorderError(error instanceof Error ? error.message : "Gagal mengirim rekaman doa.");
    } finally {
      setSavingDonorId("");
    }
  }

  return (
    <main>
      <header className="topbar detail-topbar">
        <IconButton label="Kembali" onClick={() => navigate(`/dashboard?date=${dateKey}`)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </IconButton>
        <h1>Ulang Tahun</h1>
      </header>

      <div className="page detail-page">
        <h2 className="section-title">DONATUR YANG BERULANG TAHUN</h2>
        <div className="detail-date">{titleDate}</div>

        {loading ? <div className="inline-status">Memuat data...</div> : null}
        {message ? <div className="inline-status">{message}</div> : null}

        {sortedDonors.length === 0 && !loading ? (
          <div className="empty-state">Tidak ada donatur ulang tahun pada tanggal ini.</div>
        ) : (
          <div className="donor-list">
            {sortedDonors.map((donor) => (
              <DonorCard
                key={donor.id}
                donor={donor}
                completed={Boolean(donor.hasVoice)}
                isSaving={savingDonorId === donor.id}
                disabled={Boolean(activeDonor) || Boolean(savingDonorId)}
                onOpenRecorder={() => handleOpenRecorder(donor)}
              />
            ))}
          </div>
        )}
      </div>

      {activeDonor ? (
        <VoiceRecorderModal
          donor={activeDonor}
          state={recorderState}
          startedAt={recordingStartedAt}
          draftUrl={activeDraft?.url}
          recordedSeconds={recordedSeconds}
          error={recorderError}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onCancel={handleCancelRecorder}
          onSend={() => void handleSendPrayer()}
        />
      ) : null}
    </main>
  );
}
