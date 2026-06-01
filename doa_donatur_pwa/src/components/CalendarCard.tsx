import type { Donor } from "../data/donors";
import {
  formatMonthNameId,
  getDayNamesId,
  getMonthMatrix,
  type MonthCell
} from "../lib/date";
import IconButton from "./IconButton";

type PrayerStatus = Record<string, Record<string, boolean>>;

type CalendarCardProps = {
  currentMonth: Date;
  selectedDate?: string;
  donors: Donor[];
  prayerStatus: PrayerStatus;
  onSelectDate: (dateString: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

function getDateStatus(cell: MonthCell, donors: Donor[], prayerStatus: PrayerStatus) {
  const donorsForDate = donors.filter((donor) => donor.birthday === cell.dateKey);
  if (donorsForDate.length === 0) return "none";

  const allDone = donorsForDate.every((donor) => {
    return donor.hasVoice || prayerStatus[cell.dateKey]?.[donor.id] === true;
  });

  return allDone ? "done" : "pending";
}

export default function CalendarCard({
  currentMonth,
  selectedDate,
  donors,
  prayerStatus,
  onSelectDate,
  onPrevMonth,
  onNextMonth
}: CalendarCardProps) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const cells = getMonthMatrix(year, month);
  const dayNames = getDayNamesId();

  return (
    <section className="calendar-card" aria-label="Kalender doa donatur">
      <div className="calendar-head">
        <div>
          <div className="calendar-month">{formatMonthNameId(month)}</div>
          <div className="calendar-year">{year}</div>
        </div>
        <div className="calendar-actions">
          <IconButton label="Bulan sebelumnya" onClick={onPrevMonth}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 18 9 12l6-6" />
            </svg>
          </IconButton>
          <IconButton label="Bulan berikutnya" onClick={onNextMonth}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </IconButton>
        </div>
      </div>

      <div className="calendar-days" aria-hidden="true">
        {dayNames.map((dayName) => (
          <div key={dayName}>{dayName}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((cell) => {
          const status = getDateStatus(cell, donors, prayerStatus);
          const hasDonor = status !== "none";
          const classNames = [
            "calendar-day",
            !cell.isCurrentMonth ? "is-muted" : "",
            selectedDate === cell.dateKey ? "is-selected" : "",
            status === "pending" ? "has-pending" : "",
            status === "done" ? "has-done" : ""
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={cell.dateKey}
              type="button"
              className={classNames}
              disabled={!cell.isCurrentMonth}
              onClick={() => onSelectDate(cell.dateKey)}
              aria-label={`Tanggal ${cell.date.getDate()}${hasDonor ? ", ada donatur" : ""}`}
            >
              <span>{cell.date.getDate()}</span>
              {hasDonor ? <span className="status-dot" /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
