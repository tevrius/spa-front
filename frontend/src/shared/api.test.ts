import { afterEach, describe, expect, it, vi } from "vitest";
import { api, params } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("API client", () => {
  it("omits empty filters and encodes query values", () => {
    expect(
      params({
        location: "MS-01",
        category: "Уход за телом",
        sku: undefined,
        below_min: false,
      }),
    ).toBe(
      "?location=MS-01&category=%D0%A3%D1%85%D0%BE%D0%B4+%D0%B7%D0%B0+%D1%82%D0%B5%D0%BB%D0%BE%D0%BC&below_min=false",
    );
  });

  it("sends forecast parameters to the backend without calculating them locally", async () => {
    const result = {
      recommended_purchase_qty: 0,
      warnings: [{ level: "info", message: "Нет расхода" }],
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => result });
    vi.stubGlobal("fetch", fetchMock);
    const body = {
      sku: "TEX-061",
      location: "MS-01",
      horizon_months: 3,
      safety_stock_days: 14,
      budget_limit: null,
    };
    expect(await api.forecast(body)).toEqual(result);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/forecast",
      expect.objectContaining({ method: "POST", body: JSON.stringify(body) }),
    );
  });

  it("surfaces API errors to the screen", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ detail: "Некорректный период" }),
      }),
    );
    await expect(api.reorder("MS-01", 14)).rejects.toThrow(
      "Некорректный период",
    );
  });
});
