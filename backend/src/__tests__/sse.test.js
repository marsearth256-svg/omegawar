import { describe, it, expect } from "vitest";
import { createSseHub } from "../realtime/sse.js";

function createMockRes() {
  let closed = false;
  const chunks = [];
  return {
    writeHead: () => {},
    write: (chunk) => {
      if (closed) throw new Error("closed");
      chunks.push(chunk);
    },
    on: (event, cb) => {
      if (event === "close") {
        // expose closer
        return { trigger: () => ((closed = true), cb()) };
      }
    },
    getChunks: () => chunks.join(""),
  };
}

describe("sse hub", () => {
  it("broadcasts events to connected clients", () => {
    const hub = createSseHub();
    const req = { on: () => {} };
    const res = createMockRes();
    hub.handler(req, res);
    hub.broadcast("event.created", { title: "Test" });
    const output = res.getChunks();
    expect(output).toContain("event: hello");
    expect(output).toContain("event: event.created");
    expect(output).toContain("Test");
  });
});
