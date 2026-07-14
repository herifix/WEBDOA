import { CalendarRange, Database, ImagePlus, KeyRound, Link2, MessageSquareText, RefreshCcw, Save, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import StatusBanner from "../../components/StatusBanner";
import { FORM_IDS } from "../../config/formIds";
import {
  useFetchApplicationSetting,
  useUpdateApplicationSetting,
} from "../../hooks/react_query/useFetchApplicationSetting";
import { useFormMenuPermissions } from "../../utils/menuAccess";
import { buildMediaUrl } from "../../config/appConfig";

export default function ApplicationSettingPage() {
  const settingQuery = useFetchApplicationSetting();
  const updateMutation = useUpdateApplicationSetting();
  const { permissions } = useFormMenuPermissions(FORM_IDS.ApplicationSet);

  const [msgTemplate, setMsgTemplate] = useState("");
  const [msgLink, setMsgLink] = useState("");
  const [msgImage, setMsgImage] = useState("");
  const [msgImageFile, setMsgImageFile] = useState<File | null>(null);
  const [msgImagePreviewUrl, setMsgImagePreviewUrl] = useState("");
  const [whatsappTemplateName, setWhatsappTemplateName] = useState("");
  const [whatsappVoiceTemplateName, setWhatsappVoiceTemplateName] = useState("");
  const [whatsappGatewayToken, setWhatsappGatewayToken] = useState("");
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState("");
  const [storageType, setStorageType] = useState("LocalServer");
  const [birthdayDashboardBeginDateOffsetDays, setBirthdayDashboardBeginDateOffsetDays] = useState(0);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => {
    if (!settingQuery.data) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMsgTemplate(settingQuery.data.msgTemplate || "");
    setMsgLink(settingQuery.data.msgLink || "");
    setMsgImage(settingQuery.data.msgImage || "");
    setWhatsappTemplateName(settingQuery.data.whatsappTemplateName || "");
    setWhatsappVoiceTemplateName(settingQuery.data.whatsappVoiceTemplateName || "");
    setWhatsappGatewayToken(settingQuery.data.whatsappGatewayToken || "");
    setWhatsappPhoneNumberId(settingQuery.data.whatsappPhoneNumberId || "");
    setStorageType(settingQuery.data.storageType || "LocalServer");
    setBirthdayDashboardBeginDateOffsetDays(settingQuery.data.birthdayDashboardBeginDateOffsetDays ?? 0);
    setMsgImageFile(null);
    setMsgImagePreviewUrl("");
  }, [settingQuery.data]);

  useEffect(() => {
    if (!msgImageFile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMsgImagePreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(msgImageFile);
    setMsgImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
      setMsgImagePreviewUrl("");
    };
  }, [msgImageFile]);

  const previewImageUrl = msgImagePreviewUrl || buildMediaUrl(msgImage);

  const dirty = useMemo(() => {
    if (!settingQuery.data) return false;
    return (
      (settingQuery.data.msgTemplate || "") !== msgTemplate ||
      (settingQuery.data.msgLink || "") !== msgLink ||
      (settingQuery.data.msgImage || "") !== msgImage ||
      (settingQuery.data.whatsappTemplateName || "") !== whatsappTemplateName ||
      (settingQuery.data.whatsappVoiceTemplateName || "") !== whatsappVoiceTemplateName ||
      (settingQuery.data.whatsappGatewayToken || "") !== whatsappGatewayToken ||
      (settingQuery.data.whatsappPhoneNumberId || "") !== whatsappPhoneNumberId ||
      (settingQuery.data.storageType || "LocalServer") !== storageType ||
      (settingQuery.data.birthdayDashboardBeginDateOffsetDays ?? 0) !== birthdayDashboardBeginDateOffsetDays ||
      msgImageFile !== null
    );
  }, [
    msgImage,
    msgImageFile,
    msgLink,
    msgTemplate,
    settingQuery.data,
    storageType,
    birthdayDashboardBeginDateOffsetDays,
    whatsappGatewayToken,
    whatsappPhoneNumberId,
    whatsappTemplateName,
    whatsappVoiceTemplateName,
  ]);

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

    if (!whatsappTemplateName.trim()) {
      setFormError("WA Template Name wajib diisi.");
      return;
    }

    if (!whatsappVoiceTemplateName.trim()) {
      setFormError("WA Voice Template Name wajib diisi.");
      return;
    }

    if (!whatsappPhoneNumberId.trim()) {
      setFormError("WA Phone Number ID wajib diisi.");
      return;
    }

    if (!Number.isInteger(birthdayDashboardBeginDateOffsetDays) || birthdayDashboardBeginDateOffsetDays < 0) {
      setFormError("Adjustment Range Begin Date harus berupa bilangan bulat nol atau lebih.");
      return;
    }

    try {
      const response = await updateMutation.mutateAsync({
        msgTemplate: msgTemplate.trim(),
        msgLink: msgLink.trim(),
        existingMsgImage: msgImage,
        msgImageFile,
        whatsappTemplateName: whatsappTemplateName.trim(),
        whatsappVoiceTemplateName: whatsappVoiceTemplateName.trim(),
        whatsappGatewayToken: whatsappGatewayToken.trim(),
        whatsappPhoneNumberId: whatsappPhoneNumberId.trim(),
        storageType,
        birthdayDashboardBeginDateOffsetDays,
      });
      setFormSuccess(response.message || "Application setting berhasil disimpan.");
      await settingQuery.refetch();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Gagal menyimpan application setting.");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top,#fefce8,#fef3c7_35%,#fffbeb_70%,#ffffff)] p-3 md:p-5">
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

          <div hidden={true} className="rounded-3xl border border-amber-100 bg-amber-50/70 p-5 lg:w-[320px]">
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
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-300/30">
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

              <label htmlFor="whatsapp-template-name" className="pt-3 text-sm font-semibold text-slate-700">
                WA Template Name (Main, WABA/Meta Approved)
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <MessageSquareText className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500" />
                  <input
                    id="whatsapp-template-name"
                    type="text"
                    value={whatsappTemplateName}
                    onChange={(e) => setWhatsappTemplateName(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-amber-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                    placeholder="e.g. birthday_pray"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Nama template pesan utama yang sudah di-approve di WABA/Meta; payload memakai bahasa en_US.
                </p>
              </div>

              <label htmlFor="whatsapp-voice-template-name" className="pt-3 text-sm font-semibold text-slate-700">
                WA Voice Template Name (Audio, WABA/Meta Approved)
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <MessageSquareText className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500" />
                  <input
                    id="whatsapp-voice-template-name"
                    type="text"
                    value={whatsappVoiceTemplateName}
                    onChange={(e) => setWhatsappVoiceTemplateName(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-amber-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                    placeholder="e.g. doa_selamat_ulang_tahun"
                    aria-describedby="whatsapp-voice-template-name-help"
                  />
                </div>
                <p id="whatsapp-voice-template-name-help" className="text-xs text-slate-500">
                  Nama template audio kedua yang sudah di-approve di WABA/Meta; payload memakai bahasa en.
                </p>
              </div>

              <label className="pt-3 text-sm font-semibold text-slate-700">Storage Type</label>
              <div className="space-y-2">
                <div className="relative">
                  <Database className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500" />
                  <select
                    value={storageType}
                    onChange={(e) => setStorageType(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-amber-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                  >
                    <option value="LocalServer">LocalServer</option>
                    <option value="GoogleCloud">GoogleCloud</option>
                  </select>
                </div>
                <p className="text-xs text-slate-500">
                  Dipakai untuk menentukan lokasi penyimpanan rekaman suara pada environment ini.
                </p>
              </div>

              <label htmlFor="birthday-dashboard-begin-date-offset-days" className="pt-3 text-sm font-semibold text-slate-700">
                Adjustment Range Begin Date (Hari)
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <CalendarRange className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500" />
                  <input
                    id="birthday-dashboard-begin-date-offset-days"
                    type="number"
                    min={0}
                    step={1}
                    value={birthdayDashboardBeginDateOffsetDays}
                    onChange={(e) => setBirthdayDashboardBeginDateOffsetDays(Number(e.target.value))}
                    className="h-12 w-full rounded-2xl border border-amber-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                    aria-describedby="birthday-dashboard-begin-date-offset-days-help"
                  />
                </div>
                <p id="birthday-dashboard-begin-date-offset-days-help" className="text-xs text-slate-500">
                  Jumlah hari mundur untuk dashboard TRBirthdayPray. Nilai 1 membuat batas awal menjadi H-1.
                </p>
              </div>

              <label className="pt-3 text-sm font-semibold text-slate-700">Image Pesan</label>
              <div className="space-y-3">
                <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-amber-300 bg-white/80 px-4 py-6 text-center transition hover:border-amber-400 hover:bg-amber-50/60">
                  {previewImageUrl ? (
                    <img
                      src={previewImageUrl}
                      alt="Preview image pesan"
                      className="max-h-[190px] rounded-2xl object-cover shadow-sm"
                    />
                  ) : (
                    <>
                      <ImagePlus className="h-8 w-8 text-amber-500" />
                      <div className="mt-3 text-sm font-semibold text-slate-700">
                        Upload gambar kartu pesan
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        JPG, PNG, atau WEBP untuk preview pesan WhatsApp
                      </div>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => setMsgImageFile(e.target.files?.[0] ?? null)}
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setMsgImageFile(null)}
                    className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-amber-50"
                  >
                    Reset File Baru
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMsgImage("");
                      setMsgImageFile(null);
                    }}
                    className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    Hapus Gambar
                  </button>
                </div>
              </div>

              <label htmlFor="whatsapp-phone-number-id" className="pt-3 text-sm font-semibold text-slate-700">
                WA Phone Number ID
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500" />
                  <input
                    id="whatsapp-phone-number-id"
                    type="text"
                    value={whatsappPhoneNumberId}
                    onChange={(e) => setWhatsappPhoneNumberId(e.target.value)}
                    autoComplete="off"
                    className="h-12 w-full rounded-2xl border border-amber-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                    placeholder="WhatsApp phone number ID dari gateway"
                    aria-describedby="whatsapp-phone-number-id-help"
                  />
                </div>
                <p id="whatsapp-phone-number-id-help" className="text-xs text-slate-500">
                  ID pengirim WhatsApp yang dikirim bersama setiap payload gateway birthday pray.
                </p>
              </div>

              <label className="pt-3 text-sm font-semibold text-slate-700">WA Gateway Token</label>
              <div className="space-y-2">
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500" />
                  <input
                    type="password"
                    value={whatsappGatewayToken}
                    onChange={(e) => setWhatsappGatewayToken(e.target.value)}
                    autoComplete="new-password"
                    className="h-12 w-full rounded-2xl border border-amber-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                    placeholder="Bearer token WhatsApp gateway"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Jika diisi, token ini akan diprioritaskan saat kirim WhatsApp (manual dan scheduler).
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
                className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 px-5 py-3 text-sm font-bold text-white shadow-[0_16px_30px_rgba(245,158,11,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
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
                `MsgImage` dipakai sebagai gambar kartu preview pesan dan disimpan sebagai path file
                upload pada server.
              </p>
              <p>
                `StorageType` disimpan ke field `MsProg.StorageType` dan dibaca backend sebagai
                provider efektif rekaman suara untuk environment/database yang sedang aktif.
              </p>
              <p>
                `BirthdayDashboardBeginDateOffsetDays` menentukan jumlah hari mundur batas awal
                dashboard TRBirthdayPray; batas akhir tetap enam bulan dari tanggal anchor.
              </p>
              <p>
                `WA Gateway Token` disimpan ke `MsProg.MsgWA_Token` dan dipakai backend untuk
                otorisasi ke WhatsApp Gateway.
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
