import { useMemo, useState } from "react";
import { FORM_MODE, type FormMode  } from "../../TypeData/forMode";

// export type ERPFormMode = "view" | "new" | "edit" | "approved";

type UseERPFormModeOptions = {
  initialMode?: FormMode;
};

export function useERPFormMode(options?: UseERPFormModeOptions) {
  const { initialMode = FORM_MODE.VIEW } = options ?? {};
  const [mode, setMode] = useState<FormMode>(initialMode);

  const actions = useMemo(
    () => ({
      toView: () => setMode(FORM_MODE.VIEW),
      toNew: () => setMode(FORM_MODE.NEW),
      toEdit: () => setMode(FORM_MODE.EDIT),
      toApproved: () => setMode(FORM_MODE.APPROVED),
      setMode,
    }),
    [],
  );

  const flags = useMemo(
    () => ({
      isView: mode === FORM_MODE.VIEW,
      isNew: mode === FORM_MODE.NEW,
      isEdit: mode === FORM_MODE.EDIT,
      isApproved: mode === FORM_MODE.APPROVED,
      isEditing: mode === FORM_MODE.NEW || mode === FORM_MODE.EDIT,
      canEdit: mode === FORM_MODE.VIEW,
      canSave: mode === FORM_MODE.NEW || mode === FORM_MODE.EDIT,
      canApprove: mode === FORM_MODE.VIEW,
      canUnapprove: mode === FORM_MODE.APPROVED,
      canDelete: mode === FORM_MODE.VIEW,
      canPrint: mode === FORM_MODE.VIEW || mode === FORM_MODE.APPROVED,
    }),
    [mode],
  );

  return {
    mode,
    ...actions,
    ...flags,
  };
}