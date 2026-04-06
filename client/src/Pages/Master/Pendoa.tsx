import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import http from "../../api/http";

import ERPGridTable from "../../components/GridFullParent";
import ERPToolbar from "../../components/ToolbarHR";
import FindDataPopup from "../../components/FindForm";

import type { FindDataRow, JenisPencarian } from "../../Model/ModelFindData";
import type { ItemMasterRow } from "../../Model/ModelMasterItem";

import { useFetchMasterItem } from "../../hooks/react_query/useFecthMasterItem";
import { getDataByCode } from "../../service/masterItemService";
import { useMasterItemPage } from "../../hooks/react_query/useMasterItemPage";

export default function MasterBarangPage() {
  const vm = useMasterItemPage();

  const [openFind, setOpenFind] = useState(false);
  const [jenis] = useState<JenisPencarian>("item");

  const { data, isLoading, isFetching, refetch } = useFetchMasterItem({
    area: vm.area,
    pageNumber: vm.page,
    pageSize: vm.pageSize,
    search: vm.search,
  });

  useEffect(() => {
    vm.setPage(1);
  }, [vm.search]);


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

  //@todo Show Data
  const showData = async (code: string) => {
    if (!code) return;

    try {
      const resp = await getDataByCode(code, vm.area);
      const item = resp?.data;

      if (!item) {
        alert("Data tidak ditemukan");
        return;
      }

      vm.setIdItem(item.iditem ?? "");
      vm.setItemCode(item.code ?? "");
      vm.setItemDesc(item.name ?? "");
      vm.setBaseUnitCode(item.baseunitcode ?? "");
      vm.setBaseUnitName(item.baseunitname ?? "");
      vm.setClassCode(item.classcode ?? "");
      vm.setClassName(item.classname ?? "");
      vm.setGrupCode(item.grupcode ?? "");
      vm.setGrupName(item.grupname ?? "");
      vm.setactiveDate(item.activedate ?? "");

      vm.classRef.current?.setValue(item.classcode ?? "", item.classname ?? "");
      vm.baseunitRef.current?.setValue(item.baseunitcode ?? "", item.baseunitname ?? "");
      vm.grupRef.current?.setValue(item.grupcode ?? "", item.grupname ?? "");

      vm.setImageFileName(item.img1 ?? ""); 
      vm.setImageFile(item.img1.split(/[\\/]/).pop() ?? "");
      vm.setPreviewUrl(`${http.defaults.baseURL}/uploads/items/${item.img1 ?? ""}`);
      
      {/* `${http.defaults.baseURL}/uploads/items/${item.img1 ?? ""}` */}


      vm.toView();
    } catch (err) {
      console.error(err);
      alert("Gagal mengambil data");
    }
  };

  const handleSelected = async (row: FindDataRow) => {
    setOpenFind(false);

    switch (jenis) {
      case "item":
      case "data-item":
        await showData(row.code);
        break;

      case "class":
        vm.setClassCode(row.code);
        vm.setClassName(row.description);
        vm.classRef.current?.setValue(row.code, row.description);
        break;

      case "baseunit":
        vm.setBaseUnitCode(row.code);
        vm.setBaseUnitName(row.description);
        vm.baseunitRef.current?.setValue(row.code, row.description);
        break;

      case "grup":
        vm.setGrupCode(row.code);
        vm.setGrupName(row.description);
        vm.grupRef.current?.setValue(row.code, row.description);
        break;

      case "warehouse":
        vm.warehouseRef.current?.setValue(row.code, row.description);
        break;

      default:
        console.log("searchType tidak dikenal:", jenis);
        break;
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "rowno",
        label: "No.",
        width: "70px",
        render: (_row: ItemMasterRow, rowIndex: number) =>
          (vm.page - 1) * vm.pageSize + rowIndex + 1,
      },
      { key: "code", label: "Item Code", width: "180px" },
      { key: "name", label: "Item Name", width: "minmax(300px, 1fr)" },
      { key: "classcode", label: "Class", width: "140px" },
      { key: "classname", label: "Class Name", width: "220px" },
      { key: "baseunitcode", label: "Unit", width: "100px" },
      { key: "baseunitname", label: "Unit Name", width: "180px" },
      {
        key: "activedate",
        label: "Active Date",
        width: "140px",
        render: (row: ItemMasterRow) =>
          row.activedate
            ? new Date(row.activedate).toLocaleDateString("id-ID")
            : "",
      },
    ],
    [vm.page, vm.pageSize]
  );

  return (
  <div className="flex h-[calc(100vh-70px)] w-full flex-col bg-slate-50 p-1 md:p-2 lg:p-0">
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <div className="mb-1 mt-1 p-0 shrink-0">
        <ERPToolbar
          mode={vm.mode}
          onNew={vm.handleNew}
          onEdit={vm.toEdit}
          onSave={vm.handleSave}
          onCancel={vm.toView}
          onApprove={vm.toApproved}
          onUnapprove={vm.toView}
          onPrint={() => console.log("print")}
          onDelete={() => console.log("delete")}
          onRefresh={handleRefreshGrid}
          onExport={() => console.log("export")}
          loadingSave={vm.isSaving}
          customButtons={[
            {
              key: "tes",
              label: "Tes custome",
              icon: <Search className="h-4 w-4" />,
              onClick: () => console.log("tes"),
            },
          ]}
          showExport={false}
        />
      </div>

      <div className="form2col min-h-0 flex-1">
        <div className="min-w-0 p-2">
          <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-x-2 gap-y-1">

            <label className="text-sm text-slate-700">Nama</label>
            <input
              value={vm.itemDesc}
              onChange={(e) => vm.setItemDesc(e.target.value)}
              className="inputtextbox w-full"
            />

            <label className="text-sm text-slate-700">No HP</label>
            <input
              value={vm.itemDesc}
              onChange={(e) => vm.setItemDesc(e.target.value)}
              className="inputtextbox w-full"
            />

            <label className="text-sm text-slate-700">Default</label>
            <input
              type="checkbox"
              checked={true}
              className="checkboxclass"
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden p-2">
          <div className="mb-2 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-700">
              
            </div>

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
            <ERPGridTable<ItemMasterRow>
              columns={columns}
                rows={data?.data ?? []}
                loading={isLoading || isFetching}
                emptyText="Data item tidak ditemukan."
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
                if (vm.mode === "view") {
                  void showData(row.code);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>

    <FindDataPopup
      open={openFind}
      jenisPencarian={jenis}
      title="Find Data"
      onSelect={handleSelected}
      onClose={() => setOpenFind(false)}
    />
  </div>
);
}