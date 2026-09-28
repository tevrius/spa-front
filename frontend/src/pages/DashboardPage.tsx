import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "../app/App";
import { api } from "../shared/api";
import { date, money, number, plural } from "../shared/format";
import {
  Empty,
  Failure,
  Loading,
  Metric,
  PageHeading,
  Panel,
  Status,
} from "../shared/ui";

export function DashboardPage() {
  const location = useLocation();
  const query = useQuery({
    queryKey: ["dashboard", location],
    queryFn: () => api.dashboard(location),
  });
  if (query.isPending) return <Loading />;
  if (query.isError)
    return <Failure error={query.error} retry={() => query.refetch()} />;
  const { kpi, top_alerts, next_orders, as_of } = query.data;
  return (
    <>
      <PageHeading
        eyebrow={`ОБЗОР · ${date(as_of)}`}
        title="Склад под контролем"
        description="Сначала — позиции, где промедление может остановить процедуры. Затем — план закупок и состояние запасов."
        action={
          <Link className="button primary" to="/reorder">
            Что заказать →
          </Link>
        }
      />
      <div className="hero-band">
        <div>
          <span className="hero-kicker">ТРЕБУЕТ ВНИМАНИЯ</span>
          <strong>
            {plural(
              kpi.positions_below_reorder_point,
              "позиция",
              "позиции",
              "позиций",
            )}{" "}
            ниже точки заказа
          </strong>
          <p>
            {plural(
              kpi.alerts_critical,
              "критичное предупреждение",
              "критичных предупреждения",
              "критичных предупреждений",
            )}{" "}
            · {plural(kpi.expiring_batches, "партия", "партии", "партий")} с
            истекающим сроком
          </p>
        </div>
        <Link to="/alerts" className="button light">
          Разобрать риски →
        </Link>
      </div>
      <div className="metric-grid dashboard-metrics">
        <Metric
          label="Стоимость запасов"
          value={money(kpi.stock_value)}
          note={`На ${date(as_of)}`}
        />
        <Metric
          label="План закупок на месяц"
          value={money(kpi.forecast_month_cost)}
          note="Прогноз API"
        />
        <Metric
          label="Открытые заказы"
          value={number(kpi.open_orders_qty)}
          note={`В пути на ${money(kpi.open_orders_cost)}`}
        />
        <Metric
          label="Процедур за 30 дней"
          value={number(kpi.procedures_last_30_days)}
          note={`${number(kpi.sku_count)} позиций на складе`}
        />
      </div>
      <div className="two-col">
        <Panel
          title="Главные риски"
          eyebrow="ЧТО ВАЖНО СЕГОДНЯ"
          action={
            <Link to="/alerts" className="text-link">
              Все риски →
            </Link>
          }
        >
          {top_alerts.length ? (
            <div className="list-stack">
              {top_alerts.slice(0, 5).map((alert) => (
                <Link
                  to={`/stock/${alert.sku}`}
                  className="list-row"
                  key={alert.alert_id}
                >
                  <div>
                    <Status kind={alert.severity} />
                    <strong>{alert.title}</strong>
                    <small>
                      {alert.name} · {alert.location_name}
                    </small>
                  </div>
                  <span className="row-arrow">↗</span>
                </Link>
              ))}
            </div>
          ) : (
            <Empty>Активных предупреждений нет.</Empty>
          )}
        </Panel>
        <Panel
          title="Ближайшие заказы"
          eyebrow="ПЛАН НА 14 ДНЕЙ"
          action={
            <Link to="/reorder" className="text-link">
              Весь список →
            </Link>
          }
        >
          {next_orders.length ? (
            <div className="list-stack">
              {next_orders.slice(0, 5).map((item) => (
                <Link
                  to={`/forecast?sku=${item.sku}`}
                  className="list-row"
                  key={`${item.location}-${item.sku}`}
                >
                  <div>
                    <strong>{item.name}</strong>
                    <small>
                      Заказать до {date(item.order_by_date)} ·{" "}
                      {number(item.recommended_qty)} {item.unit}
                    </small>
                  </div>
                  <b>{money(item.estimated_cost)}</b>
                </Link>
              ))}
            </div>
          ) : (
            <Empty>На ближайшие 14 дней заказов нет.</Empty>
          )}
        </Panel>
      </div>
    </>
  );
}
