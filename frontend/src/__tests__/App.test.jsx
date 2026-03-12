import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
vi.mock("react-globe.gl", () => ({ default: () => null }));
const App = (await import("../App.jsx")).default;

vi.mock("../api/client", () => {
  return {
    fetchEvents: vi.fn(async () => ({
      items: [
        {
          _id: "1",
          eventKey: "ek1",
          title: "Test Event",
          summaryShort: "Summary",
          severity: "LOW",
          riskScore: 10,
          countries: ["Testland"],
          primaryLocation: { name: "Testland", country: "Testland", lat: 10, lng: 20, precision: "country" },
          createdAt: new Date().toISOString(),
        },
      ],
      nextCursor: null,
    })),
    streamEvents: vi.fn(() => () => {}),
    getApiBase: () => "http://localhost:8000",
    geocodeLocation: vi.fn(async () => ({ lat: 11.11, lng: 22.22 })),
  };
});

describe("App", () => {
  it("renders feed and globe", async () => {
    render(React.createElement(App));
    await waitFor(() => {
      expect(screen.getByText(/Latest events/i)).toBeDefined();
      expect(screen.getByText(/Test Event/i)).toBeDefined();
    });
    await waitFor(() => {
      expect(screen.getByText(/Region:/i)).toBeDefined();
    });
  });
});
