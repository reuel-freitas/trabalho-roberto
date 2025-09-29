import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import * as api from "./api";

vi.mock("./api", () => ({
  fetchSummary: vi.fn().mockResolvedValue([]),
  fetchDrilldown: vi.fn(),
  fetchHealth: vi.fn().mockResolvedValue({ ok: true, now: 1710000000 }),
}));

describe("App", () => {
  it("renders layout with chart and drilldown panel", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText(/Realtime Traffic Dashboard/i)).toBeInTheDocument());
    expect(screen.getByText(/Detalhes por Protocolo/i)).toBeInTheDocument();
  });
});


