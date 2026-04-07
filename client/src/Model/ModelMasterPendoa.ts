//untuk representasi data dari backend dipakai di service / API response
export interface ModelMasterPendoa {
  id_pendoa: number;
  nama: string;
  noHP: string;
  dfl: boolean;
  createddate: string| '1900/1/1';
}

// representasi row untuk UI
export type MasterPendoaRow = {
  id_pendoa: number;
  nama: string;
  noHP: string;
  dfl: boolean;
  createddate: string | null;

}
