import type { Donor } from "../data/donors";

export type VoiceDraft = {
  url: string;
  file: File;
};

type DonorCardProps = {
  donor: Donor;
  completed: boolean;
  isSaving: boolean;
  disabled: boolean;
  onOpenRecorder: () => void;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function DonorCard({
  donor,
  completed,
  isSaving,
  disabled,
  onOpenRecorder
}: DonorCardProps) {
  return (
    <article className={`donor-card ${completed ? "is-complete" : ""}`}>
      <div className="avatar" aria-hidden="true">
        {getInitials(donor.name)}
      </div>

      <div className="donor-info">
        <h2>{donor.name}</h2>
        <p>{donor.phone || "-"}</p>
      </div>

      <div className="donor-action">
        <button
          type="button"
          className={completed ? "done-button" : "outline-button"}
          onClick={onOpenRecorder}
          disabled={disabled || isSaving}
        >
          {isSaving ? "Mengirim..." : completed ? "Selesai" : "Rekam Doa"}
        </button>
      </div>
    </article>
  );
}
