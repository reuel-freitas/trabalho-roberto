import type { DrilldownPayload, SummaryBin } from "./store";

const API_BASE = ((import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8000/api").replace(/\/$/, "");

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(API_BASE)) {
    return `${API_BASE}${path}`;
  }
  return `${API_BASE}${path}`;
}

export async function fetchSummary(from: number, to: number): Promise<SummaryBin[]> {
  const query = new URLSearchParams({ from_ts: String(from), to_ts: String(to) }).toString();
  const response = await fetch(buildUrl(`/summary?${query}`), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch summary: ${response.statusText}`);
  }

  const data = await response.json();
  return data.bins ?? [];
}

export async function fetchDrilldown(ts: number, clientIp: string): Promise<DrilldownPayload> {
  const query = new URLSearchParams({ ts: String(ts), client_ip: clientIp }).toString();
  const response = await fetch(buildUrl(`/drilldown?${query}`), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch drilldown: ${response.statusText}`);
  }

  return response.json();
}

export interface HealthResponse {
  ok: boolean;
  now: number;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(buildUrl(`/health`), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch health: ${response.statusText}`);
  }

  return response.json();
}

