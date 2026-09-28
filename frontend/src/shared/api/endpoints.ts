type QueryValue = string | number | boolean | null | undefined;

export function params(values: Record<string, QueryValue>) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const encoded = query.toString();
  return encoded ? `?${encoded}` : "";
}

const resource = (path: string, id: string) =>
  `${path}/${encodeURIComponent(id)}`;

export const endpoints = {
  meta: "/api/meta",
  dashboard: "/api/dashboard",
  stock: "/api/stock",
  products: "/api/products",
  product: (sku: string) => resource("/api/products", sku),
  batches: "/api/batches",
  movements: "/api/movements",
  alerts: "/api/alerts",
  reorder: "/api/reorder-list",
  forecast: "/api/forecast",
  plan: "/api/purchase-plan",
  budget: "/api/budget",
  prices: "/api/price-dynamics",
  services: "/api/services",
  suppliers: "/api/suppliers",
  serviceCost: (id: string) => resource("/api/service-cost", id),
  simulate: "/api/service-cost/simulate",
  chat: "/api/chat",
  chatExamples: "/api/chat/examples",
  chatMessage: (id: string) => resource("/api/chat", id),
} as const satisfies Record<string, string | ((id: string) => string)>;
