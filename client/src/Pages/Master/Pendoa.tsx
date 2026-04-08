import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";

import ConfirmDialog from "../../components/ConfirmDialog";
import ERPGridTable from "../../components/GridFullParent";
import StatusBanner from "../../components/StatusBanner";
import ERPToolbar from "../../components/ToolbarHR";
import type { Column } from "../../components/GridFullParent";

import type { MasterPendoaRow } from "../../Model/ModelMasterPendoa";

import { useFetchMasterPendoa } from "../../hooks/react_query/useFetchMasterPendoa";
import { getDataById } from "../../service/masterDonaturPendoa";
import { useMasterPendoaPage } from "../../hooks/react_query/useMasterPendoaPage";

export default function MasterPendoaPage() {
  const vm = useMasterPendoaPage();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, isLoading, isFetching, refetch } = useFetchMasterPendoa({
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

  const handleDeleteClick = () => {
    if (!vm.idPendoa || Number(vm.idPendoa) <= 0) {
      vm.setFormError("Pilih data dulu.");
      return;
    }

    vm.clearFormSuccess();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    await vm.handleDelete();
    setShowDeleteConfirm(false);
  };

  const showData = async (id: number) => {
    if (!id) return;

    try {
      vm.clearFormMessage();
      const resp = await getDataById(id);
      const item = resp?.data;

      if (!item) {
        vm.setFormError("Data tidak ditemukan.");
        return;
      }

      vm.setIdPendoa(item.id_pendoa ?? 0);
      vm.setNama(item.nama ?? "");
      vm.setNohp(item.nohp ?? "");
      vm.setDfl(item.dfl ?? false);
      vm.setCreatedDate(
        item.createddate ? String(item.createddate).substring(0, 10) : ""
      );

      vm.toView();
    } catch (err) {
      console.error(err);
      vm.setFormError("Gagal mengambil data.");
    }
  };

  const columns = useMemo<Column<MasterPendoaRow>[]>(
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
        key: "nohp",
        label: "No HP",
        width: "minmax(180px, 1fr)",
      },
      {
        key: "dfl",
        label: "Default",
        width: "90px",
        render: (row) => (
          <div className="text-center">{row.dfl ? "Ya" : ""}</div>
        ),
      },
      {
        key: "createddate",
        label: "Created Date",
        width: "220px",
      },
      {
        key: "id_pendoa",
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
            onDelete={handleDeleteClick}
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

        <StatusBanner tone="error" message={vm.formError} />
        <StatusBanner tone="success" message={vm.formSuccess} />

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

              <label className="text-sm text-slate-700">No HP</label>
              <input
                value={vm.nohp}
                onChange={(e) => vm.setNohp(e.target.value)}
                className="inputtextbox w-full"
                readOnly={vm.mode === vm.FORM_MODE.VIEW}
              />

              <label className="text-sm text-slate-700">Default</label>
              <input
                type="checkbox"
                checked={vm.dfl}
                className="checkboxclass"
                onChange={(e) => vm.setDfl(e.target.checked)}
                disabled={vm.mode === vm.FORM_MODE.VIEW}
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
              <ERPGridTable<MasterPendoaRow>
                columns={columns}
                rows={data?.data ?? []}
                loading={isLoading || isFetching}
                emptyText="Data pendoa tidak ditemukan."
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
                    void showData(Number(row.id_pendoa));
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Hapus Pendoa"
        message="Yakin mau hapus data pendoa ini?"
        confirmLabel="Hapus"
        loading={vm.isSaving}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
