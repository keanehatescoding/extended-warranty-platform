import { afterEach, describe, expect, it, vi } from "vitest";

const { query, release, connect } = vi.hoisted(() => ({
  query: vi.fn(),
  release: vi.fn(),
  connect: vi.fn(),
}));

vi.mock("@/db", () => ({
  pool: { connect },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/health", () => {
  it("returns ok and releases the pooled client on success", async () => {
    connect.mockResolvedValueOnce({ query, release });
    query.mockResolvedValue({ rows: [{ "?column?": 1 }] });

    const { GET } = await import("../src/app/api/health/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(query).toHaveBeenNthCalledWith(1, "SET statement_timeout = 5000");
    expect(query).toHaveBeenNthCalledWith(2, "select 1");
    expect(query).toHaveBeenNthCalledWith(3, "RESET statement_timeout");
    expect(release).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledWith();
  });

  it("returns 503 and discards the client when the probe fails", async () => {
    connect.mockResolvedValueOnce({ query, release });
    query.mockRejectedValueOnce(new Error("db down"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { GET } = await import("../src/app/api/health/route");
    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ ok: false });
    expect(release).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledWith(true);
    consoleError.mockRestore();
  });
});
