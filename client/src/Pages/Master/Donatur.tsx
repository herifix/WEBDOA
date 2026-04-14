import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import ConfirmDialog from "../../components/ConfirmDialog";
import CountryPhoneInput from "../../components/CountryPhoneInput";
import ERPDatePicker from "../../components/ERPDatePicker";
import ERPGridTable from "../../components/GridFullParent";
import StatusBanner from "../../components/StatusBanner";
import ERPToolbar from "../../components/ToolbarHR";
import type { Column } from "../../components/GridFullParent";

import { FORM_IDS } from "../../config/formIds";
import { useFormMenuPermissions } from "../../utils/menuAccess";
import type { MasterDonaturRow } from "../../Model/ModelMasterDonatur";
import {
  normalizeInternationalPhoneNumber,
} from "../../utils/validation";

import { useFetchMasterDonatur } from "../../hooks/react_query/useFetchMasterDonatur";
import { getDataById } from "../../service/masterDonaturService";
import { useMasterDonaturPage } from "../../hooks/react_query/useMasterDonaturPage";

export default function MasterDonaturPage() {
  const vm = useMasterDonaturPage();
  const { searchInput, setPage, setSearch } = vm;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const gridDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    []
  );

  const parseInputDate = (value: string) => {
    if (!value) return null;

    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return null;

    return new Date(year, month - 1, day);
  };

  const formatInputDate = (date: Date | null) => {
    if (!date) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const formatGridDate = useCallback((value: string | null | undefined) => {
    if (!value) return "";

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return value;

    return gridDateFormatter.format(parsedDate);
  }, [gridDateFormatter]);

  const { data, isLoading, isFetching, refetch } = useFetchMasterDonatur({
    pageNumber: vm.page,
    pageSize: vm.pageSize,
    search: vm.search,
  });

  const { permissions } = useFormMenuPermissions(FORM_IDS.masterDonatur);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, setPage, setSearch]);

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
    if (!vm.idDonatur || Number(vm.idDonatur) <= 0) {
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

      vm.setIdDonatur(String(item.id_donatur ?? 0));
      vm.setNama(item.nama ?? "");
      vm.setTglLahir(item.tglLahir ? item.tglLahir.substring(0, 10) : "");
      vm.setCreatedDate(item.createdDate ? item.createdDate.substring(0, 10) : "");
      vm.setNohp(normalizeInternationalPhoneNumber(item.noHP ?? item.nohp ?? ""));
      vm.setStatus(item.status ?? false);
      vm.setLastDonation(item.lastDonation ? item.lastDonation.substring(0, 10) : "");
      vm.setInitialLastDonation(
        item.lastDonation ? item.lastDonation.substring(0, 10) : ""
      );

      vm.toView();
    } catch (err) {
      console.error(err);
      vm.setFormError("Gagal mengambil data.");
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
      render: (row) => formatGridDate(row.tglLahir),
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
  [formatGridDate, vm.page, vm.pageSize]
);

  if (!permissions.canView) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-base font-semibold text-rose-700">
        Anda tidak memiliki akses untuk membuka form ini.
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-70px)] w-full flex-col bg-slate-50 p-1 md:p-2 lg:p-0">
      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="mb-1 mt-1 shrink-0 p-0">
          <ERPToolbar
            mode={vm.mode}
            permissions={{
              canAdd: permissions.canAdd,
              canEdit: permissions.canEdit,
              canDelete: permissions.canDelete,
              canPrint: permissions.canPrint,
            }}
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

              <label className="text-sm text-slate-700">Tgl Lahir</label>
              <ERPDatePicker
                selected={parseInputDate(vm.tglLahir)}
                onChange={(date: Date | null) =>
                  vm.setTglLahir(formatInputDate(date))
                }
                dateFormat="dd-MMM-yyyy"
                className="inputtextbox w-full"
                wrapperClassName="w-full"
                popperClassName="z-50"
                disabled={vm.mode === vm.FORM_MODE.VIEW}
                isClearable={vm.mode !== vm.FORM_MODE.VIEW}
              />

              <label className="text-sm text-slate-700">No HP</label>
              <div className="space-y-1">
                <CountryPhoneInput
                  value={vm.nohp}
                  onChange={vm.setNohp}
                  readOnly={vm.mode === vm.FORM_MODE.VIEW}
                />
                <div className="text-xs text-slate-500">
                  Pilih kode negara lalu isi nomor tanpa awalan `0`.
                </div>
              </div>

              <label className="text-sm text-slate-700">Status</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={vm.Status}
                  className="checkboxclass"
                  onChange={(e) => vm.setStatus(e.target.checked)}
                  disabled={vm.mode === vm.FORM_MODE.VIEW}
                />
                <span className="text-sm text-slate-700">
                  {vm.Status ? "Aktif" : "Nonaktif"}
                </span>
              </div>

              <label className="text-sm text-slate-700">Last Donation</label>
              <ERPDatePicker
                selected={parseInputDate(vm.lastDonation)}
                onChange={(date: Date | null) =>
                  vm.setLastDonationWithAutoStatus(formatInputDate(date))
                }
                dateFormat="dd-MMM-yyyy"
                className="inputtextbox w-full"
                wrapperClassName="w-full"
                popperClassName="z-50"
                disabled={vm.mode === vm.FORM_MODE.VIEW}
                isClearable={vm.mode !== vm.FORM_MODE.VIEW}
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

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Hapus Donatur"
        message="Yakin mau hapus data donatur ini?"
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
