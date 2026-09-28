import { createContext, useContext, useState } from "react";
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { api } from "../shared/api";
import { date } from "../shared/format";
import { Failure, Loading } from "../shared/ui";
import { DashboardPage } from "../pages/DashboardPage";
import { StockPage, ProductPage } from "../pages/StockPage";
import { AlertsPage } from "../pages/AlertsPage";
import { ForecastPage } from "../pages/ForecastPage";
import { ReorderPage } from "../pages/ReorderPage";
import { PlanningPage } from "../pages/PlanningPage";
import { EconomicsPage } from "../pages/EconomicsPage";
import { ChatPage } from "../pages/ChatPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});
const LocationContext = createContext("");
export const useLocation = () => useContext(LocationContext);

const nav = [
  { to: "/", icon: "▦", label: "Обзор" },
  { to: "/stock", icon: "◫", label: "Склад" },
  { to: "/alerts", icon: "◇", label: "Риски" },
  { to: "/forecast", icon: "◈", label: "Расчёт закупки" },
  { to: "/reorder", icon: "≡", label: "К заказу" },
  { to: "/planning", icon: "▥", label: "План и бюджет" },
  { to: "/economics", icon: "⌁", label: "Цены и услуги" },
  { to: "/chat", icon: "✳", label: "Помощник" },
];

function AppContent() {
  const meta = useQuery({ queryKey: ["meta"], queryFn: api.meta });
  const [selected, setSelected] = useState("");
  if (meta.isPending) return <Loading />;
  if (meta.isError)
    return <Failure error={meta.error} retry={() => meta.refetch()} />;
  const location = selected || meta.data.locations[0]?.code || "";
  return (
    <LocationContext.Provider value={location}>
      <div className="app-shell">
        <aside className="sidebar">
          <NavLink
            to="/"
            className="brand"
            aria-label="Mountain and Sea Spa, на главную"
          >
            <span className="brand-mark">
              M<span>·</span>S
            </span>
            <span>
              <strong>Mountain & Sea</strong>
              <small>SPA / INVENTORY</small>
            </span>
          </NavLink>
          <div className="sidebar-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
          <nav aria-label="Основная навигация">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-foot">
            <span className="online-dot" /> Данные на {date(meta.data.as_of)}
            <small>Рекомендации требуют решения управляющего</small>
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <div className="mobile-brand">
              M<span>·</span>S <small>SPA / INVENTORY</small>
            </div>
            <div className="topbar-right">
              <span className="topbar-caption">Объект управления</span>
              <label className="visually-hidden" htmlFor="global-location">
                Выбрать объект
              </label>
              <select
                id="global-location"
                className="location-select"
                value={location}
                onChange={(event) => setSelected(event.target.value)}
              >
                {meta.data.locations.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </header>
          <nav className="mobile-nav" aria-label="Основная навигация">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `mobile-link ${isActive ? "active" : ""}`
                }
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <main id="content" className="content">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route
                path="/stock"
                element={<StockPage categories={meta.data.categories} />}
              />
              <Route path="/stock/:sku" element={<ProductPage />} />
              <Route
                path="/alerts"
                element={<AlertsPage alertTypes={meta.data.alert_types} />}
              />
              <Route path="/forecast" element={<ForecastPage />} />
              <Route path="/reorder" element={<ReorderPage />} />
              <Route path="/planning" element={<PlanningPage />} />
              <Route path="/economics" element={<EconomicsPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </LocationContext.Provider>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
