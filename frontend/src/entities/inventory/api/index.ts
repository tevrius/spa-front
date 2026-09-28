import { queryOptions } from "@tanstack/react-query";
import { endpoints, http, params } from "@/shared/api";
import type {
  Alert,
  Batch,
  Dashboard,
  MovementPage,
  Product,
  StockItem,
} from "@/shared/types";

export const inventoryApi = {
  dashboard: (location: string) =>
    http.get<Dashboard>(`${endpoints.dashboard}${params({ location })}`),
  stock: (
    location: string,
    category: string,
    below_min: boolean,
    sku?: string,
  ) =>
    http.get<StockItem[]>(
      `${endpoints.stock}${params({ location, category, below_min, sku })}`,
    ),
  products: () => http.get<Product[]>(endpoints.products),
  product: (sku: string) => http.get<Product>(endpoints.product(sku)),
  batches: (sku: string, location: string) =>
    http.get<Batch[]>(`${endpoints.batches}${params({ sku, location })}`),
  movements: (sku: string, location: string, offset: number) =>
    http.get<MovementPage>(
      `${endpoints.movements}${params({ sku, location, offset, limit: 10 })}`,
    ),
  alerts: (location: string, type: string, severity: string) =>
    http.get<Alert[]>(
      `${endpoints.alerts}${params({ location, type, severity })}`,
    ),
};

export const inventoryQueries = {
  dashboard: (location: string) =>
    queryOptions({
      queryKey: ["dashboard", location],
      queryFn: () => inventoryApi.dashboard(location),
    }),
  stock: (
    location: string,
    category: string,
    belowMin: boolean,
    sku?: string,
  ) =>
    queryOptions({
      queryKey: ["stock", location, category, belowMin, sku],
      queryFn: () => inventoryApi.stock(location, category, belowMin, sku),
    }),
  stockItem: (sku: string, location: string) =>
    queryOptions({
      queryKey: ["stock-item", sku, location],
      queryFn: async () =>
        (await inventoryApi.stock(location, "", false, sku))[0],
    }),
  products: () =>
    queryOptions({ queryKey: ["products"], queryFn: inventoryApi.products }),
  product: (sku: string) =>
    queryOptions({
      queryKey: ["product", sku],
      queryFn: () => inventoryApi.product(sku),
    }),
  batches: (sku: string, location: string) =>
    queryOptions({
      queryKey: ["batches", sku, location],
      queryFn: () => inventoryApi.batches(sku, location),
    }),
  movements: (sku: string, location: string, offset: number) =>
    queryOptions({
      queryKey: ["movements", sku, location, offset],
      queryFn: () => inventoryApi.movements(sku, location, offset),
    }),
  alerts: (location: string, type: string, severity: string) =>
    queryOptions({
      queryKey: ["alerts", location, type, severity],
      queryFn: () => inventoryApi.alerts(location, type, severity),
    }),
};
