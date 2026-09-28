import styles from "./App.module.css";
import ui from "../shared/ui.module.css";
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
      <div className={styles["app-shell"]}>
        <aside className={styles["sidebar"]}>
          <NavLink
            to="/"
            className={styles["brand"]}
            aria-label="Mountain and Sea Spa, на главную"
          >
            <span className={styles["brand-mark"]}>
              M<span>·</span>S
            </span>
            <span>
              <strong>Mountain & Sea</strong>
              <small>SPA / INVENTORY</small>
            </span>
          </NavLink>
          <div className={styles["sidebar-label"]}>РАБОЧЕЕ ПРОСТРАНСТВО</div>
          <nav aria-label="Основная навигация">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  [styles["nav-link"], isActive && styles["active"]]
                    .filter(Boolean)
                    .join(" ")
                }
              >
                <span className={styles["nav-icon"]} aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className={styles["sidebar-foot"]}>
            <span className={styles["online-dot"]} /> Данные на{" "}
            {date(meta.data.as_of)}
            <small>Рекомендации требуют решения управляющего</small>
          </div>
        </aside>
        <div className={styles["workspace"]}>
          <header className={styles["topbar"]}>
            <div className={styles["mobile-brand"]}>
              M<span>·</span>S <small>SPA / INVENTORY</small>
            </div>
            <div className={styles["topbar-right"]}>
              <span className={styles["topbar-caption"]}>
                Объект управления
              </span>
              <label
                className={ui["visually-hidden"]}
                htmlFor="global-location"
              >
                Выбрать объект
              </label>
              <select
                id="global-location"
                className={styles["location-select"]}
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
          <nav className={styles["mobile-nav"]} aria-label="Основная навигация">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  [styles["mobile-link"], isActive && styles["active"]]
                    .filter(Boolean)
                    .join(" ")
                }
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <main id="content" className={styles["content"]}>
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
