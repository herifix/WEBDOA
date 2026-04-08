import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
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

function normalizeMenuKey(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

export default function MasterUserPage() {
  const vm = useMasterUserPage();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copySearchInput, setCopySearchInput] = useState("");
  const [copySearch, setCopySearch] = useState("");
  const [copyPage, setCopyPage] = useState(1);

  const { data, isLoading, isFetching, refetch } = useFetchMasterUser({
    pageNumber: vm.page,
    pageSize: vm.pageSize,
    search: vm.search,
  });
  const copyUserQuery = useFetchMasterUser({
    pageNumber: copyPage,
    pageSize: 8,
    search: copySearch,
  });
  const { permissions } = useFormMenuPermissions(FORM_IDS.masterUser);

  useEffect(() => {
    const timer = setTimeout(() => {
      vm.setPage(1);
      vm.setSearch(vm.searchInput.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [vm.searchInput]);

  useEffect(() => {
    void vm.loadPermissions("", "");
  }, []);

  useEffect(() => {
    if (!showCopyDialog) return;

    const timer = setTimeout(() => {
      setCopyPage(1);
      setCopySearch(copySearchInput.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [copySearchInput, showCopyDialog]);

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
      await vm.loadPermissions(item.pt ?? "", item.userid ?? "");
      vm.toView();
    } catch (error) {
      vm.setFormError(
        error instanceof Error ? error.message : "Gagal mengambil data user."
      );
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

  const visiblePermissions = useMemo(
    () =>
      vm.permissions.filter(
        (item) => !item.asParent && normalizeMenuKey(item.formName) !== "home"
      ),
    [vm.permissions]
  );

  const handlePermissionToggle = (
    idForm: number,
    key: "canView" | "canAdd" | "canEdit" | "canPrint" | "canDelete",
    checked: boolean
  ) => {
    if (vm.mode === vm.FORM_MODE.VIEW) return;

    if (key === "canView" && !checked) {
      vm.setPermissions((current) =>
        current.map((item) =>
          item.id_form !== idForm
            ? item
            : {
                ...item,
                canView: false,
                canAdd: false,
                canEdit: false,
                canPrint: false,
                canDelete: false,
              }
        )
      );
      return;
    }

    vm.updatePermission(idForm, key, checked);

    if (checked && key !== "canView") {
      vm.updatePermission(idForm, "canView", true);
    }
  };

  const allChecked = useMemo(
    () => ({
      canView:
        visiblePermissions.length > 0 &&
        visiblePermissions.every((item) => item.canView),
      canAdd:
        visiblePermissions.length > 0 &&
        visiblePermissions.every((item) => item.canAdd),
      canEdit:
        visiblePermissions.length > 0 &&
        visiblePermissions.every((item) => item.canEdit),
      canPrint:
        visiblePermissions.length > 0 &&
        visiblePermissions.every((item) => item.canPrint),
      canDelete:
        visiblePermissions.length > 0 &&
        visiblePermissions.every((item) => item.canDelete),
    }),
    [visiblePermissions]
  );

  const visiblePermissionIds = useMemo(
    () => visiblePermissions.map((item) => item.id_form),
    [visiblePermissions]
  );

  const copyRows = useMemo(
    () =>
      (copyUserQuery.data?.data ?? []).filter(
        (row) => !(row.pt === vm.pt && row.userid === vm.userid)
      ),
    [copyUserQuery.data?.data, vm.pt, vm.userid]
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
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-2">
            <div className="shrink-0 grid grid-cols-[110px_minmax(0,1fr)] items-center gap-x-2 gap-y-1">
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
                {vm.mode === vm.FORM_MODE.NEW ? "Password" : "Password"}
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

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
              <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-800">Hak Akses Per Modul</div>
                  <button
                    type="button"
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => {
                      setCopySearchInput("");
                      setCopySearch("");
                      setCopyPage(1);
                      setShowCopyDialog(true);
                    }}
                    disabled={vm.mode === vm.FORM_MODE.VIEW || vm.isLoadingPermissions}
                  >
                    Copy Hak Akses
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700">
                    <tr>
                      <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold">
                        Urut
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold">
                        Modul
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold">
                        Posisi Sidebar
                      </th>
                      <th className="border-b border-slate-200 px-2 py-2 text-center font-semibold">
                        <div className="flex flex-col items-center gap-1 leading-none">
                          <span className="text-[11px] uppercase tracking-wide text-slate-600">
                            Full
                          </span>
                          <span className="text-[11px] uppercase tracking-wide text-slate-600">
                            Akses
                          </span>
                        </div>
                      </th>
                      <th className="border-b border-slate-200 px-2 py-2 text-center font-semibold">
                        <label className="flex flex-col items-center gap-1 leading-none">
                          <span className="text-[11px] uppercase tracking-wide text-slate-600">
                            View
                          </span>
                          <input
                            type="checkbox"
                            className="checkboxclass"
                            checked={allChecked.canView}
                            onChange={(e) =>
                              vm.setPermissionColumn(
                                "canView",
                                e.target.checked,
                                visiblePermissionIds
                              )
                            }
                            disabled={vm.mode === vm.FORM_MODE.VIEW || visiblePermissions.length === 0}
                          />
                        </label>
                      </th>
                      <th className="border-b border-slate-200 px-2 py-2 text-center font-semibold">
                        <label className="flex flex-col items-center gap-1 leading-none">
                          <span className="text-[11px] uppercase tracking-wide text-slate-600">
                            New
                          </span>
                          <input
                            type="checkbox"
                            className="checkboxclass"
                            checked={allChecked.canAdd}
                            onChange={(e) =>
                              vm.setPermissionColumn(
                                "canAdd",
                                e.target.checked,
                                visiblePermissionIds
                              )
                            }
                            disabled={vm.mode === vm.FORM_MODE.VIEW || visiblePermissions.length === 0}
                          />
                        </label>
                      </th>
                      <th className="border-b border-slate-200 px-2 py-2 text-center font-semibold">
                        <label className="flex flex-col items-center gap-1 leading-none">
                          <span className="text-[11px] uppercase tracking-wide text-slate-600">
                            Edit
                          </span>
                          <input
                            type="checkbox"
                            className="checkboxclass"
                            checked={allChecked.canEdit}
                            onChange={(e) =>
                              vm.setPermissionColumn(
                                "canEdit",
                                e.target.checked,
                                visiblePermissionIds
                              )
                            }
                            disabled={vm.mode === vm.FORM_MODE.VIEW || visiblePermissions.length === 0}
                          />
                        </label>
                      </th>
                      <th className="border-b border-slate-200 px-2 py-2 text-center font-semibold">
                        <label className="flex flex-col items-center gap-1 leading-none">
                          <span className="text-[11px] uppercase tracking-wide text-slate-600">
                            Print
                          </span>
                          <input
                            type="checkbox"
                            className="checkboxclass"
                            checked={allChecked.canPrint}
                            onChange={(e) =>
                              vm.setPermissionColumn(
                                "canPrint",
                                e.target.checked,
                                visiblePermissionIds
                              )
                            }
                            disabled={vm.mode === vm.FORM_MODE.VIEW || visiblePermissions.length === 0}
                          />
                        </label>
                      </th>
                      <th className="border-b border-slate-200 px-2 py-2 text-center font-semibold">
                        <label className="flex flex-col items-center gap-1 leading-none">
                          <span className="text-[11px] uppercase tracking-wide text-slate-600">
                            Del
                          </span>
                          <input
                            type="checkbox"
                            className="checkboxclass"
                            checked={allChecked.canDelete}
                            onChange={(e) =>
                              vm.setPermissionColumn(
                                "canDelete",
                                e.target.checked,
                                visiblePermissionIds
                              )
                            }
                            disabled={vm.mode === vm.FORM_MODE.VIEW || visiblePermissions.length === 0}
                          />
                        </label>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {vm.isLoadingPermissions ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-3 py-6 text-center text-sm text-slate-500"
                        >
                          Mengambil data hak akses...
                        </td>
                      </tr>
                    ) : vm.permissions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-3 py-6 text-center text-sm text-slate-500"
                        >
                          Belum ada data modul dari `MsMenuTree` atau `MsForm`.
                        </td>
                      </tr>
                    ) : (
                      visiblePermissions.map((item) => (
                        <tr
                          key={item.id_form}
                          className="odd:bg-white even:bg-slate-50/70 hover:bg-cyan-50/60"
                        >
                          <td className="border-b border-slate-100 px-3 py-2 align-top text-slate-600">
                            {item.positionCode}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-2 align-top">
                            <div
                              className="font-medium text-slate-800"
                              style={{ paddingLeft: `${Math.max(item.lvl - 1, 0) * 16}px` }}
                            >
                              {item.formName}
                            </div>
                            <div className="text-xs text-slate-400">ID Form: {item.id_form}</div>
                          </td>
                          <td className="border-b border-slate-100 px-3 py-2 align-top text-xs text-slate-500">
                            {item.positionLabel}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              className="checkboxclass"
                              checked={
                                item.canView &&
                                item.canAdd &&
                                item.canEdit &&
                                item.canPrint &&
                                item.canDelete
                              }
                              onChange={(e) =>
                                vm.setPermissionRowAll(item.id_form, e.target.checked)
                              }
                              disabled={vm.mode === vm.FORM_MODE.VIEW}
                            />
                          </td>
                          <td className="border-b border-slate-100 px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              className="checkboxclass"
                              checked={item.canView}
                              onChange={(e) =>
                                handlePermissionToggle(item.id_form, "canView", e.target.checked)
                              }
                              disabled={vm.mode === vm.FORM_MODE.VIEW}
                            />
                          </td>
                          <td className="border-b border-slate-100 px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              className="checkboxclass"
                              checked={item.canAdd}
                              onChange={(e) =>
                                handlePermissionToggle(item.id_form, "canAdd", e.target.checked)
                              }
                              disabled={vm.mode === vm.FORM_MODE.VIEW}
                            />
                          </td>
                          <td className="border-b border-slate-100 px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              className="checkboxclass"
                              checked={item.canEdit}
                              onChange={(e) =>
                                handlePermissionToggle(item.id_form, "canEdit", e.target.checked)
                              }
                              disabled={vm.mode === vm.FORM_MODE.VIEW}
                            />
                          </td>
                          <td className="border-b border-slate-100 px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              className="checkboxclass"
                              checked={item.canPrint}
                              onChange={(e) =>
                                handlePermissionToggle(item.id_form, "canPrint", e.target.checked)
                              }
                              disabled={vm.mode === vm.FORM_MODE.VIEW}
                            />
                          </td>
                          <td className="border-b border-slate-100 px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              className="checkboxclass"
                              checked={item.canDelete}
                              onChange={(e) =>
                                handlePermissionToggle(item.id_form, "canDelete", e.target.checked)
                              }
                              disabled={vm.mode === vm.FORM_MODE.VIEW}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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

      {showCopyDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <div className="text-base font-semibold text-slate-800">Copy Hak Akses</div>
                <div className="text-sm text-slate-500">Pilih user sumber untuk menyalin hak akses.</div>
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                onClick={() => setShowCopyDialog(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <input
                  className="inputtextbox flex-1"
                  value={copySearchInput}
                  onChange={(e) => setCopySearchInput(e.target.value)}
                  placeholder="Cari PT, User ID, atau Nama"
                />
                <button
                  type="button"
                  className="btnfind"
                  onClick={() => {
                    setCopyPage(1);
                    setCopySearch(copySearchInput.trim());
                  }}
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-4">
              <ERPGridTable<MasterUserRow>
                columns={columns}
                rows={copyRows}
                loading={copyUserQuery.isLoading || copyUserQuery.isFetching}
                emptyText="User sumber tidak ditemukan."
                pageSize={8}
                page={copyUserQuery.data?.pageNumber ?? copyPage}
                totalRecords={copyUserQuery.data?.totalRecords ?? 0}
                onPageChange={setCopyPage}
                showPagination={true}
                heightMode="fixed"
                onRowClick={(row) => {
                  void vm.copyPermissionsFromUser(row.pt, row.userid).then((success) => {
                    if (success) {
                      setShowCopyDialog(false);
                    }
                  });
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
