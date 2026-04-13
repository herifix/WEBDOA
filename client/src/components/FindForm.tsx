import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import type { FindDataRow, JenisPencarian } from "../Model/ModelFindData";
import { useFetchFindData } from "../hooks/react_query/useFetchFindData";

type FindDataPopupProps = {
  open: boolean;
  jenisPencarian: JenisPencarian;
  title?: string;
  onSelect: (row: FindDataRow) => void;
  onClose: () => void;
};

type IndexedFindDataRow = FindDataRow & {
  _searchText: string;
};

const PAGE_SIZE = 10;
const DEBOUNCE_MS = 250;

export default function FindDataPopup({
  open,
  jenisPencarian,
  title = "Find Data",
  onSelect,
  onClose,
}: FindDataPopupProps) {
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number>(-1); // global index terhadap filteredRows
  const [currentPage, setCurrentPage] = useState(1);

  const query = useFetchFindData(
    {
      jenisPencarian,
      keyword: "",
    },
    open
  );

  const normalize = (value: string) => value.trim().toLowerCase();
  const codeLabel = jenisPencarian === "buletin" ? "ID" : "Code";
  const extraLabel = jenisPencarian === "buletin" ? "Created Date" : "Extra";

  const allRows = useMemo<FindDataRow[]>(() => {
    return query.data?.data ?? [];
  }, [query.data]);

  const indexedRows = useMemo<IndexedFindDataRow[]>(() => {
    return allRows.map((row) => ({
      ...row,
      _searchText: `${row.code ?? ""} ${row.description ?? ""} ${row.extra ?? ""}`.toLowerCase(),
    }));
  }, [allRows]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [keyword]);

  const filteredRows = useMemo<FindDataRow[]>(() => {
    const key = normalize(appliedKeyword);

    if (!key) {
      return allRows;
    }

    return indexedRows
      .filter((row) => row._searchText.includes(key))
     .map((row) => ({
        code: row.code,
        description: row.description,
        extra: row.extra,
        }));
      
  }, [allRows, indexedRows, appliedKeyword]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedRows = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, safeCurrentPage]);

  const selectedRow = useMemo(() => {
    if (selectedIndex < 0 || selectedIndex >= filteredRows.length) {
      return null;
    }
    return filteredRows[selectedIndex];
  }, [filteredRows, selectedIndex]);

  const moveSelectionToIndex = (globalIndex: number) => {
    if (globalIndex < 0 || globalIndex >= filteredRows.length) return;

    setSelectedIndex(globalIndex);
    setCurrentPage(Math.floor(globalIndex / PAGE_SIZE) + 1);
  };

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
  };

  const handleApplyFilter = () => {
    const key = normalize(keyword);
    setAppliedKeyword(key);
    setSelectedIndex(0);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setKeyword("");
    setDebouncedKeyword("");
    setAppliedKeyword("");
    setSelectedIndex(allRows.length > 0 ? 0 : -1);
    setCurrentPage(1);
  };

  //saat data dipilih dan tombol select ditekan
  const handleSelect = () => {
    if (!selectedRow) return;
    onSelect(selectedRow);
  };

  const handleRowClick = (localIndex: number) => {
    const globalIndex = (safeCurrentPage - 1) * PAGE_SIZE + localIndex;
    setSelectedIndex(globalIndex);
  };

  //saat data dipilih dan double click pada row
  const handleGridDoubleClick = (row: FindDataRow) => {
    onSelect(row);
  };

  const handlePrevPage = () => {
    if (safeCurrentPage <= 1) return;

    const nextPage = safeCurrentPage - 1;
    setCurrentPage(nextPage);

    const pageStartIndex = (nextPage - 1) * PAGE_SIZE;
    if (filteredRows.length > 0) {
      setSelectedIndex(Math.min(pageStartIndex, filteredRows.length - 1));
    }
  };

  const handleNextPage = () => {
    if (safeCurrentPage >= totalPages) return;

    const nextPage = safeCurrentPage + 1;
    setCurrentPage(nextPage);

    const pageStartIndex = (nextPage - 1) * PAGE_SIZE;
    if (filteredRows.length > 0) {
      setSelectedIndex(Math.min(pageStartIndex, filteredRows.length - 1));
    }
  };

  useEffect(() => {
    const key = normalize(debouncedKeyword);

    queueMicrotask(() => {
      if (!key) {
        if (filteredRows.length > 0) {
          setSelectedIndex(0);
          setCurrentPage(1);
        } else {
          setSelectedIndex(-1);
        }
        return;
      }

      const firstMatchIndex = filteredRows.findIndex((row) => {
        const searchText = normalize(
          `${row.code ?? ""} ${row.description ?? ""} ${row.extra ?? ""}`
        );
        return searchText.includes(key);
      });

      if (firstMatchIndex >= 0) {
        setSelectedIndex(firstMatchIndex);
        setCurrentPage(Math.floor(firstMatchIndex / PAGE_SIZE) + 1);
      } else {
        setSelectedIndex(filteredRows.length > 0 ? 0 : -1);
        setCurrentPage(1);
      }
    });
  }, [debouncedKeyword, filteredRows]);

  const handleKeyDownSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApplyFilter();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filteredRows.length === 0) return;

      const nextIndex =
        selectedIndex < filteredRows.length - 1 ? selectedIndex + 1 : selectedIndex;
      moveSelectionToIndex(nextIndex);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filteredRows.length === 0) return;

      const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : 0;
      moveSelectionToIndex(prevIndex);
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-6">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            type="button"
            className="text-sm text-slate-700 hover:text-black"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <input
              autoFocus
              value={keyword}
              onChange={(e) => handleKeywordChange(e.target.value)}
              onKeyDown={handleKeyDownSearch}
              placeholder="Ketik kata pencarian..."
              className="inputtextbox flex-1"
            />

            <button
              type="button"
              className="rounded bg-slate-500 px-4 py-2 text-white hover:bg-slate-600"
              onClick={handleRefresh}
            >
              Refresh
            </button>

            <button
              type="button"
              className="rounded bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleSelect}
              disabled={!selectedRow}
            >
              Select
            </button>
          </div>

          {query.isLoading && (
            <div className="mb-3 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Loading...
            </div>
          )}

          {query.isError && (
            <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600">
              {(query.error as Error).message}
            </div>
          )}

          <div className="overflow-hidden rounded border border-slate-700">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-700 px-3 py-2 text-left">{codeLabel}</th>
                  <th className="border border-slate-700 px-3 py-2 text-left">Description</th>
                  <th className="border border-slate-700 px-3 py-2 text-left">{extraLabel}</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-slate-500">
                      Data tidak ditemukan
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((row, localIndex) => {
                    const globalIndex = (safeCurrentPage - 1) * PAGE_SIZE + localIndex;
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <tr
                        key={`${row.code}-${globalIndex}`}
                        className={`cursor-pointer ${
                          isSelected ? "bg-blue-100" : "hover:bg-slate-50"
                        }`}
                        onClick={() => handleRowClick(localIndex)}
                        onDoubleClick={() => handleGridDoubleClick(row)}
                      >
                        <td className="border border-slate-700 px-3 py-2">{row.code}</td>
                        <td className="border border-slate-700 px-3 py-2">{row.description}</td>
                        <td className="border border-slate-700 px-3 py-2">{row.extra}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Page {safeCurrentPage} of {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded bg-slate-500 px-3 py-2 text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handlePrevPage}
                disabled={safeCurrentPage <= 1}
              >
                Prev
              </button>

              <button
                type="button"
                className="rounded bg-slate-500 px-3 py-2 text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleNextPage}
                disabled={safeCurrentPage >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
