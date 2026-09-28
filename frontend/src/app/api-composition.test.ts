import { afterEach, describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
import { procurementApi } from "@/entities/procurement";
import { inventoryQueries } from "@/entities/inventory";
import { apiClient } from "@/shared/api/client";
import { endpoints, params } from "@/shared/api/endpoints";

const originalAdapter = apiClient.defaults.adapter;

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});

describe("API composition", () => {
  it("encodes paths and omits empty filters", () => {
    expect(endpoints.product("SKU / 1")).toBe("/api/products/SKU%20%2F%201");
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

  it("includes every stock filter in the cache key", () => {
    expect(
      inventoryQueries.stock("MS-01", "масла", true, "SKU-1").queryKey,
    ).toEqual(["stock", "MS-01", "масла", true, "SKU-1"]);
  });

  it("sends typed forecast parameters through Axios", async () => {
    const result = { recommended_purchase_qty: 0 };
    const adapter = vi.fn(async (config) => ({
      data: result,
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));
    apiClient.defaults.adapter = adapter;
    const body = {
      sku: "TEX-061",
      location: "MS-01",
      horizon_months: 3,
      safety_stock_days: 14,
      budget_limit: null,
    };
    expect(await procurementApi.forecast(body)).toEqual(result);
    expect(adapter).toHaveBeenCalledWith(
      expect.objectContaining({
        url: endpoints.forecast,
        method: "post",
        data: JSON.stringify(body),
      }),
    );
  });

  it("shows backend error details", async () => {
    apiClient.defaults.adapter = async (config) => {
      const response = {
        data: { detail: "Некорректный период" },
        status: 422,
        statusText: "Unprocessable Entity",
        headers: {},
        config,
      };
      throw new AxiosError(
        "Request failed with status code 422",
        "ERR_BAD_REQUEST",
        config,
        undefined,
        response,
      );
    };
    await expect(procurementApi.reorder("MS-01", 14)).rejects.toThrow(
      "Некорректный период",
    );
  });
});
