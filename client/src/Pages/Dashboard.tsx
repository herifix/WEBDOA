import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ERPGridTable, { type Column } from "../components/Grid";
import { useFetchBirthdayDashboard } from "../hooks/react_query/useFetchTRBirthdayPray";
import type { DashboardBirthdayItem } from "../Model/ModelTRBirthdayPray";

type DashboardRow =
  | {
      id: string;
      rowType: "month";
      monthKey: string;
      monthLabel: string;
      isExpanded: boolean;
      groupLabel: string;
    }
  | {
      id: string;
      rowType: "date";
      monthKey: string;
      dateKey: string;
      dateLabel: string;
      isExpanded: boolean;
      groupLabel: string;
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

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
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

export default function DashboardPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const dashboardQuery = useFetchBirthdayDashboard(today);

  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  const sourceRows: DashboardBirthdayItem[] = dashboardQuery.data ?? [];
  const totalUpcoming = sourceRows.length;
  const totalCompleted = sourceRows.filter((item) => item.sudahDidoakan).length;
  const totalPending = totalUpcoming - totalCompleted;

  const sortedMonthKeys = useMemo(() => {
    const keys = Array.from(
      new Set(sourceRows.map((item) => getMonthKey(item.birthdayDate)).filter(Boolean))
    );
    return keys.sort();
  }, [sourceRows]);

  const firstMonthKey = sortedMonthKeys[0] ?? "";

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

      result.push({
        id: `month-${monthKey}`,
        rowType: "month",
        monthKey,
        monthLabel: formatMonthFromString(`${monthKey}-01`),
        isExpanded: isMonthExpanded,
        groupLabel: isMonthExpanded ? "▼ Lihat tanggal" : "▶ Lihat tanggal",
      });

      if (!isMonthExpanded) continue;

      const dateMap = monthMap.get(monthKey)!;
      const sortedDates = Array.from(dateMap.keys()).sort();

      for (const dateKey of sortedDates) {
        const dateExpandKey = `${monthKey}|${dateKey}`;
        const isDateExpanded = expandedDates[dateExpandKey] ?? false;

        result.push({
          id: `date-${monthKey}-${dateKey}`,
          rowType: "date",
          monthKey,
          dateKey,
          dateLabel: formatDateFromString(dateKey),
          isExpanded: isDateExpanded,
          groupLabel: isDateExpanded ? "▼ Lihat donatur" : "▶ Lihat donatur",
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
          });
        }
      }
    }

    return result;
  }, [expandedDates, expandedMonths, firstMonthKey, sourceRows]);

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
          return (
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
          );
        }

        if (row.rowType === "date") {
          const dateExpandKey = `${row.monthKey}|${row.dateKey}`;

          return (
            <button
              type="button"
              className="ml-6 rounded px-2 py-1 text-left font-medium text-sky-700 hover:bg-sky-100"
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
              navigate(`/transaksi-birthday-pray/${row.id_donatur}`);
            }}
          >
            Edit
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

    navigate(`/transaksi-birthday-pray/${row.id_donatur}`);
  }

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-700 p-5 text-white shadow-sm">
          <div className="text-sm font-medium text-cyan-100">Ulang Tahun Mendatang</div>
          <div className="mt-2 text-3xl font-bold">{totalUpcoming}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Sudah Dibuat Doa</div>
          <div className="mt-2 text-3xl font-bold text-green-600">{totalCompleted}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Belum Complete</div>
          <div className="mt-2 text-3xl font-bold text-red-500">{totalPending}</div>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-800">Dashboard Birthday Donatur</h1>
        <p className="text-sm text-slate-500">
          Menampilkan donatur dengan ulang tahun yang masih lebih besar dari tanggal hari ini
          pada tahun berjalan.
        </p>
      </div>

      <ERPGridTable<DashboardRow>
        columns={columns}
        rows={flatRows}
        loading={dashboardQuery.isLoading}
        emptyText={
          dashboardQuery.isError ? "Gagal mengambil data." : "Belum ada donatur ulang tahun mendatang."
        }
        maxHeight={560}
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
  );
}
