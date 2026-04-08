import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ERPToolbar from "../../components/ToolbarHR";
import StatusBanner from "../../components/StatusBanner";
import { useFormMessage } from "../../hooks/useFormMessage";
import { useChangePassword } from "../../hooks/react_query/useFetchMasterUser";
import { getCurrentPassword } from "../../service/masterUserService";
import { FORM_IDS } from "../../config/formIds";
import { useFormMenuPermissions } from "../../utils/menuAccess";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const userid = localStorage.getItem("userid") ?? "";
  const pt = localStorage.getItem("userpt") ?? "";
  const { permissions } = useFormMenuPermissions(FORM_IDS.changePassword);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const {
    formError,
    setFormError,
    formSuccess,
    setFormSuccess,
    clearFormMessage,
  } = useFormMessage();

  const { mutateAsync: changePasswordAsync, isPending } = useChangePassword();

  useEffect(() => {
    async function loadCurrentPassword() {
      if (!userid || !pt) return;

      try {
        const response = await getCurrentPassword(pt, userid);
        if (response?.success) {
          setCurrentPassword(response.data ?? "");
        }
      } catch {
        // biarkan field kosong jika gagal ambil data
      }
    }

    void loadCurrentPassword();
  }, [pt, userid]);

  if (!permissions.canView) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-base font-semibold text-rose-700">
        Anda tidak memiliki akses untuk membuka form ini.
      </div>
    );
  }

  const handleSave = async () => {
    try {
      clearFormMessage();

      if (!userid || !pt) {
        setFormError("Session user tidak ditemukan. Silakan login ulang.");
        return;
      }

      if (!currentPassword) {
        setFormError("Password lama wajib diisi.");
        return;
      }

      if (!newPassword) {
        setFormError("Password baru wajib diisi.");
        return;
      }

      if (newPassword !== confirmPassword) {
        setFormError("Konfirmasi password baru tidak sama.");
        return;
      }

      const result = await changePasswordAsync({
        pt,
        userid,
        currentPassword,
        newPassword,
      });

      if (!result.success) {
        throw new Error(result.message || "Gagal mengubah password.");
      }

      setFormSuccess(result.message || "Password berhasil diubah.");
      localStorage.setItem("forceChangePassword", "0");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("userid");
        localStorage.removeItem("userpt");
        localStorage.removeItem("area");
        localStorage.removeItem("forceChangePassword");
        navigate("/", { replace: true });
      }, 800);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal mengubah password.";
      setFormError(message);
    }
  };

  return (
    <div className="flex h-[calc(100vh-70px)] w-full flex-col bg-slate-50 p-1 md:p-2 lg:p-0">
      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="mb-1 mt-1 shrink-0 p-0">
          <ERPToolbar
            mode="edit"
            onSave={() => {
              void handleSave();
            }}
            onRefresh={() => {
              clearFormMessage();
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
            }}
            showNew={false}
            showEdit={false}
            showSave={permissions.canEdit}
            showDelete={false}
            showApprove={false}
            showPrint={false}
            showExport={false}
            showCancel={false}
            loadingSave={isPending}
          />
        </div>

        <StatusBanner tone="error" message={formError} />
        <StatusBanner tone="success" message={formSuccess} />

        <div className="mx-auto mt-4 w-full max-w-2xl rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h1 className="text-xl font-bold text-slate-800">Change Password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ubah password untuk user yang sedang login.
          </p>

          <div className="mt-5 grid grid-cols-[160px_minmax(0,1fr)] items-center gap-x-3 gap-y-3">
            <label className="text-sm text-slate-700">PT</label>
            <input value={pt} className="inputtextbox w-full" readOnly />

            <label className="text-sm text-slate-700">User ID</label>
            <input value={userid} className="inputtextbox w-full" readOnly />

            <label className="text-sm text-slate-700">Password Lama</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="inputtextbox w-full"
            />

            <label className="text-sm text-slate-700">Password Baru</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="inputtextbox w-full"
            />

            <label className="text-sm text-slate-700">Konfirmasi Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="inputtextbox w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
