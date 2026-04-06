export interface ModelMasterDonatur {
  id_donatur: number;
  nama: string;
  tglLahir: string;
  createdDate: string;
  noHP: string;
  status: boolean;
  lastDonation: string| '1900/1/1';
}

export type ItemMasterRow = {
  id_donatur: number;
  nama: string;
  tglLahir: string;
  createdDate: string;
  noHP: string;
  status: boolean;
  lastDonation: string | null;

}
