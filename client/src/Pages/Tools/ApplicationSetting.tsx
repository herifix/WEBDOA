import { Link2, MessageSquareText, RefreshCcw, Save, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import StatusBanner from "../../components/StatusBanner";
import { FORM_IDS } from "../../config/formIds";
import {
  useFetchApplicationSetting,
  useUpdateApplicationSetting,
} from "../../hooks/react_query/useFetchApplicationSetting";
import { useFormMenuPermissions } from "../../utils/menuAccess";

export default function ApplicationSettingPage() {
  const settingQuery = useFetchApplicationSetting();
  const updateMutation = useUpdateApplicationSetting();
  const { permissions } = useFormMenuPermissions(FORM_IDS.ApplicationSet);

  const [msgTemplate, setMsgTemplate] = useState("");
  const [msgLink, setMsgLink] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => {
    if (!settingQuery.data) return;

    setMsgTemplate(settingQuery.data.msgTemplate || "");
    setMsgLink(settingQuery.data.msgLink || "");
  }, [settingQuery.data]);

  const dirty = useMemo(() => {
    if (!settingQuery.data) return false;
    return (
      (settingQuery.data.msgTemplate || "") !== msgTemplate ||
      (settingQuery.data.msgLink || "") !== msgLink
    );
  }, [msgLink, msgTemplate, settingQuery.data]);

  if (!permissions.canView) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-base font-semibold text-rose-700">
        Anda tidak memiliki akses untuk membuka form ini.
      </div>
    );
  }

  async function handleSave() {
    setFormError("");
    setFormSuccess("");

    if (!msgTemplate.trim()) {
      setFormError("Message template wajib diisi.");
      return;
    }

    try {
      const response = await updateMutation.mutateAsync({
        msgTemplate: msgTemplate.trim(),
        msgLink: msgLink.trim(),
      });
      setFormSuccess(response.message || "Application setting berhasil disimpan.");
      await settingQuery.refetch();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Gagal menyimpan application setting.");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top,_#fefce8,_#fef3c7_35%,_#fffbeb_70%,_#ffffff)] p-3 md:p-5">
      <div className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-amber-100 bg-white/85 p-4 shadow-[0_24px_70px_rgba(245,158,11,0.12)] backdrop-blur-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
              <Settings2 className="h-4 w-4" />
              Application Setting
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
              Pengaturan Template Pesan Aplikasi
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              Halaman ini dipakai untuk menyimpan template pesan utama aplikasi dan link pendukung
              yang akan digunakan oleh proses integrasi lain di server.
            </p>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-5 lg:w-[320px]">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Storage
            </div>
            <div className="mt-3 text-lg font-black text-slate-900">dbo.MsProg</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Menyimpan `MsgTemplate` dan `MsgLink` sebagai setting utama aplikasi.
            </p>
          </div>
        </div>

        <div className="mt-5 shrink-0">
          <StatusBanner
            tone="error"
            message={formError || (settingQuery.isError ? "Gagal mengambil application setting." : "")}
          />
          <StatusBanner tone="success" message={formSuccess} />
        </div>

        <div className="mt-4 grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <section className="rounded-[28px] border border-amber-100 bg-[linear-gradient(135deg,rgba(255,251,235,0.96),rgba(254,243,199,0.8))] p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-300/30">
                <MessageSquareText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Data Setting</h2>
                <p className="text-sm text-slate-600">
                  Atur template pesan dan link default untuk kebutuhan aplikasi.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
              <label className="pt-3 text-sm font-semibold text-slate-700">Message Template</label>
              <textarea
                value={msgTemplate}
                onChange={(e) => setMsgTemplate(e.target.value)}
                rows={8}
                className="min-h-[180px] rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                placeholder="Tulis template pesan aplikasi di sini..."
              />

              <label className="pt-3 text-sm font-semibold text-slate-700">Message Link</label>
              <div className="space-y-2">
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500" />
                  <input
                    type="text"
                    value={msgLink}
                    onChange={(e) => setMsgLink(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-amber-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                    placeholder="https://example.com/link"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Kosongkan bila aplikasi tidak membutuhkan link tambahan.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  void handleSave();
                }}
                disabled={updateMutation.isPending || settingQuery.isLoading || !dirty || !permissions.canEdit}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-sm font-bold text-white shadow-[0_16px_30px_rgba(245,158,11,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                Simpan Setting
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormError("");
                  setFormSuccess("");
                  void settingQuery.refetch();
                }}
                disabled={settingQuery.isFetching}
                className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCcw className={`h-4 w-4 ${settingQuery.isFetching ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </section>

          <aside className="rounded-[28px] border border-amber-100 bg-white/90 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Catatan Penggunaan</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
              <p>
                `MsgTemplate` cocok dipakai untuk template pesan panjang, sehingga field ini
                disimpan sebagai `NVARCHAR(MAX)`.
              </p>
              <p>
                `MsgLink` disimpan sebagai `NVARCHAR(255)` untuk URL, tautan landing page, atau
                link pendukung lain yang dipakai oleh aplikasi.
              </p>
              <p>
                Bila tabel `dbo.MsProg` belum ada, backend akan membuatnya otomatis saat halaman
                ini pertama kali dipanggil.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
