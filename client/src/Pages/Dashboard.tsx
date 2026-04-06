import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ERPGridTable, { type Column } from "../components/Grid";
import { useFetchDonaturDashboard } from "../hooks/react_query/useFetchMasterDonatur";

type DonaturRow = {
  id_donatur: number;
  nama: string;
  tglLahir: string;
  createdDate: string;
  noHP: string;
  status: boolean;
  lastDonation: string | null;
};

type DashboardRow =
  | {
      id: string;
      rowType: "month";
      monthKey: string;
      monthLabel: string;
      isExpanded: boolean;
      groupLabel: string;
      statusText: string;
      aksi: string;
    }
  | {
      id: string;
      rowType: "date";
      monthKey: string;
      dateKey: string;
      dateLabel: string;
      isExpanded: boolean;
      groupLabel: string;
      statusText: string;
      aksi: string;
    }
  | {
      id: string;
      rowType: "detail";
      id_donatur: number;
      monthKey: string;
      dateKey: string;
      nama: string;
      noHP: string;
      status: boolean;
      statusText: string;
      aksi: string;
    };

function getDatePart(dateString?: string) {
  if (!dateString) return "";
  return String(dateString).slice(0, 10);
}

function getMonthKey(dateString?: string) {
  const datePart = getDatePart(dateString);
  return datePart ? datePart.slice(0, 7) : "";
}

function formatDateFromString(dateString?: string) {
  const datePart = getDatePart(dateString);
  if (!datePart) return "";

  const parts = datePart.split("-");
  if (parts.length !== 3) return datePart;

  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

function formatMonthFromString(dateString?: string) {
  const datePart = getDatePart(dateString);
  if (!datePart) return "";

  const parts = datePart.split("-");
  if (parts.length < 2) return datePart;

  const [year, month] = parts;
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const monthIndex = Number(month) - 1;
  if (monthIndex < 0 || monthIndex > 11) return `${month}/${year}`;

  return `${monthNames[monthIndex]} ${year}`;
}

export default function DonaturDashboardPage() {
  const navigate = useNavigate();

  const dashboardQuery = useFetchDonaturDashboard(
    new Date().toISOString().slice(0, 10)
  );

  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>(
    {}
  );
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  const sourceRows: DonaturRow[] = dashboardQuery.data ?? [];

  const sortedMonthKeys = useMemo(() => {
    const keys = Array.from(
      new Set(sourceRows.map((x) => getMonthKey(x.tglLahir)).filter(Boolean))
    );
    return keys.sort();
  }, [sourceRows]);

  const firstMonthKey = sortedMonthKeys[0] ?? "";

  const flatRows = useMemo<DashboardRow[]>(() => {
    const monthMap = new Map<string, Map<string, DonaturRow[]>>();

    for (const item of sourceRows) {
      const dateKey = getDatePart(item.tglLahir);
      const monthKey = getMonthKey(item.tglLahir);

      if (!dateKey || !monthKey) continue;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, new Map<string, DonaturRow[]>());
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
      const isMonthExpanded =
        expandedMonths[monthKey] ?? monthKey === firstMonthKey;

      result.push({
        id: `month-${monthKey}`,
        rowType: "month",
        monthKey,
        monthLabel: formatMonthFromString(`${monthKey}-01`),
        isExpanded: isMonthExpanded,
        groupLabel: isMonthExpanded ? "▼ Lihat tanggal" : "▶ Lihat tanggal",
        statusText: "",
        aksi: "",
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
          groupLabel: isDateExpanded ? "▼ Lihat Donatur" : "▶ Lihat Donatur",
          statusText: "",
          aksi: "",
        });

        if (!isDateExpanded) continue;

        const items = dateMap.get(dateKey) ?? [];

        for (const item of items) {
          result.push({
            id: `detail-${item.id_donatur}`,
            rowType: "detail",
            id_donatur: item.id_donatur,
            monthKey,
            dateKey,
            nama: item.nama,
            noHP: item.noHP,
            status: item.status,
            statusText: item.status ? "Complete" : "Belum Complete",
            aksi: "",
          });
        }
      }
    }

    return result;
  }, [sourceRows, expandedMonths, expandedDates, firstMonthKey]);

  const columns: Column<DashboardRow>[] = [
    {
      key: "group1",
      label: "Bulan / Tanggal",
      width: "260px",
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
      key: "statusText",
      label: "Status",
      width: "180px",
      render: (row) => {
        if (row.rowType !== "detail") return null;

        return (
          <button
            type="button"
            className={`rounded px-3 py-1 text-xs font-semibold text-white ${
              row.status ? "bg-green-600" : "bg-red-500"
            }`}
            tabIndex={-1}
          >
            {row.status ? "Complete" : "Belum Complete"}
          </button>
        );
      },
      cellClassName: "text-center",
      headerClassName: "text-center",
    },
    {
      key: "aksi",
      label: "Aksi",
      width: "140px",
      render: (row) => {
        if (row.rowType !== "detail") return null;

        return (
          <button
            type="button"
            className="rounded bg-amber-500 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-600"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/donatur/${row.id_donatur}`);
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
      return;
    }

    navigate(`/donatur/${row.id_donatur}`);
  }

  return (
    <div className="space-y-3 p-4 text-7xl font-bold">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Dashboard Donatur</h1>
        <p className="text-sm text-slate-500">
          Grouping per bulan lalu per tanggal lahir.
        </p>
      </div>

      <ERPGridTable<DashboardRow>
        columns={columns}
        rows={flatRows}
        loading={dashboardQuery.isLoading}
        emptyText={
          dashboardQuery.isError ? "Gagal mengambil data." : "Data tidak ditemukan."
        }
        maxHeight={500}
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

//import bgDashboard from "../assets/bg-dashboard.png";

// export default function Dashboard() {
//   return (
//     <div className="h-full w-full p-6">
//       <div className="rounded-2xl bg-gradient-to-r from-sky-700 to-cyan-600 p-6 text-white shadow-lg">
//         <h1 className="text-3xl font-bold">Dashboard</h1>
//         <p className="mt-2 text-sm text-cyan-100">Login berhasil 🎉</p>
//       </div>

//       <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
//         <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
//           <h2 className="text-sm font-semibold text-slate-500">Total Barang</h2>
//           <p className="mt-2 text-2xl font-bold text-slate-800">1,250</p>
//         </div>

//         <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
//           <h2 className="text-sm font-semibold text-slate-500">Customer</h2>
//           <p className="mt-2 text-2xl font-bold text-slate-800">325</p>
//         </div>

//         <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
//           <h2 className="text-sm font-semibold text-slate-500">Supplier</h2>
//           <p className="mt-2 text-2xl font-bold text-slate-800">87</p>
//         </div>

//         <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
//           <h2 className="text-sm font-semibold text-slate-500">Transaksi Hari Ini</h2>
//           <p className="mt-2 text-2xl font-bold text-slate-800">142</p>
//         </div>
//       </div>
//     </div>
//   );
// }