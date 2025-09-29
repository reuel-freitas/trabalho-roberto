import { DrilldownPayload, SummaryBin, useTrafficStore } from "../store";

interface DrilldownPanelProps {
  selection: SummaryBin | null;
}

function formatBytes(value: number): string {
  if (value > 1_000_000) return `${(value / 1_000_000).toFixed(1)} MB`;
  if (value > 1_000) return `${(value / 1_000).toFixed(1)} KB`;
  return `${value} B`;
}

function DrilldownPanel({ selection }: DrilldownPanelProps) {
  const { drilldown } = useTrafficStore();

  const renderContent = (payload: DrilldownPayload | null, selected: SummaryBin | null) => {
    if (!selected) {
      return <p style={{ margin: 0, color: "#475569" }}>Selecione um cliente no gráfico para ver detalhes.</p>;
    }

    if (!payload) {
      return <p style={{ margin: 0, color: "#475569" }}>Carregando protocolos...</p>;
    }

    if (!payload.items.length) {
      return <p style={{ margin: 0, color: "#475569" }}>Nenhum dado de protocolo disponível.</p>;
    }

    return (
      <div className="protocol-list">
        {payload.items.map((item) => (
          <div key={item.protocol} className="protocol-item">
            <strong>{item.protocol}</strong>
            <span>In: {formatBytes(item.in_bytes)}</span>
            <span>Out: {formatBytes(item.out_bytes)}</span>
            <span>Total: {formatBytes(item.in_bytes + item.out_bytes)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="panel-header">
        <div>
          <h2 style={{ margin: 0 }}>Detalhes por Protocolo</h2>
          {selection ? (
            <p style={{ margin: 0, color: "#475569" }}>
              {new Date(selection.ts * 1000).toLocaleTimeString()} · {selection.client_ip}
            </p>
          ) : (
            <p style={{ margin: 0, color: "#475569" }}>Aguardando seleção...</p>
          )}
        </div>
      </div>
      {renderContent(drilldown, selection)}
    </div>
  );
}

export default DrilldownPanel;

