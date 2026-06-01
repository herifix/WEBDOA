import { useEffect, useMemo, useRef, useState } from "react";
import type { Donor } from "../data/donors";

export type RecorderState = "idle" | "recording" | "recorded" | "saving";

type VoiceRecorderModalProps = {
  donor: Donor;
  state: RecorderState;
  startedAt: number | null;
  draftUrl?: string;
  recordedSeconds: number;
  error: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancel: () => void;
  onSend: () => void;
};

function formatDuration(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default function VoiceRecorderModal({
  donor,
  state,
  startedAt,
  draftUrl,
  recordedSeconds,
  error,
  onStartRecording,
  onStopRecording,
  onCancel,
  onSend
}: VoiceRecorderModalProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [playing, setPlaying] = useState(false);

  const isRecording = state === "recording";
  const isRecorded = state === "recorded";
  const isSaving = state === "saving";
  const canSend = isRecorded && Boolean(draftUrl) && !isSaving;

  const timerText = useMemo(() => {
    if (isRecording) return formatDuration(elapsedSeconds);
    if (isRecorded || isSaving) return formatDuration(recordedSeconds);
    return "00:00";
  }, [elapsedSeconds, isRecorded, isRecording, isSaving, recordedSeconds]);

  useEffect(() => {
    if (!isRecording || !startedAt) {
      setElapsedSeconds(0);
      return undefined;
    }

    const updateElapsed = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    };

    updateElapsed();
    const timer = window.setInterval(updateElapsed, 500);
    return () => window.clearInterval(timer);
  }, [isRecording, startedAt]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    audio.pause();
    audio.currentTime = 0;
    setPlaying(false);

    return () => {
      audio.pause();
    };
  }, [draftUrl]);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !draftUrl) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    try {
      if (audio.ended) audio.currentTime = 0;
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  function handlePrimaryRecordAction() {
    if (isRecording) {
      onStopRecording();
      return;
    }

    if (!isSaving) {
      onStartRecording();
    }
  }

  return (
    <div className="recorder-overlay" role="dialog" aria-modal="true" aria-label={`Rekam doa untuk ${donor.name}`}>
      <div className="recorder-sheet">
        <div className="recorder-heading">
          <span>REKAM DOA UNTUK</span>
          <strong>{donor.name}</strong>
        </div>

        <div className={`recorder-timer ${isRecording ? "is-recording" : ""}`}>{timerText}</div>

        <div className="recorder-controls">
          <button
            type="button"
            className={`recorder-round-button ${isRecording ? "is-stop" : ""}`}
            onClick={handlePrimaryRecordAction}
            disabled={isSaving}
            aria-label={isRecording ? "Stop rekaman" : isRecorded ? "Rekam ulang" : "Mulai rekam"}
          >
            {isRecording ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="8" y="8" width="8" height="8" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 14a4 4 0 0 0 4-4V6a4 4 0 0 0-8 0v4a4 4 0 0 0 4 4Z" />
                <path d="M19 10a7 7 0 0 1-14 0" />
                <path d="M12 17v4" />
                <path d="M8 21h8" />
              </svg>
            )}
          </button>

          {draftUrl ? (
            <button
              type="button"
              className="recorder-round-button is-play"
              onClick={togglePlayback}
              disabled={isSaving}
              aria-label={playing ? "Jeda rekaman" : "Putar rekaman"}
            >
              {playing ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 6v12" />
                  <path d="M16 6v12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m9 7 8 5-8 5Z" />
                </svg>
              )}
            </button>
          ) : null}
        </div>

        <p className="recorder-helper">
          {isSaving
            ? "Mengirim doa..."
            : isRecording
              ? "Sedang merekam..."
              : isRecorded
                ? "Ketuk Mic untuk rekam ulang"
                : "Siap merekam"}
        </p>

        {error ? <div className="recorder-error">{error}</div> : null}

        <div className="recorder-actions">
          <button type="button" className="recorder-text-button" onClick={onCancel} disabled={isRecording || isSaving}>
            Batal
          </button>
          <button type="button" className="recorder-send-button" onClick={onSend} disabled={!canSend}>
            {isSaving ? "Mengirim..." : "Kirim Doa"}
          </button>
        </div>

        {draftUrl ? (
          <audio
            ref={audioRef}
            preload="metadata"
            src={draftUrl}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />
        ) : null}
      </div>
    </div>
  );
}
