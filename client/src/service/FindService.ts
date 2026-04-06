import http from "../api/http";
import type {
  FindDataRequest,
  FindDataResponse,
  FindDataRow,
} from "../Model/ModelFindData";
import { getAPIErrorMessage } from "../helper/httpRequestErrorHelper";
import { findDataConfig } from "../utils/findDataConfig";

function normalizeResponse(
  jenisPencarian: string,
  raw: unknown
): FindDataResponse {
  // Contoh normalisasi:
  // API item mungkin return data.data
  // API lain mungkin return langsung array
  // Kita samakan jadi { data: FindDataRow[] }

  if (Array.isArray(raw)) {
    return {
      data: raw.map(mapRowByJenis(jenisPencarian)),
    };
  }

  if (
    typeof raw === "object" &&
    raw !== null &&
    "data" in raw &&
    Array.isArray((raw as Record<string, unknown>).data)
  ) {
    return {
      data: ((raw as Record<string, unknown>).data as unknown[]).map(
        mapRowByJenis(jenisPencarian)
      ),
    };
  }

  return { data: [] };
}

function mapRowByJenis(jenisPencarian: string) {
  return (row: unknown): FindDataRow => {
    const r = row as Record<string, unknown>;
    switch (jenisPencarian) {
      case "item":
      case "data-item":
        return {
          id: undefined,
          code: (r.code as string) ?? "",
          description: (r.name as string) ?? "",
          extra: (r.classname as string) ?? "",
        };

      case "customer":
        return {
          id: (r.id_master_customer ?? r.id) as bigint | number | undefined,
          code: (r.code as string) ?? (r.customer_code as string) ?? "",
          description: (r.description as string) ?? (r.customer_name as string) ?? "",
          extra: (r.city as string) ?? "",
        };

      case "supplier":
        return {
          id: (r.id_master_supplier ?? r.id) as bigint | number | undefined,
          code: (r.code as string) ?? (r.supplier_code as string) ?? "",
          description: (r.description as string) ?? (r.supplier_name as string) ?? "",
          extra: (r.phone as string) ?? "",
        };

      case "warehouse":
        return {
          id: (r.id_master_warehouse ?? r.id) as bigint | number | undefined,
          code: (r.code as string) ?? (r.warehouse_code as string) ?? "",
          description: (r.description as string) ?? (r.warehouse_name as string) ?? "",
          extra: (r.branch as string) ?? "",
        };

      default:
        return {
          id: r.id as  bigint | number | undefined,
          code: (r.code as string) ?? "",
          description: (r.description as string) ?? "",
          extra: (r.extra as string) ?? "",
        };
    }
  };
}

export async function fetchFindData(
  payload: FindDataRequest,
  signal?: AbortSignal
): Promise<FindDataResponse> {
  try {
    const cfg = findDataConfig[payload.jenisPencarian];

    if (!cfg) {
      throw new Error(`Jenis pencarian '${payload.jenisPencarian}' belum didaftarkan`);
    }

     const params: Record<string, unknown> = {};

    if (cfg.Area) {
      params.Area = localStorage.getItem("area") ?? "MJKKB";
    }

    if (cfg.keywordParam && payload.keyword) {
      params[cfg.keywordParam] = payload.keyword;
    }

    let res;

    if (cfg.method === "POST") {
      res = await http.post(cfg.url, params, { signal });
    } else {
      res = await http.get(cfg.url, { signal, params });
    }

    return normalizeResponse(payload.jenisPencarian, res.data);
  } catch (e) {
    throw new Error(getAPIErrorMessage(e));
  }
}