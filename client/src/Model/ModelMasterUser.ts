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
