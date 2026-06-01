import { useEffect, useMemo, useState } from "react";
import CalendarCard from "../components/CalendarCard";
import InstallHint from "../components/InstallHint";
import StatusLegend from "../components/StatusLegend";
import { mockDonors, type Donor } from "../data/donors";
import { getBirthdayDashboard, mapApiBirthdayItem, readCache, writeCache } from "../lib/api";
import { formatDateKey, getMonthKey } from "../lib/date";
import { navigate } from "../lib/router";
import { safeGetJSON } from "../lib/storage";

type PrayerStatus = Record<string, Record<string, boolean>>;

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

export default function DashboardPage() {
  const [currentMonth, setCurrentMonth] = useState(() => monthStart(getToday()));
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(getToday()));
  const [donors, setDonors] = useState<Donor[]>(() => getMockDonorsForVisibleRange(getToday()));
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const prayerStatus = safeGetJSON<PrayerStatus>("doa.prayerStatus", {});

  const todayKey = formatDateKey(new Date());
  const currentMonthKey = useMemo(() => getMonthKey(currentMonth), [currentMonth]);

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
    navigate(`/birthdays?date=${dateString}`);
  }

  return (
    <main>
      <header className="topbar">
        <h1>DASHBOARD</h1>
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
