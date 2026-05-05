import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RefreshCcw, Send } from "lucide-react";
import ERPGridTable, { type Column } from "../components/GridFullParent";
import {
  useFetchBirthdayDashboard,
  useSendWhatsAppBirthdayPray,
} from "../hooks/react_query/useFetchTRBirthdayPray";
import type { DashboardBirthdayItem } from "../Model/ModelTRBirthdayPray";
import StatusBanner from "../components/StatusBanner";

type DashboardRow =
  | {
      id: string;
      rowType: "month";
      monthKey: string;
      monthLabel: string;
      isExpanded: boolean;
      groupLabel: string;
      totalCount: number;
      completeCount: number;
    }
  | {
      id: string;
      rowType: "date";
      monthKey: string;
      dateKey: string;
      dateLabel: string;
      isExpanded: boolean;
      groupLabel: string;
      totalCount: number;
      completeCount: number;
    }
  | {
      id: string;
      rowType: "detail";
      monthKey: string;
      dateKey: string;
      id_donatur: number;
      id_TRBirthdayPray: number | null;
      nama: string;
      noHP: string;
      birthdayDate: string | null;
      sudahDidoakan: boolean;
      isWASent: boolean;
    };

function getDatePart(dateString?: string | null) {
  if (!dateString) return "";
  return String(dateString).slice(0, 10);
}

function getMonthKey(dateString?: string | null) {
  const datePart = getDatePart(dateString);
  return datePart ? datePart.slice(0, 7) : "";
}

function formatDateFromString(dateString?: string | null) {
  const datePart = getDatePart(dateString);
  if (!datePart) return "";

  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return datePart;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatMonthFromString(dateString?: string | null) {
  const datePart = getDatePart(dateString);
  if (!datePart) return "";

  const [year, month] = datePart.split("-").map(Number);
  if (!year || !month) return datePart;

  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function getTodayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const today = getTodayLocalDate();
  const dashboardQuery = useFetchBirthdayDashboard(today);
  const { mutateAsync: sendWAAsync, isPending: isSendingWA } = useSendWhatsAppBirthdayPray();

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const clearFormMessage = () => {
    setFormError(null);
    setFormSuccess(null);
  };

  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  const sourceRows = useMemo<DashboardBirthdayItem[]>(
    () => dashboardQuery.data ?? [],
    [dashboardQuery.data]
  );
  const totalUpcoming = sourceRows.length;
  const totalCompleted = sourceRows.filter((item) => item.sudahDidoakan).length;
  const totalWithText = sourceRows.filter((item) => item.sudahAdaPesanDoa).length;
  const totalWithVoice = sourceRows.filter((item) => item.sudahAdaPesanSuara).length;
  const totalPending = totalUpcoming - totalCompleted;

  const sortedMonthKeys = useMemo(() => {
    const keys = Array.from(
      new Set(sourceRows.map((item) => getMonthKey(item.birthdayDate)).filter(Boolean))
    );
    return keys.sort();
  }, [sourceRows]);

  const firstMonthKey = sortedMonthKeys[0] ?? "";
  const focusDonaturId = Number(location.state?.focusDonaturId ?? 0);

  const flatRows = useMemo<DashboardRow[]>(() => {
    const monthMap = new Map<string, Map<string, DashboardBirthdayItem[]>>();

    for (const item of sourceRows) {
      const dateKey = getDatePart(item.birthdayDate);
      const monthKey = getMonthKey(item.birthdayDate);

      if (!dateKey || !monthKey) continue;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, new Map<string, DashboardBirthdayItem[]>());
      }

      const dateMap = monthMap.get(monthKey)!;
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }

      dateMap.get(dateKey)!.push(item);
    }

    const result: DashboardRow[] = [];
    const sortedMonths = Array.from(monthMap.keys()).sort();

    for (const monthKey of sortedMonths) {
      const isMonthExpanded = expandedMonths[monthKey] ?? monthKey === firstMonthKey;

      const dateMap = monthMap.get(monthKey)!;
      const monthItems = Array.from(dateMap.values()).flat();
      const monthCompleteCount = monthItems.filter((item) => item.sudahDidoakan).length;
      const monthTotalCount = monthItems.length;

      result.push({
        id: `month-${monthKey}`,
        rowType: "month",
        monthKey,
        monthLabel: formatMonthFromString(`${monthKey}-01`),
        isExpanded: isMonthExpanded,
        groupLabel: isMonthExpanded ? "▼ Lihat tanggal" : "▶ Lihat tanggal",
        totalCount: monthTotalCount,
        completeCount: monthCompleteCount,
      });

      if (!isMonthExpanded) continue;

      const sortedDates = Array.from(dateMap.keys()).sort();

      for (const dateKey of sortedDates) {
        const dateExpandKey = `${monthKey}|${dateKey}`;
        const isDateExpanded = expandedDates[dateExpandKey] ?? false;
        const dateItems = dateMap.get(dateKey) ?? [];
        const dateCompleteCount = dateItems.filter((item) => item.sudahDidoakan).length;
        const dateTotalCount = dateItems.length;

        result.push({
          id: `date-${monthKey}-${dateKey}`,
          rowType: "date",
          monthKey,
          dateKey,
          dateLabel: formatDateFromString(dateKey),
          isExpanded: isDateExpanded,
          groupLabel: isDateExpanded ? "▼ Lihat donatur" : "▶ Lihat donatur",
          totalCount: dateTotalCount,
          completeCount: dateCompleteCount,
        });

        if (!isDateExpanded) continue;

        const items = (dateMap.get(dateKey) ?? []).sort((a, b) =>
          a.nama.localeCompare(b.nama)
        );

        for (const item of items) {
          result.push({
            id: `detail-${item.id_donatur}`,
            rowType: "detail",
            monthKey,
            dateKey,
            id_donatur: item.id_donatur,
            id_TRBirthdayPray: item.id_TRBirthdayPray,
            nama: item.nama,
            noHP: item.noHP,
            birthdayDate: item.birthdayDate,
            sudahDidoakan: item.sudahDidoakan,
            isWASent: item.isWASent,
          });
        }
      }
    }

    return result;
  }, [expandedDates, expandedMonths, firstMonthKey, sourceRows]);

  useEffect(() => {
    if (!focusDonaturId || sourceRows.length === 0) return;

    const target = sourceRows.find((item) => item.id_donatur === focusDonaturId);
    if (!target) return;

    const monthKey = getMonthKey(target.birthdayDate);
    const dateKey = getDatePart(target.birthdayDate);

    if (monthKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedMonths((prev) => ({
        ...prev,
        [monthKey]: true,
      }));
    }

    if (monthKey && dateKey) {
      setExpandedDates((prev) => ({
        ...prev,
        [`${monthKey}|${dateKey}`]: true,
      }));
    }
  }, [focusDonaturId, sourceRows]);

  useEffect(() => {
    if (!focusDonaturId || flatRows.length === 0) return;

    const nextIndex = flatRows.findIndex(
      (row) => row.rowType === "detail" && row.id_donatur === focusDonaturId
    );

    if (nextIndex >= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedRowIndex(nextIndex);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [flatRows, focusDonaturId, location.pathname, navigate]);

  const columns: Column<DashboardRow>[] = [
    {
      key: "group1",
      label: "Bulan / Tanggal",
      width: "280px",
      render: (row) => {
        if (row.rowType === "month") {
          return <span className="font-semibold">{row.monthLabel}</span>;
        }

        if (row.rowType === "date") {
          return <span className="pl-6 font-medium">{row.dateLabel}</span>;
        }

        return <span className="pl-12 text-slate-400">-</span>;
      },
    },
    {
      key: "nama",
      label: "Nama / Group",
      width: "1.8fr",
      render: (row) => {
        if (row.rowType === "month") {
          const isComplete = row.totalCount > 0 && row.completeCount === row.totalCount;
      return (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="rounded px-2 py-1 text-left font-semibold text-cyan-700 hover:bg-cyan-100"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedMonths((prev) => ({
                ...prev,
                [row.monthKey]: !row.isExpanded,
              }));
            }}
          >
            {row.groupLabel}
          </button>
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold text-white ${
              isComplete ? "bg-emerald-600" : "bg-rose-500"
            }`}
          >
            {isComplete ? "Complete" : "Belum Complete"} ({row.completeCount}/{row.totalCount})
          </span>
        </div>
      );
        }

        if (row.rowType === "date") {
          const dateExpandKey = `${row.monthKey}|${row.dateKey}`;

          const isComplete = row.totalCount > 0 && row.completeCount === row.totalCount;
        return (
          <div className="ml-6 flex items-center justify-between gap-3">
            <button
              type="button"
              className="rounded px-2 py-1 text-left font-medium text-sky-700 hover:bg-sky-100"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedDates((prev) => ({
                  ...prev,
                  [dateExpandKey]: !row.isExpanded,
                }));
              }}
            >
              {row.groupLabel}
            </button>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold text-white ${
                isComplete ? "bg-emerald-600" : "bg-rose-500"
              }`}
            >
              {isComplete ? "Complete" : "Belum Complete"} ({row.completeCount}/{row.totalCount})
            </span>
          </div>
        );
        }

        return <span className="pl-12">{row.nama}</span>;
      },
    },
    {
      key: "noHP",
      label: "No HP",
      width: "160px",
      render: (row) => (row.rowType === "detail" ? row.noHP : null),
    },
    {
      key: "status",
      label: "Status Doa",
      width: "170px",
      render: (row) => {
        if (row.rowType !== "detail") return null;

        return (
          <span
            className={`inline-flex rounded px-3 py-1 text-xs font-semibold text-white ${
              row.sudahDidoakan ? "bg-green-600" : "bg-red-500"
            }`}
          >
            {row.sudahDidoakan ? "Complete" : "Belum Complete"}
          </span>
        );
      },
      cellClassName: "text-center",
      headerClassName: "text-center",
    },
    {
      key: "aksi",
      label: "Aksi",
      width: "150px",
      render: (row) => {
        if (row.rowType !== "detail") return null;

        return (
          <button
            type="button"
            className="rounded bg-amber-500 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-600"
            onClick={(e) => {
              e.stopPropagation();
              handleEditRow(row);
            }}
          >
            Edit
          </button>
        );
      },
      cellClassName: "text-center",
      headerClassName: "text-center",
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      width: "160px",
      render: (row) => {
        if (row.rowType !== "detail") return null;
        if (!row.sudahDidoakan) return null;

        const currentYear = row.birthdayDate ? new Date(row.birthdayDate).getFullYear() : undefined;

        return (
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-semibold text-white transition-colors disabled:opacity-50 ${
              row.isWASent 
                ? "bg-amber-500 hover:bg-amber-600" 
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
            disabled={isSendingWA}
            onClick={async (e) => {
              e.stopPropagation();
              console.log("Sending WA to:", row.nama, "ID:", row.id_donatur, "Year:", currentYear);
              clearFormMessage();
              try {
                const result = await sendWAAsync({
                  idDonatur: row.id_donatur,
                  year: currentYear,
                });
                if (result.success) {
                  const msg = result.message || `Berhasil kirim WA ke ${row.nama}`;
                  setFormSuccess(msg);
                  alert(msg);
                  // Refresh data dashboard to update the UI status
                  dashboardQuery.refetch();
                } else {
                  const errMsg = result.message || "";
                  let friendlyMsg = "Gagal mengirim WhatsApp. ";
                  
                  if (errMsg.includes("BadRequest")) {
                    friendlyMsg += "Data tidak diterima oleh sistem (BadRequest). Mohon periksa nama Template WA di Pengaturan.";
                  } else if (errMsg.includes("401") || errMsg.includes("Unauthorized")) {
                    friendlyMsg += "Token API tidak valid atau kadaluarsa.";
                  } else {
                    friendlyMsg += "Terjadi kesalahan pada koneksi ke Gateway.";
                  }

                  setFormError(friendlyMsg);
                  alert(friendlyMsg + "\n\nDetail: " + errMsg);
                }
              } catch (err) {
                const errMsg = err instanceof Error ? err.message : "Gagal kirim WhatsApp";
                setFormError(errMsg);
                alert("Fatal Error: " + errMsg);
              }
            }}
          >
            {isSendingWA ? (
              <RefreshCcw className="h-3 w-3 animate-spin" />
            ) : row.isWASent ? (
              <RefreshCcw className="h-3 w-3" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            {row.isWASent ? "Resend WA" : "Send WA"}
          </button>
        );
      },
      cellClassName: "text-center",
      headerClassName: "text-center",
    },
  ];

  function handleRowClick(row: DashboardRow) {
    if (row.rowType === "month") {
      setExpandedMonths((prev) => ({
        ...prev,
        [row.monthKey]: !row.isExpanded,
      }));
      return;
    }

    if (row.rowType === "date") {
      const dateExpandKey = `${row.monthKey}|${row.dateKey}`;
      setExpandedDates((prev) => ({
        ...prev,
        [dateExpandKey]: !row.isExpanded,
      }));
    }
  }

  function handleRowEnter(row: DashboardRow) {
    if (row.rowType === "month" || row.rowType === "date") {
      handleRowClick(row);
      return;
    }

    navigate(`/transaksi-birthday-pray/${row.id_donatur}`, {
      state: { fromDashboard: true },
    });
  }

  function handleEditRow(row: Extract<DashboardRow, { rowType: "detail" }>) {
    const rowIndex = flatRows.findIndex((item) => item.id === row.id);
    if (rowIndex >= 0) {
      setSelectedRowIndex(rowIndex);
    }

    navigate(`/transaksi-birthday-pray/${row.id_donatur}`, {
      state: { fromDashboard: true, focusDonaturId: row.id_donatur },
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-700 p-5 text-white shadow-sm">
          <div className="text-sm font-medium text-cyan-100">Ulang Tahun Mendatang</div>
          <div className="mt-2 text-3xl font-bold">{totalUpcoming}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Sudah Complete</div>
          <div className="mt-2 text-3xl font-bold text-green-600">{totalCompleted}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Sudah Ada Pesan Doa</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">{totalWithText}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Sudah Ada Doa Suara</div>
          <div className="mt-2 text-3xl font-bold text-violet-600">{totalWithVoice}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Belum Complete</div>
          <div className="mt-2 text-3xl font-bold text-red-500">{totalPending}</div>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-800">Dashboard Birthday Donatur</h1>
        <p className="text-sm text-slate-500">
          Menampilkan donatur dengan ulang tahun berikutnya dalam 6 bulan ke depan.
        </p>
      </div>

      {formError && <StatusBanner tone="error" message={formError} />}
      {formSuccess && <StatusBanner tone="success" message={formSuccess} />}

      <div className="min-h-0 flex-1">
        <ERPGridTable<DashboardRow>
          columns={columns}
          rows={flatRows}
          loading={dashboardQuery.isLoading}
          emptyText={
            dashboardQuery.isError ? "Gagal mengambil data." : "Belum ada donatur ulang tahun mendatang."
          }
          heightMode="fill"
          className="h-full"
          page={1}
          pageSize={flatRows.length || 10}
          totalRecords={flatRows.length}
          onPageChange={() => {}}
          showPagination={false}
          selectedRowIndex={selectedRowIndex}
          onSelectedRowChange={(_, rowIndex) => setSelectedRowIndex(rowIndex)}
          onRowClick={handleRowClick}
          onRowEnter={handleRowEnter}
          autoSelectFirstRow
          autoFocus
          rowClassName={(row) => {
            if (row.rowType === "month") return "bg-slate-200 font-bold";
            if (row.rowType === "date") return "bg-slate-100";
            return "";
          }}
          selectedRowClassName="bg-cyan-100"
          selectedRowCellClassName="font-bold text-slate-900"
        />
      </div>
    </div>
  );
}
