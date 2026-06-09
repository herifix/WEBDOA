import { useEffect, useMemo, useState } from "react";
import CalendarCard from "../components/CalendarCard";
import InstallHint from "../components/InstallHint";
import StatusLegend from "../components/StatusLegend";
import { mockDonors, type Donor } from "../data/donors";
import { getBirthdayDashboard, mapApiBirthdayItem, readCache, writeCache } from "../lib/api";
import { formatDateKey, getMonthKey, parseDateKey } from "../lib/date";
import { navigate, parseQuery, replaceRoute } from "../lib/router";
import { safeGetJSON } from "../lib/storage";

type PrayerStatus = Record<string, Record<string, boolean>>;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const indonesiaTimeZone = "Asia/Jakarta";
const indonesiaDateFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: indonesiaTimeZone,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric"
});
const indonesiaTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: indonesiaTimeZone,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMockDonorsForVisibleRange(currentMonth: Date) {
  const monthKey = getMonthKey(currentMonth);
  return mockDonors.filter((donor) => donor.birthday.startsWith(monthKey));
}

function getToday() {
  return new Date();
}

function isValidDateKey(value?: string) {
  if (!value || !DATE_KEY_PATTERN.test(value)) return false;
  return formatDateKey(parseDateKey(value)) === value;
}

function getDashboardFocusDateKey() {
  const queryDate = parseQuery().date;
  return isValidDateKey(queryDate) ? queryDate : formatDateKey(getToday());
}

function formatIndonesiaTime(date: Date) {
  return `${indonesiaDateFormatter.format(date)} · ${indonesiaTimeFormatter.format(date)} WIB`;
}

export default function DashboardPage() {
  const focusDateKey = getDashboardFocusDateKey();
  const [now, setNow] = useState(() => new Date());
  const [currentMonth, setCurrentMonth] = useState(() => monthStart(parseDateKey(focusDateKey)));
  const [selectedDate, setSelectedDate] = useState(focusDateKey);
  const [donors, setDonors] = useState<Donor[]>(() =>
    getMockDonorsForVisibleRange(parseDateKey(focusDateKey))
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const prayerStatus = safeGetJSON<PrayerStatus>("doa.prayerStatus", {});

  const todayKey = formatDateKey(new Date());
  const indonesiaTimeText = formatIndonesiaTime(now);
  const currentMonthKey = useMemo(() => getMonthKey(currentMonth), [currentMonth]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const nextMonth = monthStart(parseDateKey(focusDateKey));

    setCurrentMonth((value) =>
      value.getFullYear() === nextMonth.getFullYear() && value.getMonth() === nextMonth.getMonth()
        ? value
        : nextMonth
    );
    setSelectedDate((value) => (value === focusDateKey ? value : focusDateKey));
  }, [focusDateKey]);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setMessage("");
      const cacheKey = `doa.cache.dashboard.${currentMonthKey}`;
      const cached = readCache<Donor[]>(cacheKey, []);

      try {
        const apiData = await getBirthdayDashboard(formatDateKey(monthStart(currentMonth)));
        const mapped = apiData
          .map(mapApiBirthdayItem)
          .filter((donor) => donor.birthday.startsWith(currentMonthKey));

        if (!active) return;
        const resolved = mapped.length > 0 ? mapped : getMockDonorsForVisibleRange(currentMonth);
        setDonors(resolved);
        writeCache(cacheKey, resolved);
      } catch (error) {
        if (!active) return;
        setDonors(cached.length > 0 ? cached : getMockDonorsForVisibleRange(currentMonth));
        setMessage(
          error instanceof Error
            ? `Data API belum tersedia. ${error.message}`
            : "Data API belum tersedia."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [currentMonth, currentMonthKey]);

  function handlePrevMonth() {
    setCurrentMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1));
  }

  function handleNextMonth() {
    setCurrentMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1));
  }

  function handleSelectDate(dateString: string) {
    setSelectedDate(dateString);
    setMessage("");
    replaceRoute(`/dashboard?date=${dateString}`);
    navigate(`/birthdays?date=${dateString}`);
  }

  return (
    <main>
      <header className="topbar dashboard-topbar">
        <h1>DASHBOARD</h1>
        <time className="dashboard-clock" dateTime={now.toISOString()}>
          {indonesiaTimeText}
        </time>
      </header>

      <div className="page dashboard-page">
        <h2 className="section-title">JADWAL DOA DONATUR</h2>

        <CalendarCard
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          todayKey={todayKey}
          donors={donors}
          prayerStatus={prayerStatus}
          onSelectDate={handleSelectDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />

        <p className="helper-text">Ketuk tanggal bertitik untuk melihat daftar donatur yang berulang tahun.</p>

        <StatusLegend />

        {loading ? <div className="inline-status">Memuat data...</div> : null}
        {message ? <div className="inline-status">{message}</div> : null}

        <InstallHint />
      </div>
    </main>
  );
}
