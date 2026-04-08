import { useMemo } from "react";
import { useFetchSidebarMenu } from "../hooks/react_query/useFetchSidebarMenu";
import type { AppMenuItem } from "../Model/ModelMenu";

export type FormMenuPermissions = {
  id_form: number;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canPrint: boolean;
  canDelete: boolean;
};

function flattenMenu(items: AppMenuItem[]): AppMenuItem[] {
  return items.reduce<AppMenuItem[]>((acc, item) => {
    acc.push(item);
    if (item.children?.length) {
      acc.push(...flattenMenu(item.children));
    }
    return acc;
  }, []);
}

export function getFormMenuPermissions(
  items: AppMenuItem[],
  formId: number
): FormMenuPermissions {
  const menuItem = flattenMenu(items).find((item) => item.id_form === formId);

  return {
    id_form: formId,
    canView: menuItem?.canView ?? false,
    canAdd: menuItem?.canAdd ?? false,
    canEdit: menuItem?.canEdit ?? false,
    canPrint: menuItem?.canPrint ?? false,
    canDelete: menuItem?.canDelete ?? false,
  };
}

export function useFormMenuPermissions(formId: number) {
  const userid = localStorage.getItem("userid") ?? "";
  const userpt = localStorage.getItem("userpt") ?? "";
  const menuQuery = useFetchSidebarMenu(userid, userpt);

  const permissions = useMemo(
    () => getFormMenuPermissions(menuQuery.data ?? [], formId),
    [menuQuery.data, formId]
  );

  return {
    ...menuQuery,
    permissions,
  };
}
