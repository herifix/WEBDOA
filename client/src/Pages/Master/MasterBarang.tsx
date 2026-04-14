/* eslint-disable react-hooks/refs */
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Search } from "lucide-react";

import ERPDatePicker from "../../components/ERPDatePicker";
import ERPGridTable from "../../components/Grid";
import ERPToolbar from "../../components/ToolbarHR";
import TextBoxMst from "../../components/TextBoxMaster";
import FindDataPopup from "../../components/FindForm";

import type { FindDataRow, JenisPencarian } from "../../Model/ModelFindData";
import type { ItemMasterRow } from "../../Model/ModelMasterItem";

import { useFetchMasterItem } from "../../hooks/react_query/useFecthMasterItem";
import { getDataByCode } from "../../service/masterItemService";
import { useMasterItemPage } from "../../hooks/react_query/useMasterItemPage";
import { buildMediaUrl } from "../../config/appConfig";

export default function MasterBarangPage() {
  const vm = useMasterItemPage();
  const { search, setPage } = vm;

  const [openFind, setOpenFind] = useState(false);
  const [jenis, setJenis] = useState<JenisPencarian>("item");

  const { data, isLoading, isFetching, refetch } = useFetchMasterItem({
    pageNumber: vm.page,
    pageSize: vm.pageSize,
    search: vm.search,
  });

  useEffect(() => {
    setPage(1);
  }, [search, setPage]);

  const openPopup = (searchType: JenisPencarian) => {
    setJenis(searchType);
      console.log("Tipe search:", searchType,vm.FORM_MODE.VIEW)

    if (searchType.startsWith("data") || vm.mode !== vm.FORM_MODE.VIEW) {
      setOpenFind(true);
    }
  };

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

  const handleChangeImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("File harus berupa gambar");
      return;
    }

    vm.handleFileChange(file);
  };

  const handleRemoveImage = () => {
    vm.clearImage();
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
      vm.setPreviewUrl(buildMediaUrl(`uploads/items/${item.img1 ?? ""}`));
      
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

  const totalRecords = data?.totalRecords ?? 0;
  const currentRows = data?.data?.length ?? 0;
  const fromRow = totalRecords === 0 ? 0 : (vm.page - 1) * vm.pageSize + 1;
  const toRow = totalRecords === 0 ? 0 : (vm.page - 1) * vm.pageSize + currentRows;

  return (
    <div className="h-full w-full bg-slate-50 p-1 md:p-2 lg:p-0">
      <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="mb-1 mt-1 p-0">
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

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_380px]">
          <div className="min-w-0 p-2">
            <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-x-2 gap-y-1">
              <label className="text-sm text-slate-700">Code</label>

              <div className="flex min-w-0 items-center gap-1">
                <input
                  value={vm.itemCode}
                  onChange={(e) => vm.setItemCode(e.target.value)}
                  className="inputtextbox w-[220px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void showData(vm.itemCode);
                    }
                  }}
                />
                <button
                  className="btnfind"
                  onClick={() => openPopup("data-item")}
                  type="button"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>

              <label className="text-sm text-slate-700">Description</label>
              <input
                value={vm.itemDesc}
                onChange={(e) => vm.setItemDesc(e.target.value)}
                className="inputtextbox w-full"
              />

              <TextBoxMst
                ref={vm.classRef}
                label="Class"
                searchType="class"
                onFindClick={(searchType) => openPopup(searchType as JenisPencarian)}
              />

              <TextBoxMst
                ref={vm.baseunitRef}
                label="Base Unit"
                searchType="baseunit"
                onFindClick={(searchType) => openPopup(searchType as JenisPencarian)}
              />

              <label className="text-sm text-slate-700">Active Date</label>
              <ERPDatePicker
                selected={vm.activeDate}
                onChange={(date: Date | null) => vm.setactiveDate(date)}
                dateFormat="dd-MMM-yyyy"
                className="inputtextbox w-[165px]"
                popperClassName="z-50"
                wrapperClassName="w-[165px]"
              />

              <TextBoxMst
                ref={vm.grupRef}
                label="Grup"
                searchType="grup"
                onFindClick={(searchType) => openPopup(searchType as JenisPencarian)}
              />
            </div>
          </div>

          <div className="min-w-0 self-start p-2">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex border-b border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={() => vm.setActiveTab("general")}
                  className={`px-4 py-2 text-sm font-medium ${
                    vm.activeTab === "general"
                      ? "border-b-2 border-sky-500 bg-sky-300 text-black"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  General
                </button>

                <button
                  type="button"
                  onClick={() => vm.setActiveTab("detail")}
                  className={`px-4 py-2 text-sm font-medium ${
                    vm.activeTab === "detail"
                      ? "border-b-2 border-sky-500 bg-sky-300 text-black"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Detail
                </button>
              </div>

              <div className="p-4">
                {vm.activeTab === "general" && (
                  <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-x-2 gap-y-2">
                    <label className="text-sm text-slate-700">Code 2</label>
                    <div className="flex min-w-0 items-center gap-1">
                      <input className="inputtextbox w-[220px]" />
                      <button className="btnfind" type="button">
                        <Search className="h-4 w-4" />
                      </button>
                    </div>

                    <label className="text-sm text-slate-700">Description 2</label>
                    <input className="inputtextbox w-full" />

                    <label className="text-sm text-slate-700">Class 2</label>
                    <div className="grid min-w-0 grid-cols-[160px_36px_minmax(0,1fr)] gap-1">
                      <input className="inputtextbox w-full" />
                      <button className="btnfind" type="button">
                        <Search className="h-4 w-4" />
                      </button>
                      <input className="inputtextbox w-full" disabled />
                    </div>

                    <label className="text-sm text-slate-700">Base Unit 2</label>
                    <div className="grid min-w-0 grid-cols-[160px_36px_minmax(0,1fr)] gap-1">
                      <input className="inputtextbox w-full" />
                      <button className="btnfind" type="button">
                        <Search className="h-4 w-4" />
                      </button>
                      <input className="inputtextbox w-full" disabled />
                    </div>

                    <label className="text-sm text-slate-700">Active Date 2</label>
                    <ERPDatePicker
                      selected={vm.activeDate}
                      onChange={(date: Date | null) => vm.setactiveDate(date)}
                      dateFormat="dd-MMM-yyyy"
                      className="inputtextbox w-[165px]"
                      popperClassName="z-50"
                      wrapperClassName="w-[165px]"
                    />
                  </div>
                )}

                {vm.activeTab === "detail" && (
                  <div className="text-sm text-slate-500">Isi tab detail di sini.</div>
                )}
              </div>
            </div>
          </div>

          <div className="self-start gap-y-1 p-2">
            <label className="mb-1 block text-sm text-slate-700">Item Image</label>

            <input
              ref={vm.fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleChangeImage}
              className="inputtextbox mb-1 w-full"
            />
{/* `${http.defaults.baseURL}/uploads/items/${vm.imageFileName}` */}
            {vm.previewUrl && (
              <div className="mt-1 w-full rounded border border-slate-300 p-3">
                <div className="flex h-[200px] w-[340px] items-center justify-center overflow-hidden rounded border bg-white">
                  <img
                    src={vm.previewUrl}
                    alt="Preview"
                    className="h-full w-full object-fill"
                  />
                </div>

                <div className="hidden break-all text-sm text-slate-600">
                  {vm.imageFile?.name}
                </div>

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="mt-2 rounded bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600"
                >
                  Hapus Gambar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-700">
          Showing {fromRow} to {toRow} of {totalRecords} entries
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

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <ERPGridTable<ItemMasterRow>
          columns={columns}
          rows={data?.data ?? []}
          loading={isLoading || isFetching}
          maxHeight={610}
          emptyText="Data item tidak ditemukan."
          pageSize={vm.pageSize}
          page={data?.pageNumber ?? vm.page}
          totalRecords={data?.totalRecords ?? 0}
          onPageChange={vm.setPage}
          showPagination={true}
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
