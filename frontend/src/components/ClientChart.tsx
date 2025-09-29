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
} from "recharts";
import { useTrafficStore, type SummaryBin } from "../store";

interface ClientTimeData {
  ts: number;
  timestamp: string;
  in_bytes: number;
  out_bytes: number;
  total_bytes: number;
}

interface ClientChartData {
  client_ip: string;
  color: string;
  data: ClientTimeData[];
  totalTraffic: number;
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

function formatBytes(value: number): string {
  if (value > 1_000_000) return `${(value / 1_000_000).toFixed(1)} MB`;
  if (value > 1_000) return `${(value / 1_000).toFixed(1)} KB`;
  return `${value} B`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function ClientChart() {
  const { summary } = useTrafficStore();

  const clientCharts = useMemo<ClientChartData[]>(() => {
    // 1. Agrupar dados por cliente
    const clientMap = new Map<string, SummaryBin[]>();
    
    summary.forEach((bin) => {
      if (!clientMap.has(bin.client_ip)) {
        clientMap.set(bin.client_ip, []);
      }
      clientMap.get(bin.client_ip)!.push(bin);
    });

    // 2. Criar dados temporais para cada cliente
    return Array.from(clientMap.entries()).map(([client_ip, bins], index) => {
      // Ordenar por timestamp
      const sortedBins = bins.sort((a, b) => a.ts - b.ts);
      
      // Converter para dados temporais
      const data: ClientTimeData[] = sortedBins.map((bin) => ({
        ts: bin.ts,
        timestamp: formatTimestamp(bin.ts),
        in_bytes: bin.in_bytes,
        out_bytes: bin.out_bytes,
        total_bytes: bin.in_bytes + bin.out_bytes,
      }));

      // Calcular tráfego total do cliente
      const totalTraffic = data.reduce((sum, d) => sum + d.total_bytes, 0);

      return {
        client_ip,
        color: CLIENT_COLORS[index % CLIENT_COLORS.length],
        data,
        totalTraffic,
      };
    }).sort((a, b) => b.totalTraffic - a.totalTraffic); // Ordenar por tráfego total
  }, [summary]);

  if (!summary.length) {
    return <p style={{ margin: 0, color: "#475569" }}>Nenhum dado coletado ainda.</p>;
  }

  return (
    <div style={{ marginTop: "2rem" }}>
      <h3 style={{ marginBottom: "1rem", color: "#1E293B" }}>
        Tráfego por Cliente (Individual)
      </h3>
      
      {clientCharts.map((clientChart) => (
        <div key={clientChart.client_ip} style={{ marginBottom: "3rem" }}>
          <h4 style={{ 
            marginBottom: "1rem", 
            color: "#475569",
            fontSize: "1.1rem",
            fontWeight: "600"
          }}>
            Cliente: {clientChart.client_ip} - Total: {formatBytes(clientChart.totalTraffic)}
          </h4>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={clientChart.data} 
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis tickFormatter={formatBytes} />
              <Tooltip
                formatter={(value: number, name: string) => [formatBytes(value), name]}
                labelFormatter={(label: string) => `Horário: ${label}`}
              />
              <Legend />
              
              <Bar 
                dataKey="in_bytes" 
                name="Entrada"
                fill={clientChart.color}
                opacity={0.8}
              />
              <Bar 
                dataKey="out_bytes" 
                name="Saída"
                fill={clientChart.color}
                opacity={0.5}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ))}

      <div style={{ marginTop: "2rem", fontSize: "0.875rem", color: "#6B7280" }}>
        <p>📊 Cada cliente tem seu próprio gráfico temporal mostrando tráfego de entrada e saída.</p>
        <p>🎨 Barras mais escuras = Entrada, Barras mais claras = Saída</p>
        <p>📈 Clientes ordenados por volume total de tráfego (maior → menor)</p>
      </div>
    </div>
  );
}

export default ClientChart;