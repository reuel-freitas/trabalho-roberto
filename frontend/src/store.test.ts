import { describe, expect, it, vi, beforeEach } from "vitest";
import { useTrafficStore, resetTrafficStore } from "./store";
import * as api from "./api";

vi.mock("./api", () => ({
  fetchSummary: vi.fn(),
  fetchDrilldown: vi.fn(),
}));

describe("TrafficStore", () => {
  beforeEach(() => {
    resetTrafficStore();
  });

  it("loads summary data", async () => {
    const mockBins = [
      { ts: 1, client_ip: "10.0.0.2", in_bytes: 100, out_bytes: 200 },
      { ts: 6, client_ip: "10.0.0.3", in_bytes: 150, out_bytes: 250 },
    ];
    (api.fetchSummary as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBins);

    await useTrafficStore.getState().loadSummary();

    expect(useTrafficStore.getState().summary).toEqual(mockBins);
  });

  it("loads drilldown for selected bin", async () => {
    const drilldown = {
      ts: 1,
      client_ip: "10.0.0.2",
      items: [{ protocol: "HTTP", in_bytes: 100, out_bytes: 50 }],
    };
    (api.fetchDrilldown as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(drilldown);

    await useTrafficStore.getState().selectBin({ ts: 1, client_ip: "10.0.0.2", in_bytes: 100, out_bytes: 200 });

    expect(useTrafficStore.getState().selectedBin).toMatchObject({ client_ip: "10.0.0.2" });
    expect(useTrafficStore.getState().drilldown).toEqual(drilldown);
  });
});


