import { create } from "zustand";
import { fetchDrilldown, fetchSummary } from "./api";

export interface SummaryBin {
  ts: number;
  client_ip: string;
  in_bytes: number;
  out_bytes: number;
}

export interface DrilldownItem {
  protocol: string;
  in_bytes: number;
  out_bytes: number;
}

export interface DrilldownPayload {
  ts: number;
  client_ip: string;
  items: DrilldownItem[];
}

export interface TimeRange {
  from: number;
  to: number;
}

interface TrafficState {
  summary: SummaryBin[];
  timeRange: TimeRange;
  selectedBin: SummaryBin | null;
  drilldown: DrilldownPayload | null;
  setTimeRange: (range: TimeRange) => void;
  loadSummary: () => Promise<void>;
  selectBin: (bin: SummaryBin | null) => Promise<void>;
  reset: () => void;
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

const createDataSlice = () => ({
  summary: [] as SummaryBin[],
  timeRange: { from: nowSeconds() - 120, to: nowSeconds() },
  selectedBin: null as SummaryBin | null,
  drilldown: null as DrilldownPayload | null,
});

export const useTrafficStore = create<TrafficState>((set, get) => ({
  ...createDataSlice(),
  setTimeRange: (range) => set({ timeRange: range }),
  loadSummary: async () => {
    const { timeRange } = get();
    try {
      const summary = await fetchSummary(timeRange.from, timeRange.to);
      set({ summary });
    } catch (error) {
      console.error("Failed to load summary", error);
    }
  },
  selectBin: async (bin) => {
    set({ selectedBin: bin, drilldown: null });
    if (!bin) {
      return;
    }
    try {
      const drilldown = await fetchDrilldown(bin.ts, bin.client_ip);
      set({ drilldown });
    } catch (error) {
      console.error("Failed to load drilldown", error);
    }
  },
  reset: () => set(createDataSlice()),
}));

export const resetTrafficStore = () => useTrafficStore.getState().reset();

