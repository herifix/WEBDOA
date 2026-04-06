import type { ReactNode } from "react";
import { type FormMode,type ToolbarActionKey } from "../TypeData/forMode";
import { Plus, Pencil, Save, Printer, Check, CircleX, Trash2, RefreshCw, X, FileDown, } from "lucide-react";

type ToolbarButtonConfig = {
  key: ToolbarActionKey | string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  visible?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};

type ERPToolbarProps = {
  mode?: FormMode;

  onNew?: () => void;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  onPrint?: () => void;
  onApprove?: () => void;
  onUnapprove?: () => void;
  onDelete?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;

  showNew?: boolean;
  showEdit?: boolean;
  showSave?: boolean;
  showCancel?: boolean;
  showPrint?: boolean;
  showApprove?: boolean;
  showUnapprove?: boolean;
  showDelete?: boolean;
  showRefresh?: boolean;
  showExport?: boolean;

  disableNew?: boolean;
  disableEdit?: boolean;
  disableSave?: boolean;
  disableCancel?: boolean;
  disablePrint?: boolean;
  disableApprove?: boolean;
  disableUnapprove?: boolean;
  disableDelete?: boolean;
  disableRefresh?: boolean;
  disableExport?: boolean;

  loadingSave?: boolean;
  loadingRefresh?: boolean;
  loadingApprove?: boolean;
  loadingUnapprove?: boolean;
  loadingDelete?: boolean;

  customButtons?: ToolbarButtonConfig[];

  className?: string;
};

type BuiltInButton = {
  key: ToolbarActionKey;
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  visible: boolean;
  disabled: boolean;
  loading?: boolean;
};

function Spinner() {
  return <RefreshCw className="h-4 w-4 animate-spin" />;
}

function getDefaultVisibilityByMode(mode: FormMode) {
  switch (mode) {
    case "new":
    case "edit":
      return {
        new: false,
        edit: false,
        save: true,
        cancel: true,
        print: false,
        approve: false,
        unapprove: false,
        delete: false,
        refresh: true,
        export: false,
      };

    case "approved":
      return {
        new: true,
        edit: false,
        save: false,
        cancel: false,
        print: true,
        approve: false,
        unapprove: true,
        delete: false,
        refresh: true,
        export: true,
      };

    case "view":
    default:
      return {
        new: true,
        edit: true,
        save: false,
        cancel: false,
        print: true,
        approve: true,
        unapprove: false,
        delete: true,
        refresh: true,
        export: true,
      };
  }
}

function mergeVisible(
  defaultVisible: boolean,
  override?: boolean,
): boolean {
  return override ?? defaultVisible;
}

export default function ERPToolbar({
  mode = "view",

  onNew,
  onEdit,
  onSave,
  onCancel,
  onPrint,
  onApprove,
  onUnapprove,
  onDelete,
  onRefresh,
  onExport,

  showNew,
  showEdit,
  showSave,
  showCancel,
  showPrint,
  showApprove,
  showUnapprove,
  showDelete,
  showRefresh,
  showExport,

  disableNew = false,
  disableEdit = false,
  disableSave = false,
  disableCancel = false,
  disablePrint = false,
  disableApprove = false,
  disableUnapprove = false,
  disableDelete = false,
  disableRefresh = false,
  disableExport = false,

  loadingSave = false,
  loadingRefresh = false,
  loadingApprove = false,
  loadingUnapprove = false,
  loadingDelete = false,

  customButtons = [],

  className = "",
}: ERPToolbarProps) {
  const visibleByMode = getDefaultVisibilityByMode(mode);

  const builtInButtons: BuiltInButton[] = [
    {
      key: "new",
      label: "New",
      icon: <Plus className="h-4 w-4" />,
      onClick: onNew,
      visible: mergeVisible(visibleByMode.new, showNew),
      disabled: disableNew,
    },
    {
      key: "edit",
      label: "Edit",
      icon: <Pencil className="h-4 w-4" />,
      onClick: onEdit,
      visible: mergeVisible(visibleByMode.edit, showEdit),
      disabled: disableEdit,
    },
    {
      key: "save",
      label: "Save",
      icon: loadingSave ? <Spinner /> : <Save className="h-4 w-4" />,
      onClick: onSave,
      visible: mergeVisible(visibleByMode.save, showSave),
      disabled: disableSave || loadingSave,
      loading: loadingSave,
    },
    {
      key: "cancel",
      label: "Cancel",
      icon: <X className="h-4 w-4" />,
      onClick: onCancel,
      visible: mergeVisible(visibleByMode.cancel, showCancel),
      disabled: disableCancel,
    },
    {
      key: "print",
      label: "Print",
      icon: <Printer className="h-4 w-4" />,
      onClick: onPrint,
      visible: mergeVisible(visibleByMode.print, showPrint),
      disabled: disablePrint,
    },
    {
      key: "approve",
      label: "Approve",
      icon: loadingApprove ? <Spinner /> : <Check className="h-4 w-4" />,
      onClick: onApprove,
      visible: mergeVisible(visibleByMode.approve, showApprove),
      disabled: disableApprove || loadingApprove,
      loading: loadingApprove,
    },
    {
      key: "unapprove",
      label: "UN Approve",
      icon: loadingUnapprove ? <Spinner /> : <CircleX className="h-4 w-4" />,
      onClick: onUnapprove,
      visible: mergeVisible(visibleByMode.unapprove, showUnapprove),
      disabled: disableUnapprove || loadingUnapprove,
      loading: loadingUnapprove,
    },
    {
      key: "delete",
      label: "Delete",
      icon: loadingDelete ? <Spinner /> : <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      visible: mergeVisible(visibleByMode.delete, showDelete),
      disabled: disableDelete || loadingDelete,
      loading: loadingDelete,
    },
    {
      key: "refresh",
      label: "Refresh",
      icon: loadingRefresh ? <Spinner /> : <RefreshCw className="h-4 w-4" />,
      onClick: onRefresh,
      visible: mergeVisible(visibleByMode.refresh, showRefresh),
      disabled: disableRefresh || loadingRefresh,
      loading: loadingRefresh,
    },
    {
      key: "export",
      label: "Export",
      icon: <FileDown className="h-4 w-4" />,
      onClick: onExport,
      visible: mergeVisible(visibleByMode.export, showExport),
      disabled: disableExport,
    },
  ];

  return (
    <div
      className={`mb-2 flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-2 shadow-sm ${className}`}
    >
      {builtInButtons
        .filter((button) => button.visible)
        .map((button) => (
          <button
            key={button.key}
            type="button"
            className={`btntoolbar ${
              button.disabled ? "pointer-events-none opacity-50" : ""
            }`}
            onClick={button.onClick}
            disabled={button.disabled}
          >
            <span>{button.label}</span>
            {button.icon}
          </button>
        ))}

      {customButtons
        .filter((button) => button.visible !== false)
        .map((button) => (
          <button
            key={button.key}
            type="button"
            className={`btntoolbar ${
              button.disabled ? "pointer-events-none opacity-50" : ""
            } ${button.className ?? ""}`}
            onClick={button.onClick}
            disabled={button.disabled || button.loading}
          >
            <span>{button.label}</span>
            {button.loading ? <Spinner /> : button.icon}
          </button>
        ))}

        <span className="ml-auto text-sm font-semibold text-red-600">
            {mode.toUpperCase()} Mode
        </span>
    </div>
  );
}