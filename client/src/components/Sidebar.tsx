import { useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import "../styles/dashboard.css";

import icoHome from "../assets/iconplate/platehome.png";
import icoMaster from "../assets/iconplate/flatmaster.png";
import icoReport from "../assets/iconplate/platereport.png";
import icoUser from "../assets/iconplate/plateuser.png";
import icoLogout from "../assets/iconplate/platelogout.png";
import icoTR from "../assets/iconplate/flattransaction.png";
import icoSetting from "../assets/iconplate/flatsettings.png";
import icoTools from "../assets/iconplate/flattools.png";
import type { AppMenuItem } from "../Model/ModelMenu";
import { useFetchSidebarMenu } from "../hooks/react_query/useFetchSidebarMenu";
import { isCurrentUserSuperAdmin } from "../utils/authAccess";

type SidebarProps = {
  hidden: boolean;
};

const menuRouteMap: Record<string, string> = {
  home: "/dashboard",
  "master barang": "/master-barang",
  pendoa: "/master-pendoa",
  donatur: "/master-donatur",
  "master user": "/tools-master-user",
  "change password": "/tools-change-password",
  about: "/tools-about",
  "whatsapp schedule": "/tools-whatsapp-schedule",
  "jadwal whatsapp": "/tools-whatsapp-schedule",
  "whatsapp scheduler": "/tools-whatsapp-schedule",
  "application": "/tools-application-setting",
};

function normalizeMenuKey(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

function getMenuPath(item: AppMenuItem) {
  return menuRouteMap[normalizeMenuKey(item.formName)] ?? null;
}

function getMenuIcon(item: AppMenuItem) {
  const iconType = normalizeMenuKey(item.iconType);
  const formName = normalizeMenuKey(item.formName);

  if (iconType === "home" || formName === "home") return icoHome;
  if (iconType === "master" || formName === "master data") return icoMaster;
  if (iconType === "tools" || formName === "tools") return icoTools;
  if (iconType === "trans" || formName === "transaction") return icoTR;
  if (iconType === "report" || formName === "report") return icoReport;
  if (iconType === "setting" || formName === "setting") return icoSetting;
  return icoUser;
}

function hasPath(item: AppMenuItem) {
  return Boolean(getMenuPath(item));
}

function filterVisibleMenus(items: AppMenuItem[]): AppMenuItem[] {
  const isSuperAdmin = isCurrentUserSuperAdmin();

  return items
    .map((item): AppMenuItem | null => {
      const nextChildren: AppMenuItem[] = filterVisibleMenus(item.children ?? []);
      const isHome = normalizeMenuKey(item.formName) === "home";
      const showSelf = isSuperAdmin || item.canView || isHome;
      const shouldShow = nextChildren.length > 0 || (hasPath(item) && showSelf);

      if (!shouldShow) return null;

      return {
        ...item,
        children: nextChildren,
      };
    })
    .filter((item): item is AppMenuItem => item !== null)
    .sort((a, b) => a.menuOrder - b.menuOrder || a.id_form - b.id_form);
}

export default function Sidebar({ hidden }: SidebarProps) {
  const [openMenus, setOpenMenus] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();
  const location = useLocation();
  const userid = localStorage.getItem("userid") ?? "";
  const userpt = localStorage.getItem("userpt") ?? "";
  const menuQuery = useFetchSidebarMenu(userid, userpt);

  const visibleMenus = useMemo(
    () => filterVisibleMenus(menuQuery.data ?? []),
    [menuQuery.data]
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userid");
    localStorage.removeItem("userpt");
    localStorage.removeItem("forceChangePassword");
    navigate("/", { replace: true });
  };

  const isActive = (path: string) => location.pathname === path;

  function hasActiveDescendant(item: AppMenuItem): boolean {
    const directPath = getMenuPath(item);
    if (directPath && isActive(directPath)) {
      return true;
    }

    return (item.children ?? []).some((child) => hasActiveDescendant(child));
  }

  function isOpen(item: AppMenuItem) {
    if (openMenus[item.id_form] !== undefined) {
      return openMenus[item.id_form];
    }

    return hasActiveDescendant(item) || item.lvl <= 1;
  }

  function renderMenuItems(items: AppMenuItem[], depth = 0): ReactNode {
    return items.map((item) => {
      const children = item.children ?? [];
      const path = getMenuPath(item);
      const itemIsOpen = isOpen(item);
      const containerClass =
        depth === 0
          ? ""
          : "ml-4 flex flex-col gap-2 rounded-lg border border-white/10 bg-white/10 p-2";

      if (children.length > 0) {
        return (
          <div key={item.id_form} className={containerClass}>
            <button
              className={`btnmenu ${
                hasActiveDescendant(item) ? "bg-white/30" : ""
              } ${depth > 0 ? "text-sm font-normal" : ""}`}
              onClick={() =>
                setOpenMenus((prev) => ({
                  ...prev,
                  [item.id_form]: !itemIsOpen,
                }))
              }
            >
              {depth === 0 ? <img src={getMenuIcon(item)} className="menu-icon" alt="" /> : null}
              {item.formName}
              <span
                className={`ml-auto inline-flex transform transition-transform duration-200 ${
                  itemIsOpen ? "rotate-90" : "rotate-0"
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </span>
            </button>

            {itemIsOpen ? renderMenuItems(children, depth + 1) : null}
          </div>
        );
      }

      if (!path) {
        return null;
      }

      return (
        <div key={item.id_form} className={depth === 0 ? "" : containerClass}>
          <button
            className={`btnmenu ${
              isActive(path) ? "bg-white/40 text-black" : ""
            } ${depth > 0 ? "text-sm font-normal" : ""}`}
            onClick={() => navigate(path)}
          >
            {depth === 0 ? <img src={getMenuIcon(item)} className="menu-icon" alt="" /> : null}
            {item.formName}
          </button>
        </div>
      );
    });
  }

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
            <h2 className="text-2xl font-extrabold tracking-wide text-white">MENU</h2>
            <p className="mt-1 text-sm text-cyan-100/80">Navigation</p>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {menuQuery.isLoading ? (
              <div className="rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-sm text-cyan-50/90">
                Loading menu...
              </div>
            ) : menuQuery.isError ? (
              <div className="rounded-lg border border-red-200/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                Gagal mengambil menu.
              </div>
            ) : (
              renderMenuItems(visibleMenus)
            )}
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
