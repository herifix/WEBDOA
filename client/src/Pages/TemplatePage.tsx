import { useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
//import { Search, CalendarDays, Send, Check, X, Trash2, Plus,Printer,Pencil,RefreshCw,CircleX, Save } from "lucide-react";
import ERPDatePicker from "../components/ERPDatePicker";
import ERPToolbar from "../components/ToolbarHR";
import { FORM_MODE } from "../TypeData/forMode";

type ItemRow = {
  id: number;
  checked: boolean;
  approved: boolean;
  kodeBarang: string;
  namaBarang: string;
  warna: string;
  kirimDus: number;
  kirimPasang: number;
  terimaDus: number;
  terimaPasang: number;
  harga: number;
  keterangan: string;
};



const dummyData: ItemRow[] = [
  {
    id: 1,
    checked: false,
    approved: false,
    kodeBarang: "82HLDN25B.201.014",
    namaBarang: "SANDAL HOLDEN - MI",
    warna: "HITAM",
    kirimDus: 1,
    kirimPasang: 6,
    terimaDus: 0,
    terimaPasang: 0,
    harga: 109900,
    keterangan: "Selisih Lebih Qty Dus - Selisih Lebih Qty Pasang",
  },
  {
    id: 2,
    checked: false,
    approved: false,
    kodeBarang: "82HLDN25B.206.014",
    namaBarang: "SANDAL HOLDEN - MI",
    warna: "COKLAT",
    kirimDus: 1,
    kirimPasang: 6,
    terimaDus: 0,
    terimaPasang: 0,
    harga: 109900,
    keterangan: "Selisih Lebih Qty Dus - Selisih Lebih Qty Pasang",
  },
  {
    id: 3,
    checked: false,
    approved: false,
    kodeBarang: "82HRVY25B.201.014",
    namaBarang: "SANDAL HARVEY - MI",
    warna: "HITAM",
    kirimDus: 1,
    kirimPasang: 6,
    terimaDus: 0,
    terimaPasang: 0,
    harga: 109900,
    keterangan: "Selisih Lebih Qty Dus - Selisih Lebih Qty Pasang",
  },
];

function formatRupiah(value: number) {
  return value.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function MasterBarangPage() {
  const [rows, setRows] = useState<ItemRow[]>(dummyData);
  const [search, setSearch] = useState("");
  const [activeDate, setactiveDate] = useState<Date | null>(new Date());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChangeImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // validasi sederhana
    if (!file.type.startsWith("image/")) {
      alert("File harus berupa gambar");
      return;
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;

    return rows.filter(
      (row) =>
        row.kodeBarang.toLowerCase().includes(q) ||
        row.namaBarang.toLowerCase().includes(q) ||
        row.warna.toLowerCase().includes(q) ||
        row.keterangan.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const updateQty = (id: number, field: "terimaPasang", delta: number) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: Math.max(0, row[field] + delta),
            }
          : row
      )
    );
  };

  const toggleCheckAll = (checked: boolean) => {
    setRows((prev) => prev.map((row) => ({ ...row, checked })));
  };

  const toggleRowCheck = (id: number, checked: boolean) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, checked } : row))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      {/* FILTER / FORM HEADER */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* TOOLBAR */}
        <div className="mb-4 flex flex-wrap gap-1">
          <ERPToolbar
            mode={FORM_MODE.VIEW}
            onNew={() => console.log("new")}
            onEdit={() => console.log("edit")}
            onSave={() => console.log("save")}
            onPrint={() => console.log("print")}
            onApprove={() => console.log("approve")}
            onUnapprove={() => console.log("unapprove")}
            onDelete={() => console.log("delete")}
            onRefresh={() => console.log("refresh")}
            showExport={false}
          />
        </div>

        {/* FORM ERP */}
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_380px] gap-6 items-start">
          {/* KOLOM KIRI */}
          <div className="min-w-0">
            <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-2 gap-y-1 items-center">
              <label className="text-sm text-slate-700">Code</label>
              <div className="flex items-center gap-1 min-w-0">
                <input className="inputtextbox w-[220px]" />
                <button className="btnfind">
                  <Search className="h-4 w-4" />
                </button>
              </div>

              <label className="text-sm text-slate-700">Description</label>
              <input className="inputtextbox w-full" />

              <label className="text-sm text-slate-700">Class</label>
              <div className="grid grid-cols-[160px_36px_minmax(0,1fr)] gap-1 min-w-0">
                <input className="inputtextbox w-full" />
                <button className="btnfind">
                  <Search className="h-4 w-4" />
                </button>
                <input className="inputtextbox w-full" disabled />
              </div>

              <label className="text-sm text-slate-700">Base Unit</label>
              <div className="grid grid-cols-[160px_36px_minmax(0,1fr)] gap-1 min-w-0">
                <input className="inputtextbox w-full" />
                <button className="btnfind">
                  <Search className="h-4 w-4" />
                </button>
                <input className="inputtextbox w-full" disabled />
              </div>

              <label className="text-sm text-slate-700">Active Date</label>
              <ERPDatePicker
                selected={activeDate}
                onChange={(date: Date | null) => setactiveDate(date)}
                dateFormat="dd-MMM-yyyy"
                className="inputtextbox w-[165px]"
                popperClassName="z-50"
                wrapperClassName="w-[165px]"
              />
            </div>
          </div>

          {/* KOLOM TENGAH - aturan sama dengan kiri */}
          <div className="min-w-0">
            <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-2 gap-y-1 items-center">
              <label className="text-sm text-slate-700">Code 2</label>
              <div className="flex items-center gap-1 min-w-0">
                <input className="inputtextbox w-[220px]" />
                <button className="btnfind">
                  <Search className="h-4 w-4" />
                </button>
              </div>

              <label className="text-sm text-slate-700">Description 2</label>
              <input className="inputtextbox w-full" />

              <label className="text-sm text-slate-700">Class 2</label>
              <div className="grid grid-cols-[160px_36px_minmax(0,1fr)] gap-1 min-w-0">
                <input className="inputtextbox w-full" />
                <button className="btnfind">
                  <Search className="h-4 w-4" />
                </button>
                <input className="inputtextbox w-full" disabled />
              </div>

              <label className="text-sm text-slate-700">Base Unit 2</label>
              <div className="grid grid-cols-[160px_36px_minmax(0,1fr)] gap-1 min-w-0">
                <input className="inputtextbox w-full" />
                <button className="btnfind">
                  <Search className="h-4 w-4" />
                </button>
                <input className="inputtextbox w-full" disabled />
              </div>

              <label className="text-sm text-slate-700">Active Date 2</label>
              <ERPDatePicker
                selected={activeDate}
                onChange={(date: Date | null) => setactiveDate(date)}
                dateFormat="dd-MMM-yyyy"
                className="inputtextbox w-[165px]"
                popperClassName="z-50"
                wrapperClassName="w-[165px]"
              />
            </div>
          </div>

          {/* PANEL KANAN */}
          <div className="self-start gap-y-1">
            <label className="mb-1 block text-sm text-slate-700">
              Gambar Barang
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleChangeImage}
              className="inputtextbox w-full mb-1"
            />

            {previewUrl && (
              <div className="mt-1 rounded border border-slate-300 p-3">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-24 w-24 rounded border object-cover"
                />

                <div className="mt-2 break-all text-sm text-slate-600">
                  {imageFile?.name}
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

      {/* TABLE TOOLBAR */}
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-700">
          Showing 1 to {filteredRows.length} of {rows.length} entries
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-700">Search:</label>
          <input
            className="h-9 w-[200px] rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="max-h-[520px] overflow-auto">
          <table className="min-w-[1400px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-slate-900 text-white">
              <tr>
                <th className="px-3 py-3 text-left font-semibold">
                  <input
                    type="checkbox"
                    onChange={(e) => toggleCheckAll(e.target.checked)}
                  />
                </th>
                <th className="px-3 py-3 text-left font-semibold">Approved</th>
                <th className="px-3 py-3 text-left font-semibold">No.</th>
                <th className="px-3 py-3 text-left font-semibold">Kode Barang</th>
                <th className="px-3 py-3 text-left font-semibold">Nama Barang</th>
                <th className="px-3 py-3 text-left font-semibold">Warna</th>
                <th className="px-3 py-3 text-left font-semibold">Kirim Dus</th>
                <th className="px-3 py-3 text-left font-semibold">Kirim Pasang</th>
                <th className="px-3 py-3 text-left font-semibold">Terima Dus</th>
                <th className="px-3 py-3 text-left font-semibold">Terima Pasang</th>
                <th className="px-3 py-3 text-left font-semibold">Edit</th>
                <th className="px-3 py-3 text-left font-semibold">Harga</th>
                <th className="px-3 py-3 text-left font-semibold">Keterangan</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((row, index) => (
                <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={row.checked}
                      onChange={(e) => toggleRowCheck(row.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={row.approved} readOnly />
                  </td>
                  <td className="px-3 py-3">{index + 1}</td>
                  <td className="px-3 py-3">{row.kodeBarang}</td>
                  <td className="px-3 py-3">{row.namaBarang}</td>
                  <td className="px-3 py-3">{row.warna}</td>
                  <td className="px-3 py-3">{row.kirimDus}</td>
                  <td className="px-3 py-3">{row.kirimPasang}</td>
                  <td className="px-3 py-3">{row.terimaDus}</td>
                  <td className="px-3 py-3">{row.terimaPasang}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        className="grid h-9 w-9 place-items-center rounded-md border border-slate-400 hover:bg-slate-100"
                        onClick={() => updateQty(row.id, "terimaPasang", -1)}
                      >
                        -
                      </button>
                      <button
                        className="grid h-9 w-9 place-items-center rounded-md border border-slate-400 hover:bg-slate-100"
                        onClick={() => updateQty(row.id, "terimaPasang", 1)}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">{formatRupiah(row.harga)}</td>
                  <td className="px-3 py-3">{row.keterangan}</td>
                </tr>
              ))}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-3 py-8 text-center text-slate-500">
                    Data tidak ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
