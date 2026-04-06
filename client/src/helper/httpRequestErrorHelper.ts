// src/helper/httpRequestErrorHelper.ts
import { AxiosError } from "axios";

type ApiError = {
  message?: string;
  errors?: Record<string, string[]>;
};

export function getAPIErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined;

    // ✅ ambil dari ModelState errors dulu
    if (data?.errors) {
      const firstKey = Object.keys(data.errors)[0];
      const firstMsg = data.errors[firstKey]?.[0];
      if (firstMsg) return firstMsg;
    }

    // ✅ fallback message
    return data?.message ?? error.message;
  }

  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;

  return "Pastikan anda terhubung dengan jaringan internet yang baik";
}
