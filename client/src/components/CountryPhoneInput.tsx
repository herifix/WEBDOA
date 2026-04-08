import {
  buildInternationalPhoneNumber,
  getLocalPhoneNumber,
  getPhoneCountryFromNumber,
  getPhoneCountryOption,
  PHONE_COUNTRY_OPTIONS,
  type PhoneCountryOption,
} from "../utils/validation";

type CountryPhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  defaultCountryCode?: string;
  className?: string;
};

export default function CountryPhoneInput({
  value,
  onChange,
  readOnly = false,
  defaultCountryCode = "ID",
  className = "inputtextbox w-full",
}: CountryPhoneInputProps) {
  const selectedCountry =
    getPhoneCountryFromNumber(value) ?? getPhoneCountryOption(defaultCountryCode);
  const localNumber = getLocalPhoneNumber(value, selectedCountry.code);

  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCountry = getPhoneCountryOption(event.target.value);
    onChange(buildInternationalPhoneNumber(nextCountry.code, localNumber));
  };

  const handleLocalNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(buildInternationalPhoneNumber(selectedCountry.code, event.target.value));
  };

  return (
    <div className="flex gap-2">
      <select
        value={selectedCountry.code}
        onChange={handleCountryChange}
        disabled={readOnly}
        className="h-10 min-w-[210px] rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 disabled:bg-slate-100 disabled:text-slate-500"
      >
        {PHONE_COUNTRY_OPTIONS.map((option: PhoneCountryOption) => (
          <option key={option.code} value={option.code}>
            {option.code} {option.dialCode} {option.name}
          </option>
        ))}
      </select>

      <input
        value={localNumber}
        onChange={handleLocalNumberChange}
        className={className}
        placeholder="8123456789"
        inputMode="tel"
        readOnly={readOnly}
      />
    </div>
  );
}
