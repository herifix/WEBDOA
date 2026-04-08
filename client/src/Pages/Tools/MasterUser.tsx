import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import ConfirmDialog from "../../components/ConfirmDialog";
import ERPGridTable, { type Column } from "../../components/GridFullParent";
import StatusBanner from "../../components/StatusBanner";
import ERPToolbar from "../../components/ToolbarHR";
import type { MasterUserRow } from "../../Model/ModelMasterUser";
import { useFetchMasterUser } from "../../hooks/react_query/useFetchMasterUser";
import { useMasterUserPage } from "../../hooks/react_query/useMasterUserPage";
import { getMasterUserById } from "../../service/masterUserService";
import { FORM_IDS } from "../../config/formIds";
import { useFormMenuPermissions } from "../../utils/menuAccess";

export default function MasterUserPage() {
  const vm = useMasterUserPage();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, isLoading, isFetching, refetch } = useFetchMasterUser({
    pageNumber: vm.page,
    pageSize: vm.pageSize,
    search: vm.search,
  });
  const { permissions } = useFormMenuPermissions(FORM_IDS.masterUser);

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

  if (!permissions.canView) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-base font-semibold text-rose-700">
        Anda tidak memiliki akses untuk membuka form ini.
      </div>
    );
  }

  const handleRefreshGrid = () => {
    vm.setSearchInput("");
    vm.setSearch("");
    vm.setPage(1);
    refetch();
  };

  const handleDeleteClick = () => {
    if (!vm.pt || !vm.userid) {
      vm.setFormError("Pilih data dulu.");
      return;
    }

    vm.clearFormSuccess();
    setShowDeleteConfirm(true);
  };

  const showData = async (pt: string, userid: string) => {
    try {
      vm.clearFormMessage();
      const resp = await getMasterUserById(pt, userid);
      const item = resp?.data;

      if (!item) {
        vm.setFormError("Data tidak ditemukan.");
        return;
      }

      vm.setPt(item.pt ?? "");
      vm.setUserid(item.userid ?? "");
      vm.setNama(item.nama ?? "");
      vm.setLvl(String(item.lvl ?? 0));
      vm.setKunci("");
      vm.setGantiKunci(item.gantiKunci ?? false);
      vm.toView();
    } catch {
      vm.setFormError("Gagal mengambil data user.");
    }
  };

  const columns = useMemo<Column<MasterUserRow>[]>(
    () => [
      {
        key: "rowno",
        label: "No.",
        width: "70px",
        render: (_row, rowIndex) => (vm.page - 1) * vm.pageSize + rowIndex + 1,
      },
      {
        key: "pt",
        label: "PT",
        width: "120px",
      },
      {
        key: "userid",
        label: "User ID",
        width: "180px",
      },
      {
        key: "nama",
        label: "Nama",
        width: "minmax(240px, 1fr)",
      },
      {
        key: "lvl",
        label: "Level",
        width: "90px",
        cellClassName: "text-center",
        headerClassName: "text-center",
      },
      {
        key: "gantiKunci",
        label: "Ganti Kunci",
        width: "130px",
        render: (row) => (row.gantiKunci ? "Ya" : ""),
        cellClassName: "text-center",
        headerClassName: "text-center",
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
            onSave={() => {
              void vm.handleSave();
            }}
            onCancel={vm.toView}
            onDelete={handleDeleteClick}
            onRefresh={handleRefreshGrid}
            showNew={permissions.canAdd}
            showEdit={permissions.canEdit}
            showDelete={permissions.canDelete}
            showPrint={permissions.canPrint}
            showExport={false}
            showApprove={false}
            loadingSave={vm.isSaving}
          />
        </div>

        <StatusBanner tone="error" message={vm.formError} />
        <StatusBanner tone="success" message={vm.formSuccess} />

        <div className="form2col min-h-0 flex-1">
          <div className="min-w-0 p-2">
            <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-x-2 gap-y-1">
              <label className="text-sm text-slate-700">PT</label>
              <input
                value={vm.pt}
                onChange={(e) => vm.setPt(e.target.value)}
                className="inputtextbox w-full"
                readOnly={vm.mode !== vm.FORM_MODE.NEW}
              />

              <label className="text-sm text-slate-700">User ID</label>
              <input
                value={vm.userid}
                onChange={(e) => vm.setUserid(e.target.value)}
                className="inputtextbox w-full"
                readOnly={vm.mode !== vm.FORM_MODE.NEW}
              />

              <label className="text-sm text-slate-700">Nama</label>
              <input
                value={vm.nama}
                onChange={(e) => vm.setNama(e.target.value)}
                className="inputtextbox w-full"
                readOnly={vm.mode === vm.FORM_MODE.VIEW}
              />

              <label className="text-sm text-slate-700">Level</label>
              <input
                type="number"
                min={0}
                max={255}
                value={vm.lvl}
                onChange={(e) => vm.setLvl(e.target.value)}
                className="inputtextbox w-full"
                readOnly={vm.mode === vm.FORM_MODE.VIEW}
              />

              <label className="text-sm text-slate-700">
                {vm.mode === vm.FORM_MODE.NEW ? "Password" : "Password Baru"}
              </label>
              <input
                type="password"
                value={vm.kunci}
                onChange={(e) => vm.setKunci(e.target.value)}
                className="inputtextbox w-full"
                readOnly={vm.mode === vm.FORM_MODE.VIEW}
                placeholder={
                  vm.mode === vm.FORM_MODE.EDIT ? "Kosongkan jika tidak diubah" : ""
                }
              />

              <label className="text-sm text-slate-700">Ganti Kunci</label>
              <input
                type="checkbox"
                checked={vm.gantiKunci}
                className="checkboxclass"
                onChange={(e) => vm.setGantiKunci(e.target.checked)}
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
                <button type="button" className="btnfind" onClick={handleSearchGrid}>
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <ERPGridTable<MasterUserRow>
                columns={columns}
                rows={data?.data ?? []}
                loading={isLoading || isFetching}
                emptyText="Data user tidak ditemukan."
                pageSize={vm.pageSize}
                page={data?.pageNumber ?? vm.page}
                totalRecords={data?.totalRecords ?? 0}
                onPageChange={vm.setPage}
                showPagination={true}
                heightMode="fill"
                className="h-full"
                onRowClick={(row) => {
                  if (vm.mode === vm.FORM_MODE.VIEW) {
                    void showData(row.pt, row.userid);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Hapus User"
        message="Yakin mau hapus data user ini?"
        confirmLabel="Hapus"
        loading={vm.isSaving}
        onConfirm={() => {
          void vm.handleDelete();
          setShowDeleteConfirm(false);
        }}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
