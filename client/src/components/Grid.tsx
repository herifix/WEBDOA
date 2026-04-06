import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";

export interface Column<T = Record<string, unknown>> {
  key: string;
  label: string;
  width: string;
  render?: (row: T, rowIndex: number) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string | ((row: T, rowIndex: number) => string);
}

export interface Row {
  id?: string | number;
  [key: string]: unknown;
}

export interface ERPGridTableRef {
  focusGrid: () => void;
  blurGrid: () => void;
  selectFirstRow: () => void;
  selectLastRow: () => void;
  clearSelection: () => void;
  getSelectedRowIndex: () => number | null;
}

interface ERPGridTableProps<T extends Row = Row> {
  columns: Column<T>[];
  rows: T[];
  maxHeight?: number;
  emptyText?: string;
  loading?: boolean;

  selectedRowIndex?: number | null;
  onSelectedRowChange?: (row: T | null, rowIndex: number | null) => void;

  onRowClick?: (row: T, rowIndex: number) => void;
  onRowDoubleClick?: (row: T, rowIndex: number) => void;
  onRowEnter?: (row: T, rowIndex: number) => void;
  onEscape?: () => void;

  page?: number;
  pageSize: number;
  totalRecords?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;

  showPagination?: boolean;
  pageSizeOptions?: number[];

  enableKeyboardNavigation?: boolean;
  autoSelectFirstRow?: boolean;
  autoFocus?: boolean;

  rowClassName?: (row: T, rowIndex: number, isSelected: boolean) => string;

  selectedRowClassName?: string;
  selectedRowCellClassName?: string;
}

const ERPGridTable = forwardRef(function ERPGridTableInner<T extends Row = Row>(
  {
    columns,
    rows,
    maxHeight = 320,
    emptyText = "Data tidak ditemukan.",
    loading = false,

    selectedRowIndex,
    onSelectedRowChange,

    onRowClick,
    onRowDoubleClick,
    onRowEnter,
    onEscape,

    page = 1,
    pageSize,
    totalRecords = 0,
    onPageChange,
    onPageSizeChange,

    showPagination = false,
    pageSizeOptions = [10, 20, 50, 100],

    enableKeyboardNavigation = true,
    autoSelectFirstRow = false,
    autoFocus = false,

    rowClassName,

    selectedRowClassName = "bg-cyan-200",
    selectedRowCellClassName = "font-medium text-slate-900",
  }: ERPGridTableProps<T>,
  ref: React.Ref<ERPGridTableRef>
) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [internalSelectedRowIndex, setInternalSelectedRowIndex] = useState<number | null>(null);

  const isControlledSelection = selectedRowIndex !== undefined;
  const currentSelectedRowIndex = isControlledSelection
    ? selectedRowIndex ?? null
    : internalSelectedRowIndex;

  const gridStyle = useMemo(
    () => ({
      gridTemplateColumns: columns.map((c) => c.width).join(" "),
    }),
    [columns]
  );

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const startRow = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow = Math.min(page * pageSize, totalRecords);

  function emitSelection(nextIndex: number | null) {
    if (nextIndex === null || nextIndex < 0 || nextIndex >= rows.length) {
      onSelectedRowChange?.(null, null);
      return;
    }

    onSelectedRowChange?.(rows[nextIndex], nextIndex);
  }

  function setSelectedIndex(nextIndex: number | null) {
    if (!isControlledSelection) {
      setInternalSelectedRowIndex(nextIndex);
    }

    emitSelection(nextIndex);
  }

  function scrollRowIntoView(rowIndex: number) {
    const rowEl = rowRefs.current[rowIndex];
    if (!rowEl) return;

    rowEl.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }

  function moveSelection(nextIndex: number) {
    if (rows.length === 0) {
      setSelectedIndex(null);
      return;
    }

    const safeIndex = Math.max(0, Math.min(nextIndex, rows.length - 1));
    setSelectedIndex(safeIndex);

    requestAnimationFrame(() => {
      scrollRowIntoView(safeIndex);
    });
  }

  function focusGrid() {
    rootRef.current?.focus();
  }

  function blurGrid() {
    rootRef.current?.blur();
  }

  function selectFirstRow() {
    if (rows.length === 0) {
      setSelectedIndex(null);
      return;
    }
    moveSelection(0);
  }

  function selectLastRow() {
    if (rows.length === 0) {
      setSelectedIndex(null);
      return;
    }
    moveSelection(rows.length - 1);
  }

  function clearSelection() {
    setSelectedIndex(null);
  }

  useImperativeHandle(
    ref,
    () => ({
      focusGrid,
      blurGrid,
      selectFirstRow,
      selectLastRow,
      clearSelection,
      getSelectedRowIndex: () => currentSelectedRowIndex,
    }),
    [currentSelectedRowIndex, rows]
  );

  function handleRowClick(row: T, rowIndex: number) {
    setSelectedIndex(rowIndex);
    focusGrid();
    onRowClick?.(row, rowIndex);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onEscape?.();
      return;
    }

    if (!enableKeyboardNavigation || loading || rows.length === 0) {
      return;
    }

    const current = currentSelectedRowIndex ?? 0;
    const visibleJump = Math.max(1, Math.floor(maxHeight / 36));

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveSelection(currentSelectedRowIndex === null ? 0 : current + 1);
        return;

      case "ArrowUp":
        e.preventDefault();
        moveSelection(currentSelectedRowIndex === null ? 0 : current - 1);
        return;

      case "Home":
        e.preventDefault();
        moveSelection(0);
        return;

      case "End":
        e.preventDefault();
        moveSelection(rows.length - 1);
        return;

      case "PageDown":
        e.preventDefault();
        moveSelection(current + visibleJump);
        return;

      case "PageUp":
        e.preventDefault();
        moveSelection(current - visibleJump);
        return;

      case "Enter":
        e.preventDefault();
        if (
          currentSelectedRowIndex !== null &&
          currentSelectedRowIndex >= 0 &&
          currentSelectedRowIndex < rows.length
        ) {
          onRowEnter?.(rows[currentSelectedRowIndex], currentSelectedRowIndex);
        }
        return;
    }
  }

  useEffect(() => {
    rowRefs.current = [];
  }, [rows]);

  useEffect(() => {
    if (!autoFocus) return;

    const id = requestAnimationFrame(() => {
      focusGrid();
    });

    return () => cancelAnimationFrame(id);
  }, [autoFocus, page, rows.length]);

  useEffect(() => {
  if (loading) return;

  const id = requestAnimationFrame(() => {
    if (rows.length === 0) {
      setSelectedIndex(null);
      return;
    }

    if (autoSelectFirstRow) {
      const nextIndex =
        currentSelectedRowIndex !== null &&
        currentSelectedRowIndex >= 0 &&
        currentSelectedRowIndex < rows.length
          ? currentSelectedRowIndex
          : 0;

      setSelectedIndex(nextIndex);
      scrollRowIntoView(nextIndex);
      return;
    }

    if (
      currentSelectedRowIndex !== null &&
      currentSelectedRowIndex >= rows.length
    ) {
      const nextIndex = rows.length - 1;
      setSelectedIndex(nextIndex);
      scrollRowIntoView(nextIndex);
    }
  });

  return () => cancelAnimationFrame(id);
  }, [rows, loading, autoSelectFirstRow, currentSelectedRowIndex]);

  useEffect(() => {
    if (
      currentSelectedRowIndex !== null &&
      currentSelectedRowIndex >= 0 &&
      currentSelectedRowIndex < rows.length
    ) {
      requestAnimationFrame(() => {
        scrollRowIntoView(currentSelectedRowIndex);
      });
    }
  }, [currentSelectedRowIndex, rows]);

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="rounded-xl border border-slate-300 bg-white shadow-sm outline-none focus:ring-2 focus:ring-cyan-400/40"
    >
      <div className="overflow-auto" style={{ maxHeight }}>
        {/* HEADER */}
        <div
          className="sticky top-0 z-10 grid bg-slate-950 text-sm font-semibold text-white"
          style={gridStyle}
        >
          {columns.map((col, i) => (
            <div
              key={col.key}
              className={`px-3 py-3 ${
                i !== columns.length - 1 ? "border-r border-slate-800" : ""
              } ${col.headerClassName ?? ""}`}
            >
              {col.label}
            </div>
          ))}
        </div>

        {/* BODY */}
        {loading ? (
          <div className="px-4 py-6 text-sm text-slate-500">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-500">{emptyText}</div>
        ) : (
          rows.map((row, rowIndex) => {
            const isSelected = currentSelectedRowIndex === rowIndex;
            const customRowClass =
              rowClassName?.(row, rowIndex, isSelected) ?? "";

            return (
              <div
                key={row.id ?? rowIndex}
                ref={(el) => {
                  rowRefs.current[rowIndex] = el;
                }}
                className={`grid cursor-default text-sm text-slate-700 transition-colors ${
                  isSelected
                    ? `${selectedRowClassName} ring-1 ring-inset ring-cyan-500`
                    : rowIndex % 2 === 0
                    ? "bg-white"
                    : "bg-slate-50"
                } ${!isSelected ? "hover:bg-cyan-50" : ""} ${customRowClass}`}
                style={gridStyle}
                onClick={() => handleRowClick(row, rowIndex)}
                onDoubleClick={() => {
                  setSelectedIndex(rowIndex);
                  focusGrid();
                  onRowDoubleClick?.(row, rowIndex);
                }}
              >
                {columns.map((col, colIndex) => {
                  const customCellClass =
                    typeof col.cellClassName === "function"
                      ? col.cellClassName(row, rowIndex)
                      : col.cellClassName ?? "";

                  return (
                    <div
                      key={col.key}
                      className={`truncate border-b border-slate-200 px-3 py-2 ${
                        colIndex !== columns.length - 1 ? "border-r" : ""
                      } ${isSelected ? selectedRowCellClassName : ""} ${customCellClass}`}
                      title={
                        typeof col.render === "function"
                          ? undefined
                          : String(row[col.key] ?? "")
                      }
                    >
                      {typeof col.render === "function"
                        ? col.render(row, rowIndex)
                        : (row[col.key] as React.ReactNode)}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {/* PAGINATION */}
      {showPagination && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2 text-sm">
          <div className="text-slate-600">
            Total Records: <span className="font-semibold">{totalRecords}</span>{" "}
            | Showing {startRow} to {endRow} of {totalRecords} entries
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onPageSizeChange && (
              <select
                className="rounded border border-slate-300 px-2 py-1"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canPrev}
              onClick={() => onPageChange(1)}
            >
              First
            </button>

            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canPrev}
              onClick={() => onPageChange(page - 1)}
            >
              Prev
            </button>

            <span className="px-2 text-slate-700">
              Page <span className="font-semibold">{page}</span> /{" "}
              <span className="font-semibold">{totalPages}</span>
            </span>

            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canNext}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </button>

            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canNext}
              onClick={() => onPageChange(totalPages)}
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default ERPGridTable as <T extends Row = Row>(
  props: ERPGridTableProps<T> & { ref?: React.Ref<ERPGridTableRef> }
) => React.ReactElement;