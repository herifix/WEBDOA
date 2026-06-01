export default function StatusLegend() {
  return (
    <div className="legend-block">
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
      <p className="legend-caption">
        <span className="status-dot is-caption" aria-hidden="true" />
        Titik menandakan tanggal hari ini atau mendatang yang memiliki donatur berulang tahun.
      </p>
    </div>
  );
}
