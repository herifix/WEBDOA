import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

import type { PtItem } from "../Model/pt";

import illustrationDefault from "../assets/LOGOGKY.png";
import intLogo from "../assets/intlogo.png";
import { useFetchPTs } from "../hooks/react_query/useFetchPTs";
import { useFetchLogin } from "../hooks/react_query/useFetchLogin";
import { mustChangePassword } from "../utils/authAccess";
// import { login } from "../api/auth"; // aktifkan kalau sudah dipakai

export default function Login() {
  const nav = useNavigate();

  const [userid, setUserid] = useState("");
  const [password, setPassword] = useState("");
  const [userpt, setUserpt] = useState<string>("");

  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchPTsState = useFetchPTs();  // ✅ ambil list PT

  // ✅ set default PT saat data selesai load
  const effectivePt = useMemo(() => {
  return userpt || fetchPTsState.data?.[0]?.ptCode || "";
  }, [userpt, fetchPTsState.data]);

  // ✅ gambar kiri dinamis berdasarkan PT (public/pt/{pt}.png)
  const leftImage = useMemo(() => {
  if (!effectivePt) return illustrationDefault;
  return `/pt/${effectivePt}.png`;
  }, [effectivePt]);


const loginMutation = useFetchLogin();

const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  loginMutation.mutate(
  { userid: userid, password: password, userpt: effectivePt },
  {
    onSuccess: () => {
      localStorage.setItem("userid", userid);
      localStorage.setItem("userpt", effectivePt);
      localStorage.setItem("area", "MJKKB");

      setLoading(false);
      nav(mustChangePassword() ? "/tools-change-password" : "/Dashboard");
    },
    onError: (err: unknown) => {
      setLoading(false);
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : "Login gagal";

      setError(msg);
    },
  }
);

};

	
  return (
    <div className="login-bg">
      <div className="login-card">
        {/* Left illustration */}
        <div className="login-left">
          <div className="login-illustration">
            <img
              src={leftImage}
              alt="illustration"
              draggable={false}
              onError={(e) => {
                e.currentTarget.onerror = null; // cegah loop
                e.currentTarget.src = illustrationDefault;
              }}
            />
          </div>
        </div>

        {/* Right form (✅ hanya 1 login-right) */}
        <div className="login-right">
          {/* 🔵 badge image */}
          <div className="login-badge">
            <img
              src={intLogo}
              alt="PT Logo"
              draggable={false}
              onError={(e) => {
                e.currentTarget.onerror = null; // cegah loop
                e.currentTarget.src = illustrationDefault;
              }}
            />
          </div>

          <div className="login-title">
            <h1>Let’s sign you in.</h1>
            <p>Hello welcome back to your account</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="field">
              <label>User ID</label>
              <input
                placeholder="User id"
                value={userid}
                onChange={(e) => setUserid(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="field">
              <label>Password</label>
              <div className="password-wrap">
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={`fa-solid ${showPwd ? "fa-eye-slash" : "fa-eye"} eye-btn`}
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label="toggle password"
                >
                  {showPwd ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* ✅ User PT combobox */}
            {fetchPTsState.isLoading ? (
              <>LOADING</>
            ) : fetchPTsState.error ? (
              <>ERROR</>
            ) : fetchPTsState.data ? (
              <div className="field" style={{ display: "none" }}>
                <label>User PT</label>
                <select
                  value={userpt}
                  onChange={(e) => setUserpt(e.target.value)}
                  disabled={fetchPTsState.data.length === 0}
                >
                  {fetchPTsState.data.map((pt: PtItem) => (
                    <option key={pt.ptCode} value={pt.ptCode}>
                      {pt.ptCode}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {error && <div className="error-box">{error}</div>}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in now"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
