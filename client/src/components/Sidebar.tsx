import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/dashboard.css";

import icoHome from "../assets/iconplate/platehome.png";
import icoMaster from "../assets/iconplate/flatmaster.png";
import icoReport from "../assets/iconplate/platereport.png";
import icoUser from "../assets/iconplate/plateuser.png";
import icoLogout from "../assets/iconplate/platelogout.png";
import icoTR from "../assets/iconplate/flattransaction.png";
import icoSetting from "../assets/iconplate/flatsettings.png";
import icoTools from "../assets/iconplate/flattools.png";

type SidebarProps = {
  hidden: boolean;
};

export default function Sidebar({ hidden }: SidebarProps) {
  const [openMaster, setOpenMaster] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={`flex h-full shrink-0 flex-col overflow-hidden border-r border-slate-200
      bg-gradient-to-b from-cyan-700 via-sky-800 to-slate-900 text-white
      transition-all duration-300
      ${hidden ? "w-0 p-0 opacity-0" : "w-[280px] p-4 opacity-100"}`}
    >
      {!hidden && (
        <>
          <div className="mb-4 shrink-0">
            <h2 className="text-2xl font-extrabold tracking-wide text-white">
              MENU
            </h2>
            <p className="mt-1 text-sm text-cyan-100/80">ERP Navigation</p>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
            <button
              className={`btnmenu ${isActive("/dashboard") ? "bg-white/40 text-black" : ""}`}
              onClick={() => navigate("/dashboard")}
            >
              <img src={icoHome} className="menu-icon" alt="" />
              Home
            </button>

            <button
              className={`btnmenu ${location.pathname.startsWith("/master") ? "bg-white/30" : ""}`}
              onClick={() => setOpenMaster((v) => !v)}
            >
              <img src={icoMaster} className="menu-icon" alt="" />
              Master Data
              <span
                className={`ml-auto inline-block transform transition-transform duration-200 ${
                  openMaster ? "rotate-90" : "rotate-0"
                }`}
              >
                ▶
              </span>
            </button>

            {openMaster && (
              <div className="ml-4 flex flex-col gap-2 rounded-lg border border-white/10 bg-white/10 p-2">
                <button hidden={true}
                  className={`btnmenu text-sm font-normal ${
                    isActive("/master-barang") ? "bg-white/40 text-black" : ""
                  }`}
                  onClick={() => navigate("/master-barang")}
                >
                  Master Barang
                </button>

                <button 
                  className={`btnmenu text-sm font-normal ${
                      isActive("/master-pendoa") ? "bg-white/40 text-black" : ""
                    }`}
                    onClick={() => navigate("/master-pendoa")}
                >
                  Pendoa
                </button>

                <button className="btnmenu text-sm font-normal">
                  Donatur
                </button>
              </div>
            )}

            <button className="btnmenu" hidden={true}>
              <img src={icoTR} className="menu-icon" alt="" />
              Transaction
            </button>

            <button className="btnmenu" hidden={true}>
              <img src={icoReport} className="menu-icon" alt="" />
              Report
            </button>

            <button className="btnmenu" hidden={true}>
              <img src={icoUser} className="menu-icon" alt="" />
              User
            </button>

            <button className="btnmenu" hidden={true}>
              <img src={icoTools} className="menu-icon" alt="" />
              Tools
            </button>

            <button className="btnmenu" hidden={true}>
              <img src={icoSetting} className="menu-icon" alt="" />
              Settings
            </button>

            <button type="button" className="btnmenu btndisabled" hidden={true}>
              <img src={icoUser} className="h-6 w-6 object-contain" alt="User" />
              Tes
            </button>
          </div>

          <div className="mt-4 shrink-0 pt-3">
            <button
              className="btnmenu w-full bg-red-300 text-black hover:bg-red-200"
              onClick={handleLogout}
            >
              <img src={icoLogout} className="menu-icon" alt="" />
              Logout
            </button>
          </div>
        </>
      )}
    </aside>
  );
}