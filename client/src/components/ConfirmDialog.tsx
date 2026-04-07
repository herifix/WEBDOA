type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmClassName?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title = "Konfirmasi",
  message,
  confirmLabel = "Ya",
  cancelLabel = "Batal",
  confirmClassName = "bg-rose-600 hover:bg-rose-700",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        </div>

        <div className="px-5 py-4 text-sm text-slate-600">{message}</div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${confirmClassName} ${loading ? "pointer-events-none opacity-60" : ""}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Proses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
