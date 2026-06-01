export type MonthCell = {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
};

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember"
];

const DAY_NAMES_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year || 1970, (month || 1) - 1, day || 1);
}

export function normalizeDateKey(value?: string | null) {
  if (!value) return "";
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return "";
  return formatDateKey(date);
}

export function getMonthMatrix(year: number, month: number): MonthCell[] {
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate() + index
    );

    return {
      date,
      dateKey: formatDateKey(date),
      isCurrentMonth: date.getMonth() === month
    };
  });
}

export function formatMonthNameId(monthIndex: number) {
  return MONTH_NAMES_ID[monthIndex] ?? "";
}

export function formatShortDateId(dateKey: string) {
  const date = parseDateKey(dateKey);
  return `${date.getDate()} ${formatMonthNameId(date.getMonth())}`;
}

export function getDayNamesId() {
  return DAY_NAMES_ID;
}

export function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}
