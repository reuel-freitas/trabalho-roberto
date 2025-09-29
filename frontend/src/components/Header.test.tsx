import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Header from "./Header";
import * as api from "../api";
import { useTrafficStore } from "../store";

vi.mock("../api", () => ({
  fetchHealth: vi.fn().mockResolvedValue({ ok: true, now: 1710000000 }),
  fetchSummary: vi.fn(),
  fetchDrilldown: vi.fn(),
}));

describe("Header", () => {
  it("displays health status", async () => {
    render(<Header />);
    await waitFor(() => expect(screen.getByText(/Capturing/i)).toBeInTheDocument());
  });

  it("updates time range on quick buttons", async () => {
    const loadSummary = vi.fn();
    useTrafficStore.setState((state) => ({
      ...state,
      loadSummary,
    }));

    render(<Header />);
    const button = screen.getByText(/Últimos 5 min/i);
    fireEvent.click(button);

    await waitFor(() => expect(loadSummary).toHaveBeenCalled());
  });
});


