import { useEffect, useState } from "react";
import { fetchHealth, type HealthResponse } from "../api";
import { useTrafficStore } from "../store";

function formatTimeRange(from: number, to: number): string {
  const fmt = new Intl.DateTimeFormat("default", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${fmt.format(from * 1000)} - ${fmt.format(to * 1000)}`;
}

function Header() {
  const { timeRange, setTimeRange, loadSummary } = useTrafficStore();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkHealth() {
      try {
        const data = await fetchHealth();
        setHealth(data);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      }
    }

    checkHealth();
    const interval = window.setInterval(checkHealth, 10000);
    return () => window.clearInterval(interval);
  }, []);

  const handleRangeChange = (minutes: number) => {
    const now = Math.floor(Date.now() / 1000);
    const from = now - minutes * 60;
    setTimeRange({ from, to: now });
    void loadSummary();
  };

  return (
    <header
      style={{
        padding: "1.5rem",
        borderBottomLeftRadius: "24px",
        borderBottomRightRadius: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
        color: "white",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.8rem" }}>Realtime Traffic Dashboard</h1>
          <p style={{ margin: 0, opacity: 0.8 }}>
            Monitor incoming/outgoing traffic for critical services and drill into protocol details.
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "9999px",
              backgroundColor: health?.ok ? "rgba(34,197,94,0.3)" : "rgba(248,113,113,0.3)",
              color: "white",
              fontWeight: 600,
            }}
          >
            {health?.ok ? "Capturing" : "Offline"}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <strong>Intervalo:</strong> {formatTimeRange(timeRange.from, timeRange.to)}
          {error && (
            <span style={{ marginLeft: "1rem", color: "#f87171" }}>Erro health: {error}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[2, 5, 10].map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => handleRangeChange(minutes)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                backgroundColor: "rgba(255,255,255,0.12)",
                color: "white",
              }}
            >
              Últimos {minutes} min
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

export default Header;

