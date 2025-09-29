import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { useTrafficStore, type SummaryBin } from "../store";

interface ClientSeries {
  client: string;
  dataKey: string;
  color: string;
}

interface ChartDatum {
  ts: number;
  label: string;
  __clients: Record<string, SummaryBin>;
  [key: string]: unknown;
}

// Cores distintas para cada cliente
const CLIENT_COLORS = [
  "#3B82F6", // Azul
  "#EF4444", // Vermelho
  "#10B981", // Verde
  "#F59E0B", // Amarelo
  "#8B5CF6", // Roxo
  "#06B6D4", // Ciano
  "#84CC16", // Lima
  "#F97316", // Laranja
  "#EC4899", // Rosa
  "#6B7280", // Cinza
];

function formatTimestamp(ts: number): string {
  const date = new Date(ts * 1000);
  return date.toLocaleTimeString();
}

function formatBytes(value: number): string {
  if (value > 1_000_000) return `${(value / 1_000_000).toFixed(1)} MB`;
  if (value > 1_000) return `${(value / 1_000).toFixed(1)} KB`;
  return `${value} B`;
}

function TrafficChart() {
  const { summary, selectBin } = useTrafficStore();

  const clientSeries = useMemo<ClientSeries[]>(() => {
    const unique = Array.from(new Set(summary.map((bin) => bin.client_ip))).sort();
    return unique.map((client, index) => ({ 
      client, 
      dataKey: `client_${index}`,
      color: CLIENT_COLORS[index % CLIENT_COLORS.length]
    }));
  }, [summary]);

  const keyMap = useMemo(() => {
    const entries = new Map<string, string>();
    clientSeries.forEach(({ client, dataKey }) => entries.set(client, dataKey));
    return entries;
  }, [clientSeries]);

  const data = useMemo<ChartDatum[]>(() => {
    const map = new Map<number, SummaryBin[]>();
    summary.forEach((bin) => {
      const items = map.get(bin.ts) ?? [];
      items.push(bin);
      map.set(bin.ts, items);
    });

    return Array.from(map.entries())
      .map(([ts, bins]) => {
        const entry: ChartDatum = {
          ts,
          label: formatTimestamp(ts),
          __clients: {},
        };

        bins.forEach((bin) => {
          const key = keyMap.get(bin.client_ip);
          if (!key) return;
          entry.__clients[bin.client_ip] = bin;
          entry[key] = bin.in_bytes + bin.out_bytes;
        });

        return entry;
      })
      .sort((a, b) => a.ts - b.ts);
  }, [summary, keyMap]);

  if (!summary.length) {
    return <p style={{ margin: 0, color: "#475569" }}>Nenhum dado coletado ainda.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={420}>
      <BarChart data={data} stackOffset="sign">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis tickFormatter={formatBytes} />
        <Tooltip
          formatter={(value: unknown, name, payload) => {
            if (!payload || typeof value !== "number") return value as number;
            const clientName = String(name);
            const clientData = (payload.payload as ChartDatum).__clients?.[clientName];
            if (!clientData) return formatBytes(value as number);
            return [`In: ${formatBytes(clientData.in_bytes)}, Out: ${formatBytes(clientData.out_bytes)}`, clientName];
          }}
        />
        <Legend />
        {clientSeries.map(({ client, dataKey, color }) => (
          <Bar key={client} dataKey={dataKey} stackId="traffic" name={client} fill={color}>
            {data.map((entry) => (
              <Cell
                key={`${entry.ts}-${client}`}
                fill={color}
                cursor="pointer"
                data-testid={`traffic-cell-${entry.ts}-${client}`}
                onClick={() => {
                  const binData = entry.__clients[client];
                  void selectBin(binData ?? null);
                }}
              />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export default TrafficChart;

