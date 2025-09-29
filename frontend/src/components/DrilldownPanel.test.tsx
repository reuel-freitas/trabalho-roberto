import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import DrilldownPanel from "./DrilldownPanel";
import { useTrafficStore } from "../store";

describe("DrilldownPanel", () => {
  beforeEach(() => {
    useTrafficStore.setState((state) => ({
      ...state,
      drilldown: null,
    }));
  });

  it("shows placeholder when nothing selected", () => {
    render(<DrilldownPanel selection={null} />);
    expect(screen.getByText(/Selecione um cliente/i)).toBeInTheDocument();
  });

  it("renders protocol items when drilldown data is provided", () => {
    useTrafficStore.setState((state) => ({
      ...state,
      drilldown: {
        ts: 1,
        client_ip: "192.168.0.10",
        items: [
          { protocol: "HTTP", in_bytes: 300, out_bytes: 120 },
          { protocol: "DNS", in_bytes: 20, out_bytes: 40 },
        ],
      },
    }));

    render(
      <DrilldownPanel
        selection={{ ts: 1, client_ip: "192.168.0.10", in_bytes: 300, out_bytes: 120 }}
      />
    );

    expect(screen.getByText("HTTP")).toBeInTheDocument();
    expect(screen.getByText(/In: 300 B/)).toBeInTheDocument();
    expect(screen.getByText(/Out: 120 B/)).toBeInTheDocument();
  });
});


