import { useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";

import ERPGridTable from "../../components/GridFullParent";
import ERPToolbar from "../../components/ToolbarHR";
import type { Column } from "../../components/GridFullParent";

import type { MasterDonaturRow } from "../../Model/ModelMasterDonatur";

import { useFetchMasterDonatur } from "../../hooks/react_query/useFetchMasterDonatur";
import { getDataById } from "../../service/masterDonaturService";
import { useMasterDonaturPage } from "../../hooks/react_query/useMasterDonaturPage";

export default function MasterDonaturPage() {
  const vm = useMasterDonaturPage();

  const { data, isLoading, isFetching, refetch } = useFetchMasterDonatur({
    pageNumber: vm.page,
    pageSize: vm.pageSize,
    search: vm.search,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      vm.setPage(1);
      vm.setSearch(vm.searchInput.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [vm.searchInput]);

  const handleSearchGrid = () => {
    vm.setPage(1);
    vm.setSearch(vm.searchInput.trim());
  };

  const handleRefreshGrid = () => {
    vm.setSearchInput("");
    vm.setSearch("");
    vm.setPage(1);
    refetch();
  };

  const showData = async (id: number) => {
    if (!id) return;

    try {
      const resp = await getDataById(id);
      const item = resp?.data;

      if (!item) {
        alert("Data tidak ditemukan");
        return;
      }

      vm.setIdDonatur(item.id_donatur ?? 0);
      vm.setNama(item.nama ?? "");
      vm.setTglLahir(item.tglLahir ? item.tglLahir.substring(0, 10) : "");
      vm.setCreatedDate(item.createdDate ? item.createdDate.substring(0, 10) : "");
      vm.setNohp(item.noHP ?? "");
      vm.setStatus(item.status ?? false);
      vm.setLastDonation(item.lastDonation ? item.lastDonation.substring(0, 10) : "");

      vm.toView();
    } catch (err) {
      console.error(err);
      alert("Gagal mengambil data");
    }
  };

  const columns = useMemo<Column<MasterDonaturRow>[]>(
  () => [
    {
      key: "rowno",
      label: "No.",
      width: "70px",
      render: (_row, rowIndex) => (vm.page - 1) * vm.pageSize + rowIndex + 1,
    },
    {
      key: "nama",
      label: "Nama",
      width: "minmax(220px, 1fr)",
    },
    {
      key: "tglLahir",
      label: "Tgl Lahir",
      width: "130px",
    },
    {
      key: "noHP",
      label: "No HP",
      width: "140px",
    },
    {
      key: "status",
      label: "Status",
      width: "80px",
      render: (row) => (
        <div className="text-center">
          {row.status ? "Aktif" : "Nonaktif"}
        </div>
      ),
    },
    {
      key: "lastDonation",
      label: "Last Donation",
      width: "140px",
    },
    {
      key: "createdDate",
      label: "Created Date",
      width: "180px",
    },
    {
      key: "id_donatur",
      label: "ID",
      width: "0",
      hidden: true,
    },
  ],
  [vm.page, vm.pageSize]
);

  return (
    <div className="flex h-[calc(100vh-70px)] w-full flex-col bg-slate-50 p-1 md:p-2 lg:p-0">
      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="mb-1 mt-1 shrink-0 p-0">
          <ERPToolbar
            mode={vm.mode}
            onNew={vm.handleNew}
            onEdit={vm.toEdit}
            onSave={vm.handleSave}
            onCancel={vm.toView}
            onApprove={vm.toApproved}
            onUnapprove={vm.toView}
            onPrint={() => console.log("print")}
            onDelete={vm.handleDelete}
            onRefresh={handleRefreshGrid}
            onExport={() => console.log("export")}
            loadingSave={vm.isSaving}
            customButtons={[
              {
                key: "tes",
                label: "Tes custom",
                icon: <Search className="h-4 w-4" />,
                onClick: () => console.log("tes"),
                visible: false,
              },
            ]}
            showExport={false}
            showApprove={false}
          />
        </div>

        <div className="form2col min-h-0 flex-1">
          <div className="min-w-0 p-2">
            <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-x-2 gap-y-1">
              <label className="text-sm text-slate-700">Nama</label>
              <input
                value={vm.nama}
                onChange={(e) => vm.setNama(e.target.value)}
                className="inputtextbox w-full"
                readOnly={vm.mode === vm.FORM_MODE.VIEW}
              />

              <label className="text-sm text-slate-700">Tgl Lahir</label>
              <input
                type="date"
                value={vm.tglLahir}
                onChange={(e) => vm.setTglLahir(e.target.value)}
                className="inputtextbox w-full"
                readOnly={vm.mode === vm.FORM_MODE.VIEW}
              />

              <label className="text-sm text-slate-700">No HP</label>
              <input
                value={vm.nohp}
                onChange={(e) => vm.setNohp(e.target.value)}
                className="inputtextbox w-full"
                readOnly={vm.mode === vm.FORM_MODE.VIEW}
              />

              <label className="text-sm text-slate-700">Status</label>
              <input
                type="checkbox"
                checked={vm.Status}
                className="checkboxclass"
                onChange={(e) => vm.setStatus(e.target.checked)}
                disabled={vm.mode === vm.FORM_MODE.VIEW}
              />

              <label className="text-sm text-slate-700">Last Donation</label>
              <input
                type="date"
                value={vm.lastDonation}
                onChange={(e) => vm.setLastDonation(e.target.value)}
                className="inputtextbox w-full"
                readOnly={vm.mode === vm.FORM_MODE.VIEW}
              />

              <label className="text-sm text-slate-700">Created Date</label>
              <input
                type="date"
                value={vm.createddate}
                onChange={(e) => vm.setCreatedDate(e.target.value)}
                className="inputtextbox w-full"
                readOnly={true}
              />
            </div>
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden p-2">
            <div className="mb-2 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-700"></div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-700">Search:</label>
                <input
                  className="inputtextbox"
                  value={vm.searchInput}
                  onChange={(e) => vm.setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearchGrid();
                  }}
                />
                <button
                  type="button"
                  className="btnfind"
                  onClick={handleSearchGrid}
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <ERPGridTable<MasterDonaturRow>
                columns={columns}
                rows={data?.data ?? []}
                loading={isLoading || isFetching}
                emptyText="Data donatur tidak ditemukan."
                pageSize={vm.pageSize}
                page={data?.pageNumber ?? vm.page}
                totalRecords={data?.totalRecords ?? 0}
                onPageChange={vm.setPage}
                showPagination={true}
                heightMode="fill"
                className="h-full"
                onRowDoubleClick={(row) => {
                  console.log("double click row", row);
                }}
                onRowClick={(row) => {
                  if (vm.mode === vm.FORM_MODE.VIEW) {
                    void showData(Number(row.id_donatur));
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}