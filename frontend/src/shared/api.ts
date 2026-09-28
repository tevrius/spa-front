import type {
  Alert,
  Batch,
  Budget,
  ChatMessage,
  ChatSummary,
  Dashboard,
  Forecast,
  Meta,
  MovementPage,
  Period,
  PriceDynamics,
  Product,
  PurchasePlan,
  ReorderList,
  Service,
  ServiceEconomics,
  StockItem,
  Supplier,
} from "./types";

const baseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export function params(
  values: Record<string, string | number | boolean | null | undefined>,
) {
  const result = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      result.set(key, String(value));
  });
  const query = result.toString();
  return query ? `?${query}` : "";
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    let detail = "";
    try {
      detail = (await response.json()).detail;
    } catch {
      /* HTTP status remains available */
    }
    throw new Error(
      typeof detail === "string" ? detail : `Ошибка API: ${response.status}`,
    );
  }
  return response.json() as Promise<T>;
}

export const api = {
  meta: () => request<Meta>("/api/meta"),
  dashboard: (location: string) =>
    request<Dashboard>(`/api/dashboard${params({ location })}`),
  stock: (
    location: string,
    category: string,
    below_min: boolean,
    sku?: string,
  ) =>
    request<StockItem[]>(
      `/api/stock${params({ location, category, below_min, sku })}`,
    ),
  products: () => request<Product[]>("/api/products"),
  product: (sku: string) =>
    request<Product>(`/api/products/${encodeURIComponent(sku)}`),
  batches: (sku: string, location: string) =>
    request<Batch[]>(`/api/batches${params({ sku, location })}`),
  movements: (sku: string, location: string, offset: number) =>
    request<MovementPage>(
      `/api/movements${params({ sku, location, offset, limit: 10 })}`,
    ),
  alerts: (location: string, type: string, severity: string) =>
    request<Alert[]>(`/api/alerts${params({ location, type, severity })}`),
  reorder: (location: string, horizon_days: number) =>
    request<ReorderList>(
      `/api/reorder-list${params({ location, horizon_days })}`,
    ),
  forecast: (body: {
    sku: string;
    location: string;
    horizon_months: number;
    safety_stock_days: number;
    budget_limit: number | null;
  }) => request<Forecast>("/api/forecast", body),
  plan: (body: {
    period: Period;
    location: string;
    budget_limit: number | null;
  }) => request<PurchasePlan>("/api/purchase-plan", body),
  budget: (body: {
    period: Period;
    location: string;
    limit: number | null;
    compare_with_previous: boolean;
  }) => request<Budget>("/api/budget", body),
  prices: (sku: string, supplier_id: string) =>
    request<PriceDynamics>(
      `/api/price-dynamics${params({ sku, supplier_id })}`,
    ),
  services: () => request<Service[]>("/api/services"),
  suppliers: () => request<Supplier[]>("/api/suppliers"),
  serviceCost: (id: string) =>
    request<ServiceEconomics>(`/api/service-cost/${encodeURIComponent(id)}`),
  simulate: (body: {
    service_id: string;
    price_changes: { sku: string; delta_pct: number }[];
  }) => request<ServiceEconomics>("/api/service-cost/simulate", body),
  chatHistory: () => request<ChatSummary[]>("/api/chat"),
  chatExamples: () => request<string[]>("/api/chat/examples"),
  chatMessage: (id: string) =>
    request<ChatMessage>(`/api/chat/${encodeURIComponent(id)}`),
  ask: (body: {
    message: string;
    location: string;
    budget_limit: number | null;
  }) => request<ChatMessage>("/api/chat", body),
};
