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
  waSentDate: string | null;
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
  voiceStorageProvider: string;
  voiceStorageRootPath: string;
  voiceStorageEnvironmentFolder: string;
  pathPesanSuara: string;
  pathPesanSuaraUrl: string;
  audioUrl: string;
  hasAudioFile: boolean;
}

export interface TRBirthdayPrayWhatsAppMessageStatus {
  id: string;
  messageType: string;
  status: string;
  content: string;
  mediaUrl: string;
  wamId: string;
  timestamp: string;
  error: string;
}

export interface TRBirthdayPrayWhatsAppDeliveryDebugItem {
  index: number;
  isOutbound: boolean;
  isInbound: boolean;
  direction: string;
  senderType: string;
  messageType: string;
  status: string;
  normalizedStatus: string;
  id: string;
  wamId: string;
  timestamp: string;
  hasReadMarker: boolean;
  hasDeliveredMarker: boolean;
}

export interface TRBirthdayPrayWhatsAppDeliveryDebug {
  normalizedPhone: string;
  messagesUrl: string;
  messageArrayPath: string;
  rawMessageCount: number;
  parsedOutboundCount: number;
  parsedInboundCount: number;
  usedReplyFallback: boolean;
  replyFallbackReason: string;
  sampledMessages: TRBirthdayPrayWhatsAppDeliveryDebugItem[];
}

export interface TRBirthdayPrayWhatsAppDeliveryStatusData {
  phoneNumber: string;
  checkedAt: string | null;
  latestOutboundMessages: TRBirthdayPrayWhatsAppMessageStatus[];
  debug?: TRBirthdayPrayWhatsAppDeliveryDebug | null;
  gatewayResponse?: unknown;
}

export interface TRBirthdayPrayWhatsAppDeliveryStatusResponse {
  success: boolean;
  message: string;
  data?: TRBirthdayPrayWhatsAppDeliveryStatusData;
}

export interface VoiceRecordingUploadResult {
  id: number;
  provider: string;
  fileName: string;
  bucketName: string;
  objectName: string;
  storagePath: string;
  fileUrl: string | null;
  contentType: string;
  fileSize: number;
  createdAt: string;
  playbackUrl: string;
}
