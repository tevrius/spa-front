import styles from "./AlertsPage.module.css";
import ui from "@/shared/ui/ui.module.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSelectedLocation } from "@/features/location";
import { inventoryQueries } from "@/entities/inventory";
import { routePaths } from "@/shared/config/routes";
import { alertNames, date, money, number, percent } from "@/shared/lib/format";
import {
  Empty,
  Failure,
  Field,
  Loading,
  PageHeading,
  Panel,
  Status,
} from "@/shared/ui";

const metricNames: Record<string, string> = {
  avg_daily_consumption: "Расход в день",
  avg_daily_previous: "Прежний расход в день",
  avg_daily_recent: "Текущий расход в день",
  avg_price_previous: "Прежняя цена",
  avg_price_recent: "Текущая цена",
  batch_id: "Партия",
  change_pct: "Изменение",
  days_of_cover: "Запас, дней",
  days_to_expiry: "До истечения, дней",
  days_without_movement: "Без движения, дней",
  expires_at: "Истекает",
  incoming: "В пути",
  lead_time_days: "Поставка, дней",
  min_stock: "Минимум",
  qty: "Количество",
  status: "Статус",
  stock: "Остаток",
  stock_value: "Стоимость запаса",
  stockout_date: "Исчерпание",
  supplier_id: "Поставщик",
  value_at_risk: "Под риском",
};
function metricText(key: string, value: unknown): string {
  if (value == null) return "—";
  if (key.endsWith("_date") || key === "expires_at") return date(String(value));
  if (key.endsWith("_pct")) return percent(Number(value));
  if (key.includes("price") || key.includes("value"))
    return money(Number(value));
  if (typeof value === "number") return number(value);
  if (typeof value === "string" || typeof value === "boolean")
    return String(value);
  return JSON.stringify(value);
}

export function AlertsPage({ alertTypes }: { alertTypes: string[] }) {
  const location = useSelectedLocation();
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState("");
  const query = useQuery(inventoryQueries.alerts(location, type, severity));
  return (
    <>
      <PageHeading
        eyebrow="СКЛАД / ПРЕДУПРЕЖДЕНИЯ"
        title="Риски и рекомендации"
        description="Приоритеты для управляющего: что может закончиться, испортиться или подорожать."
      />
      <Panel className={ui["filter-panel"]}>
        <div className={ui["filters"]}>
          <Field label="Тип риска">
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="">Все типы</option>
              {alertTypes.map((item) => (
                <option value={item} key={item}>
                  {alertNames[item] || item}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Важность">
            <select
              value={severity}
              onChange={(event) => setSeverity(event.target.value)}
            >
              <option value="">Любая</option>
              <option value="critical">Критично</option>
              <option value="warning">Внимание</option>
              <option value="info">Информация</option>
            </select>
          </Field>
        </div>
      </Panel>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <Failure error={query.error} retry={() => query.refetch()} />
      ) : query.data.length ? (
        <div className={styles["alert-grid"]}>
          {query.data.map((alert) => (
            <article
              className={[
                styles["alert-card"],
                styles[`alert-${alert.severity}`],
              ]
                .filter(Boolean)
                .join(" ")}
              key={alert.alert_id}
            >
              <div className={styles["alert-top"]}>
                <Status kind={alert.severity} />
                <span>{alertNames[alert.type] || alert.type}</span>
              </div>
              <h2>{alert.title}</h2>
              <p>{alert.message}</p>
              <div className={styles["alert-meta"]}>
                {alert.name} · {alert.location_name} · {date(alert.as_of)}
              </div>
              {Object.keys(alert.metrics).length > 0 && (
                <dl className={ui["metrics-dl"]}>
                  {Object.entries(alert.metrics).map(([key, value]) => (
                    <div key={key}>
                      <dt>{metricNames[key] || key.replaceAll("_", " ")}</dt>
                      <dd>{metricText(key, value)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className={styles["recommendation"]}>
                <strong>Что сделать</strong>
                <p>{alert.recommendation}</p>
              </div>
              <Link
                to={routePaths.product(alert.sku)}
                className={ui["text-link"]}
              >
                Карточка позиции →
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <Empty>По этим фильтрам предупреждений нет.</Empty>
      )}
    </>
  );
}
