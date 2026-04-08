export interface ModelMasterUser {
  pt: string;
  userid: string;
  nama: string;
  lvl: number;
  kunci: string;
  gantiKunci: boolean;
}

export type MasterUserRow = {
  pt: string;
  userid: string;
  nama: string;
  lvl: number;
  gantiKunci: boolean;
};

export interface ChangePasswordRequest {
  pt: string;
  userid: string;
  currentPassword: string;
  newPassword: string;
}

export interface MasterUserPermissionRow {
  id_form: number;
  formName: string;
  id_menu_parent: number;
  lvl: number;
  menuOrder: number;
  asParent: boolean;
  positionCode: string;
  positionLabel: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canPrint: boolean;
  canDelete: boolean;
}
