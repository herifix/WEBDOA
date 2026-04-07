import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Menu, Bell, UserCircle2 } from "lucide-react";

function getPageTitle(pathname: string) {
  switch (pathname) {
    case "/dashboard":
      return "Dashboard";
    case "/master-barang":
      return "Master Barang";
    default:
      return "Donatur System";
  }
}

export default function MainLayout() {
  const [hidden, setHidden] = useState(false);
  const location = useLocation();

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100">
      <div className="flex h-full w-full">
        {/* SIDEBAR */}
        <Sidebar hidden={hidden} />

        {/* CONTENT AREA */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* TOPBAR */}
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setHidden((v) => !v)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div>
                <h1 className="text-lg font-bold text-slate-800">
                  {getPageTitle(location.pathname)}
                </h1>
                <p className="text-xs text-slate-500">
                  Donatur System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              >
                <Bell className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                <UserCircle2 className="h-6 w-6 text-slate-600" />
                <div className="hidden text-left sm:block">
                  <div className="text-sm font-semibold text-slate-700">
                    Administrator
                  </div>
                  <div className="text-xs text-slate-500">User</div>
                </div>
              </div>
            </div>
          </header>

          {/* PAGE CONTENT */}
          <main className="min-h-0 flex-1 overflow-auto bg-slate-100 p-2">
            <div className="h-full min-h-full rounded-xl border border-slate-200 bg-white shadow-sm">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}