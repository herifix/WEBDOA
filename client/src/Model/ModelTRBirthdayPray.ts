export interface DashboardBirthdayItem {
  id_donatur: number;
  nama: string;
  tglLahir: string | null;
  birthdayDate: string | null;
  noHP: string;
  status: boolean;
  lastDonation: string | null;
  sudahDidoakan: boolean;
  sudahAdaPesanDoa: boolean;
  sudahAdaPesanSuara: boolean;
  id_TRBirthdayPray: number | null;
  prayCreatedDate: string | null;
  isWASent: boolean;
}

export interface TRBirthdayPrayDetail {
  id_TRBirthdayPray: number;
  id_donatur: number;
  id_pendoa: number;
  namaDonatur: string;
  tglLahir: string | null;
  birthdayDate: string | null;
  noHPDonatur: string;
  namaPendoa: string;
  noHPPendoa: string;
  pesan: string;
  pathPesanSuara: string;
  pathPesanSuaraUrl: string;
  createdDate: string | null;
  isWASent: boolean;
  waSentDate: string | null;
}

export interface TRBirthdayPrayHistoryItem {
  id_TRBirthdayPray: number;
  id_pendoa: number;
  namaDonatur: string;
  namaPendoa: string;
  birthdayDate: string | null;
  pesan: string;
  pathPesanSuara: string;
  pathPesanSuaraUrl: string;
  createdDate: string | null;
}

export interface TRBirthdayPrayMediaDebugInfo {
  id_donatur: number;
  targetYear: number;
  publicBaseUrl: string;
  gatewayUrl: string;
  voiceStorageRootPath: string;
  voiceStorageEnvironmentFolder: string;
  pathPesanSuara: string;
  pathPesanSuaraUrl: string;
  audioUrl: string;
  hasAudioFile: boolean;
}
