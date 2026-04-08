export function isValidPhoneNumber(value: string) {
  return /^[0-9+()\-\s]+$/.test(value);
}

export type PhoneCountryOption = {
  code: string;
  name: string;
  dialCode: string;
};

export const PHONE_COUNTRY_OPTIONS: PhoneCountryOption[] = [
  { code: "ID", name: "Indonesia", dialCode: "+62" },
  { code: "SG", name: "Singapore", dialCode: "+65" },
  { code: "MY", name: "Malaysia", dialCode: "+60" },
  { code: "TH", name: "Thailand", dialCode: "+66" },
  { code: "PH", name: "Philippines", dialCode: "+63" },
  { code: "US", name: "United States", dialCode: "+1" },
  { code: "AU", name: "Australia", dialCode: "+61" },
  { code: "GB", name: "United Kingdom", dialCode: "+44" },
  { code: "JP", name: "Japan", dialCode: "+81" },
  { code: "KR", name: "South Korea", dialCode: "+82" },
  { code: "CN", name: "China", dialCode: "+86" },
  { code: "IN", name: "India", dialCode: "+91" },
  { code: "VN", name: "Vietnam", dialCode: "+84" },
  { code: "BR", name: "Brazil", dialCode: "+55" },
  { code: "MX", name: "Mexico", dialCode: "+52" },
  { code: "ZA", name: "South Africa", dialCode: "+27" },
  { code: "NG", name: "Nigeria", dialCode: "+234" },
  { code: "EG", name: "Egypt", dialCode: "+20" },
  { code: "RU", name: "Russia", dialCode: "+7" },
  { code: "AR", name: "Argentina", dialCode: "+54" },
  { code: "CL", name: "Chile", dialCode: "+56" },
  { code: "CO", name: "Colombia", dialCode: "+57" },
  { code: "PE", name: "Peru", dialCode: "+51" },
  { code: "VE", name: "Venezuela", dialCode: "+58" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971" },
];

export function sanitizePhoneNumberInput(value: string) {
  const cleaned = value.replace(/[^\d+]/g, "");
  if (!cleaned) return "";

  if (cleaned.startsWith("+")) {
    return `+${cleaned.slice(1).replace(/\+/g, "")}`;
  }

  return cleaned.replace(/\+/g, "");
}

export function getPhoneCountryOption(countryCode?: string | null) {
  return (
    PHONE_COUNTRY_OPTIONS.find((item) => item.code === countryCode) ??
    PHONE_COUNTRY_OPTIONS[0]
  );
}

export function getPhoneCountryFromNumber(value: string) {
  const cleaned = sanitizePhoneNumberInput(value).trim();
  if (!cleaned.startsWith("+")) return null;

  return (
    [...PHONE_COUNTRY_OPTIONS]
      .sort((a, b) => b.dialCode.length - a.dialCode.length)
      .find((item) => cleaned.startsWith(item.dialCode)) ?? null
  );
}

export function buildInternationalPhoneNumber(countryCode: string, localNumber: string) {
  const country = getPhoneCountryOption(countryCode);
  const sanitizedLocal = sanitizePhoneNumberInput(localNumber).replace(/\D/g, "");
  if (!sanitizedLocal) return "";

  const normalizedLocal = sanitizedLocal.replace(/^0+/, "");
  return `${country.dialCode}${normalizedLocal}`;
}

export function normalizeInternationalPhoneNumber(
  value: string,
  fallbackCountryCode = "ID"
) {
  const cleaned = sanitizePhoneNumberInput(value).trim();
  if (!cleaned) return "";

  if (cleaned.startsWith("00")) {
    return normalizeInternationalPhoneNumber(`+${cleaned.slice(2)}`, fallbackCountryCode);
  }

  const detectedCountry = getPhoneCountryFromNumber(cleaned);
  if (detectedCountry) {
    const localNumber = cleaned.slice(detectedCountry.dialCode.length).replace(/\D/g, "");
    return buildInternationalPhoneNumber(detectedCountry.code, localNumber);
  }

  return buildInternationalPhoneNumber(fallbackCountryCode, cleaned);
}

export function getLocalPhoneNumber(value: string, countryCode = "ID") {
  const normalized = normalizeInternationalPhoneNumber(value, countryCode);
  if (!normalized) return "";

  const country = getPhoneCountryFromNumber(normalized) ?? getPhoneCountryOption(countryCode);
  return normalized.slice(country.dialCode.length);
}

export function isValidInternationalPhoneNumber(value: string, fallbackCountryCode = "ID") {
  return /^\+\d{8,15}$/.test(
    normalizeInternationalPhoneNumber(value, fallbackCountryCode)
  );
}

export function normalizeIndonesianPhoneNumber(value: string) {
  return normalizeInternationalPhoneNumber(value, "ID");
}

export function isValidIndonesianPhoneNumber(value: string) {
  return isValidInternationalPhoneNumber(value, "ID");
}
