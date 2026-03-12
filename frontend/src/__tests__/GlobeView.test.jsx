import { describe, it, expect } from "vitest";
import React from "react";
import { vi } from "vitest";
vi.mock("react-globe.gl", () => ({ default: () => null }));
const GlobeView = (await import("../components/GlobeView.jsx")).default;
import { render } from "@testing-library/react";

describe("GlobeView", () => {
  it("mounts without errors with empty events", () => {
    render(React.createElement(GlobeView, { events: [], selectedId: null, onSelect: () => {} }));
    expect(true).toBe(true);
  });
});
