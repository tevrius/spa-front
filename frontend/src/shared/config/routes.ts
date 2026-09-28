export const routePaths = {
  dashboard: "/",
  stock: "/stock",
  product: (sku: string) => `/stock/${encodeURIComponent(sku)}`,
  alerts: "/alerts",
  forecast: "/forecast",
  reorder: "/reorder",
  planning: "/planning",
  economics: "/economics",
  chat: "/chat",
} as const;

export const navigation = [
  { to: routePaths.dashboard, icon: "▦", label: "Обзор" },
  { to: routePaths.stock, icon: "◫", label: "Склад" },
  { to: routePaths.alerts, icon: "◇", label: "Риски" },
  { to: routePaths.forecast, icon: "◈", label: "Расчёт закупки" },
  { to: routePaths.reorder, icon: "≡", label: "К заказу" },
  { to: routePaths.planning, icon: "▥", label: "План и бюджет" },
  { to: routePaths.economics, icon: "⌁", label: "Цены и услуги" },
  { to: routePaths.chat, icon: "✳", label: "Помощник" },
] as const;
