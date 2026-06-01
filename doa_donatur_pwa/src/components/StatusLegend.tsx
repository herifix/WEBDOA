export default function StatusLegend() {
  return (
    <div className="legend" aria-label="Status jadwal doa">
      <span className="legend-item">
        <span className="status-dot is-pending" />
        Belum Selesai
      </span>
      <span className="legend-item">
        <span className="status-dot is-done" />
        Selesai
      </span>
    </div>
  );
}
