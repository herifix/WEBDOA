import { Clock3, MessageCircleMore, Power, RefreshCcw, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import StatusBanner from "../../components/StatusBanner";
import {
  useFetchWhatsAppSchedule,
  useUpdateWhatsAppSchedule,
} from "../../hooks/react_query/useFetchWhatsAppSchedule";

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function WhatsAppSchedulePage() {
  const settingQuery = useFetchWhatsAppSchedule();
  const updateMutation = useUpdateWhatsAppSchedule();

  const [sendTime, setSendTime] = useState("08:00");
  const [isActive, setIsActive] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => {
    if (!settingQuery.data) return;

    setSendTime(settingQuery.data.sendTime || "08:00");
    setIsActive(settingQuery.data.isActive ?? false);
  }, [settingQuery.data]);

  const dirty = useMemo(() => {
    if (!settingQuery.data) return false;
    return (
      (settingQuery.data.sendTime || "08:00") !== sendTime ||
      Boolean(settingQuery.data.isActive) !== isActive
    );
  }, [isActive, sendTime, settingQuery.data]);

  async function handleSave() {
    setFormError("");
    setFormSuccess("");

    if (!/^\d{2}:\d{2}$/.test(sendTime)) {
      setFormError("Format jam harus HH:mm.");
      return;
    }

    try {
      const response = await updateMutation.mutateAsync({ sendTime, isActive });
      setFormSuccess(response.message || "Setting berhasil disimpan.");
      await settingQuery.refetch();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Gagal menyimpan setting.");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top,_#f0f9ff,_#dbeafe_35%,_#e0f2fe_70%,_#f8fafc)] p-3 md:p-5">
      <div className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-sky-100 bg-white/80 p-4 shadow-[0_22px_60px_rgba(14,165,233,0.12)] backdrop-blur-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
              <MessageCircleMore className="h-4 w-4" />
              Auto WhatsApp Birthday Scheduler
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
              Penjadwalan Kirim Pesan WhatsApp Otomatis
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              Saat fitur ini aktif, sistem akan memeriksa data <strong>Pesan Text dan Suara </strong>
              . Pada tanggal ulang tahun yang sama dengan <strong> Ulang Tahun </strong>
              dan setelah melewati jam yang dijadwalkan, sistem akan mencoba mengirim pesan doa
              dan file suara dari nomor pendoa ke nomor WhatsApp donatur melalui gateway yang
              sudah dikonfigurasi di server.  
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Status
              </div>
              <div className={`mt-2 text-2xl font-black ${isActive ? "text-emerald-600" : "text-slate-500"}`}>
                {isActive ? "Aktif" : "Tidak Aktif"}
              </div>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Last Update
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-700">
                {formatDateTime(settingQuery.data?.updatedDate)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 shrink-0">
          <StatusBanner tone="error" message={formError || (settingQuery.isError ? "Gagal mengambil setting scheduler." : "")} />
          <StatusBanner tone="success" message={formSuccess} />
        </div>

        <div className="mt-4 grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <section className="rounded-[28px] border border-sky-100 bg-[linear-gradient(135deg,rgba(240,249,255,0.96),rgba(224,242,254,0.82))] p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-300/30">
                <Clock3 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Waktu Penjadwalan</h2>
                <p className="text-sm text-slate-600">
                  Tentukan jam kirim otomatis untuk semua transaksi doa ulang tahun yang jatuh pada hari itu.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
              <label className="text-sm font-semibold text-slate-700">Jam Kirim Otomatis</label>
              <input
                type="time"
                value={sendTime}
                onChange={(e) => setSendTime(e.target.value)}
                className="h-12 rounded-2xl border border-sky-200 bg-white px-4 text-base font-semibold text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />

              <label className="text-sm font-semibold text-slate-700">Aktifkan Scheduler</label>
              <button
                type="button"
                onClick={() => setIsActive((value) => !value)}
                className={`inline-flex h-12 items-center justify-between rounded-2xl border px-4 text-sm font-semibold transition ${
                  isActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Power className="h-4 w-4" />
                  {isActive ? "Scheduler Aktif" : "Scheduler Tidak Aktif"}
                </span>
                <span
                  className={`h-3 w-3 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-300"}`}
                />
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormError("");
                  setFormSuccess("");
                  void handleSave();
                }}
                disabled={updateMutation.isPending || settingQuery.isLoading || !dirty}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-[0_16px_30px_rgba(14,165,233,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                Simpan Jadwal
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormError("");
                  setFormSuccess("");
                  void settingQuery.refetch();
                }}
                disabled={settingQuery.isFetching}
                className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCcw className={`h-4 w-4 ${settingQuery.isFetching ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </section>

          <aside className="rounded-[28px] border border-sky-100 bg-white/90 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Catatan Integrasi</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
              <p>
                Pengiriman dilakukan oleh background worker server. Jadi browser tidak perlu
                selalu terbuka selama API berjalan.
              </p>
              <p>
                Sistem akan mengirim payload berisi <strong>fromPhone</strong>,
                <strong> toPhone</strong>, <strong>message</strong>, dan <strong>audioUrl</strong>
                ke gateway WhatsApp yang diatur di <strong>appsettings.json</strong>.
              </p>
              <p>
                Agar benar-benar terkirim dari nomor pendoa, gateway WhatsApp yang Anda pakai harus
                mendukung pengiriman berdasarkan nomor/sesi pengirim tersebut.
              </p>
              <p>
                Bila data `TRBirthdayPray` belum punya pesan atau file suara, payload tetap akan
                dikirim sesuai data yang tersedia.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
