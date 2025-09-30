import { useEffect } from "react";
import Header from "./components/Header";
import TrafficChart from "./components/TrafficChart";
import DrilldownPanel from "./components/DrilldownPanel";
import ClientChart from "./components/ClientChart";
import JsonTransferPanel from "./components/JsonTransferPanel";
import { useTrafficStore } from "./store";

const POLL_INTERVAL_MS = 2000;

function App() {
  const { loadSummary, selectedBin } = useTrafficStore();

  useEffect(() => {
    loadSummary();
    const interval = window.setInterval(() => {
      loadSummary();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [loadSummary]);

  return (
    <div>
      <Header />
      <div className="layout">
        <div className="chart-container">
          <TrafficChart />
        </div>
        <div className="drilldown-container">
          <DrilldownPanel selection={selectedBin} />
        </div>
      </div>
      <div style={{ padding: "1rem", backgroundColor: "#F8FAFC" }}>
        <ClientChart />
        <JsonTransferPanel />
      </div>
    </div>
  );
}

export default App;

