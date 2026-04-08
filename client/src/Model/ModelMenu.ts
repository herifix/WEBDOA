export type AppMenuItem = {
  id_form: number;
  formName: string;
  id_menu_parent: number;
  lvl: number;
  iconType: string;
  menuOrder: number;
  asParent: boolean;
  canView: boolean;
  children: AppMenuItem[];
};
