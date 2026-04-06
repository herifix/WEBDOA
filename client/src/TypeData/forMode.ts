export type FormMode = "view" | "new" | "edit" | "approved";
export const FORM_MODE = {
  VIEW: "view" as FormMode,
  NEW: "new" as FormMode,
  EDIT: "edit" as FormMode,
  APPROVED: "approved" as FormMode,
};

export type  ToolbarActionKey = | "new" | "edit" | "save" | "cancel" | "print" | "approve" | "unapprove" | "delete" | "refresh" | "export";
export const ToolbarKey = {
    NEW: "new" as ToolbarActionKey,
    EDIT: "edit" as ToolbarActionKey,
    SAVE: "save" as ToolbarActionKey,  
    CANCEL: "cancel" as ToolbarActionKey,
    PRINT: "print" as ToolbarActionKey,
    APPROVE: "approve" as ToolbarActionKey,
    UNAPPROVE: "unapprove" as ToolbarActionKey,
    DELETE: "delete" as ToolbarActionKey,
    REFRESH: "refresh" as ToolbarActionKey,
    EXPORT: "export" as ToolbarActionKey
};
