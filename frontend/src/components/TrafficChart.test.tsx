import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import TrafficChart from "./TrafficChart";
import { useTrafficStore } from "../store";

const SAMPLE_TS = 1_710_000_000;

function mountInContainer(ui: React.ReactNode) {
  const { container } = render(<div style={{ width: 900, height: 400 }}>{ui}</div>);
  return container;
}

describe("TrafficChart", () => {
  beforeEach(() => {
    useTrafficStore.setState((state) => ({
      ...state,
      summary: [],
      selectBin: state.selectBin,
    }));
  });

  it("renders stacked bars with provided data", () => {
    useTrafficStore.setState((state) => ({
      ...state,
      summary: [
        { ts: SAMPLE_TS, client_ip: "192.168.0.10", in_bytes: 300, out_bytes: 120 },
        { ts: SAMPLE_TS, client_ip: "192.168.0.20", in_bytes: 150, out_bytes: 50 },
      ],
    }));

    const container = mountInContainer(<TrafficChart />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("invokes selectBin when a bar segment is clicked", () => {
    const selectBinMock = vi.fn();

    useTrafficStore.setState((state) => ({
      ...state,
      summary: [
        { ts: SAMPLE_TS, client_ip: "192.168.0.10", in_bytes: 300, out_bytes: 120 },
        { ts: SAMPLE_TS + 5, client_ip: "192.168.0.20", in_bytes: 150, out_bytes: 50 },
      ],
      selectBin: selectBinMock,
    }));

    mountInContainer(<TrafficChart />);

    const cell = screen.getByTestId(`traffic-cell-${SAMPLE_TS}-192.168.0.10`);
    fireEvent.click(cell);

    expect(selectBinMock).toHaveBeenCalledTimes(1);
    expect(selectBinMock.mock.calls[0][0]).toMatchObject({ client_ip: "192.168.0.10" });
  });
});


