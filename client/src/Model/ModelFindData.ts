export type JenisPencarian =
  | "data-item"
  | "item"
  | "buletin"
  | "customer"
  | "supplier"
  | "class"
  | "baseunit"
  | "grup"
  | "warehouse";

export interface FindDataRequest {
  jenisPencarian: JenisPencarian;
  keyword: string;
}

export interface FindDataRow {
  code: string;
  description: string;
  extra?: string;
  id?: bigint | number;
}

export interface FindDataResponse {
  data: FindDataRow[];
}
