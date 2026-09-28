import { useQuery } from "@tanstack/react-query";
import { NavLink, Outlet } from "react-router-dom";
import { metaQueries } from "@/entities/meta";
import { useLocationStore, useSelectedLocation } from "@/features/location";
import { navigation, routePaths } from "@/shared/config/routes";
import { date } from "@/shared/lib/format";
import { Failure, Loading } from "@/shared/ui";
import ui from "@/shared/ui/ui.module.css";
import styles from "./AppShell.module.css";

export function AppShell() {
  const meta = useQuery(metaQueries.all());
  const location = useSelectedLocation();
  const setSelectedCode = useLocationStore((state) => state.setSelectedCode);

  if (meta.isPending) return <Loading />;
  if (meta.isError) {
    return <Failure error={meta.error} retry={() => void meta.refetch()} />;
  }

  return (
    <div className={styles["app-shell"]}>
      <aside className={styles["sidebar"]}>
        <NavLink
          to={routePaths.dashboard}
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
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === routePaths.dashboard}
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
            <span className={styles["topbar-caption"]}>Объект управления</span>
            <label className={ui["visually-hidden"]} htmlFor="global-location">
              Выбрать объект
            </label>
            <select
              id="global-location"
              className={styles["location-select"]}
              value={location}
              onChange={(event) => setSelectedCode(event.target.value)}
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
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === routePaths.dashboard}
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
          <Outlet />
        </main>
      </div>
    </div>
  );
}
