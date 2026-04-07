type StatusBannerProps = {
  tone: "error" | "success";
  message: string;
};

const toneClassName: Record<StatusBannerProps["tone"], string> = {
  error: "border-rose-200 bg-rose-50 text-rose-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export default function StatusBanner({
  tone,
  message,
}: StatusBannerProps) {
  if (!message) return null;

  return (
    <div
      className={`mb-2 rounded-xl border px-3 py-2 text-sm ${toneClassName[tone]}`}
    >
      {message}
    </div>
  );
}
