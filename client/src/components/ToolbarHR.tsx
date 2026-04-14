import type { ReactNode } from "react";
import { type FormMode,type ToolbarActionKey } from "../TypeData/forMode";
import { Plus, Pencil, Save, Printer, Check, CircleX, Trash2, RefreshCw, X, FileDown, } from "lucide-react";

type ToolbarVisibility = {
  new: boolean;
  edit: boolean;
  save: boolean;
  cancel: boolean;
  print: boolean;
  approve: boolean;
  unapprove: boolean;
  delete: boolean;
  refresh: boolean;
  export: boolean;
};

type ToolbarPermissionConfig = Partial<{
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPrint: boolean;
  canApprove: boolean;
  canUnapprove: boolean;
  canExport: boolean;
  canSave: boolean;
  canCancel: boolean;
  canRefresh: boolean;
}>;

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
  permissions?: ToolbarPermissionConfig;

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

function getDefaultVisibilityByMode(mode: FormMode): ToolbarVisibility {
  switch (mode) {
    case "new":
      return {
        new: false,
        edit: true,
        save: true,
        cancel: false,
        print: false,
        approve: false,
        unapprove: false,
        delete: false,
        refresh: false,
        export: false,
      };
    case "edit":
      return {
        new: false,
        edit: true,
        save: true,
        cancel: false,
        print: false,
        approve: false,
        unapprove: false,
        delete: false,
        refresh: false,
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

function resolvePermissionVisible(
  permissionValue: boolean | undefined,
  override: boolean | undefined,
  defaultVisible: boolean,
): boolean {
  if (override !== undefined) return override;
  if (permissionValue !== undefined) return permissionValue;
  return defaultVisible;
}

function isToolbarEditingMode(mode: FormMode) {
  return mode === "new" || mode === "edit";
}

function isLockedWhileEditing(actionKey: ToolbarActionKey) {
  return actionKey !== "save" && actionKey !== "edit";
}

export default function ERPToolbar({
  mode = "view",
  permissions,

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
  const lockNonSaveActions = isToolbarEditingMode(mode);
  const useEditAsCancel = isToolbarEditingMode(mode);
  const resolvedVisibility: ToolbarVisibility = {
    new: resolvePermissionVisible(permissions?.canAdd, showNew, visibleByMode.new),
    edit: resolvePermissionVisible(permissions?.canEdit, showEdit, visibleByMode.edit),
    save: resolvePermissionVisible(permissions?.canSave, showSave, visibleByMode.save),
    cancel: resolvePermissionVisible(permissions?.canCancel, showCancel, visibleByMode.cancel),
    print: resolvePermissionVisible(permissions?.canPrint, showPrint, visibleByMode.print),
    approve: resolvePermissionVisible(permissions?.canApprove, showApprove, visibleByMode.approve),
    unapprove: resolvePermissionVisible(
      permissions?.canUnapprove,
      showUnapprove,
      visibleByMode.unapprove,
    ),
    delete: resolvePermissionVisible(permissions?.canDelete, showDelete, visibleByMode.delete),
    refresh: resolvePermissionVisible(permissions?.canRefresh, showRefresh, visibleByMode.refresh),
    export: resolvePermissionVisible(permissions?.canExport, showExport, visibleByMode.export),
  };

  const builtInButtons: BuiltInButton[] = [
    {
      key: "new",
      label: "New",
      icon: <Plus className="h-4 w-4" />,
      onClick: onNew,
      visible: resolvedVisibility.new,
      disabled: disableNew || (lockNonSaveActions && isLockedWhileEditing("new")),
    },
    {
      key: "edit",
      label: useEditAsCancel ? "Cancel" : "Edit",
      icon: useEditAsCancel ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />,
      onClick: useEditAsCancel ? onCancel : onEdit,
      visible: useEditAsCancel ? Boolean(onCancel) : resolvedVisibility.edit,
      disabled: useEditAsCancel
        ? disableCancel
        : disableEdit || (lockNonSaveActions && isLockedWhileEditing("edit")),
    },
    {
      key: "save",
      label: "Save",
      icon: loadingSave ? <Spinner /> : <Save className="h-4 w-4" />,
      onClick: onSave,
      visible: resolvedVisibility.save,
      disabled: disableSave || loadingSave,
      loading: loadingSave,
    },
    {
      key: "cancel",
      label: "Cancel",
      icon: <X className="h-4 w-4" />,
      onClick: onCancel,
      visible: !useEditAsCancel && resolvedVisibility.cancel,
      disabled: disableCancel,
    },
    {
      key: "print",
      label: "Print",
      icon: <Printer className="h-4 w-4" />,
      onClick: onPrint,
      visible: resolvedVisibility.print,
      disabled: disablePrint || (lockNonSaveActions && isLockedWhileEditing("print")),
    },
    {
      key: "approve",
      label: "Approve",
      icon: loadingApprove ? <Spinner /> : <Check className="h-4 w-4" />,
      onClick: onApprove,
      visible: resolvedVisibility.approve,
      disabled:
        disableApprove || loadingApprove || (lockNonSaveActions && isLockedWhileEditing("approve")),
      loading: loadingApprove,
    },
    {
      key: "unapprove",
      label: "UN Approve",
      icon: loadingUnapprove ? <Spinner /> : <CircleX className="h-4 w-4" />,
      onClick: onUnapprove,
      visible: resolvedVisibility.unapprove,
      disabled:
        disableUnapprove ||
        loadingUnapprove ||
        (lockNonSaveActions && isLockedWhileEditing("unapprove")),
      loading: loadingUnapprove,
    },
    {
      key: "delete",
      label: "Delete",
      icon: loadingDelete ? <Spinner /> : <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      visible: resolvedVisibility.delete,
      disabled: disableDelete || loadingDelete || (lockNonSaveActions && isLockedWhileEditing("delete")),
      loading: loadingDelete,
    },
    {
      key: "refresh",
      label: "Refresh",
      icon: loadingRefresh ? <Spinner /> : <RefreshCw className="h-4 w-4" />,
      onClick: onRefresh,
      visible: resolvedVisibility.refresh,
      disabled:
        disableRefresh || loadingRefresh || (lockNonSaveActions && isLockedWhileEditing("refresh")),
      loading: loadingRefresh,
    },
    {
      key: "export",
      label: "Export",
      icon: <FileDown className="h-4 w-4" />,
      onClick: onExport,
      visible: resolvedVisibility.export,
      disabled: disableExport || (lockNonSaveActions && isLockedWhileEditing("export")),
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
              button.disabled
                ? "pointer-events-none border-slate-300 bg-slate-200 text-slate-400 shadow-none grayscale"
                : ""
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
              button.disabled
                ? "pointer-events-none border-slate-300 bg-slate-200 text-slate-400 shadow-none grayscale"
                : ""
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
