import ui from "@/shared/ui/ui.module.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSelectedLocation } from "@/features/location";
import { procurementQueries } from "@/entities/procurement";
import { routePaths } from "@/shared/config/routes";
import { downloadJson } from "@/shared/lib/export";
import { date, money, number } from "@/shared/lib/format";
import {
  DataTable,
  Empty,
  ExplanationBlock,
  Failure,
  Field,
  Loading,
  Metric,
  PageHeading,
  Panel,
  Status,
} from "@/shared/ui";

export function ReorderPage() {
  const location = useSelectedLocation();
  const [horizon, setHorizon] = useState(14);
  const query = useQuery(procurementQueries.reorder(location, horizon));
  return (
    <>
      <PageHeading
        eyebrow="ЗАКУПКИ / БЛИЖАЙШИЕ РЕШЕНИЯ"
        title="Что заказать сейчас"
        description="Позиции упорядочены по приоритету. Дата заказа учитывает срок поставки."
        action={
          query.data && (
            <button
              className={[ui["button"], ui["secondary"]].join(" ")}
              type="button"
              onClick={() =>
                downloadJson(`reorder-${location}-${horizon}d.json`, query.data)
              }
            >
              Скачать список ↓
            </button>
          )
        }
      />
      <Panel className={ui["filter-panel"]}>
        <div className={ui["filters"]}>
          <Field label="Горизонт планирования">
            <select
              value={horizon}
              onChange={(event) => setHorizon(Number(event.target.value))}
            >
              <option value={7}>7 дней</option>
              <option value={14}>14 дней</option>
              <option value={30}>30 дней</option>
              <option value={60}>60 дней</option>
            </select>
          </Field>
        </div>
      </Panel>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <Failure error={query.error} retry={() => query.refetch()} />
      ) : (
        <>
          <div className={[ui["metric-grid"], ui["compact"]].join(" ")}>
            <Metric
              label="Итого к заказу"
              value={money(query.data.total_cost)}
              note={`Горизонт ${query.data.horizon_days} дней`}
            />
            <Metric
              label="Позиции"
              value={number(query.data.items.length)}
              note="По выбранному объекту"
            />
          </div>
          <Panel title="Список закупки" eyebrow="СРОКИ И ПРИОРИТЕТ">
            <>
              {query.data.items.length ? (
                <DataTable
                  headers={[
                    "Приоритет / позиция",
                    "Запас",
                    "Исчерпание",
                    "Заказать до",
                    "Рекомендация",
                    "Стоимость",
                  ]}
                >
                  {query.data.items.map((item) => (
                    <tr key={`${item.location}-${item.sku}`}>
                      <td>
                        <Status kind={item.priority} />
                        <Link
                          className={ui["table-title"]}
                          to={`${routePaths.forecast}?sku=${encodeURIComponent(item.sku)}`}
                        >
                          {item.name}
                        </Link>
                        <span className={ui["table-sub"]}>
                          {item.supplier_name} · поставка {item.lead_time_days}{" "}
                          дн.
                        </span>
                      </td>
                      <td>
                        {item.days_of_cover == null
                          ? "Нет расхода"
                          : `${number(item.days_of_cover)} дн.`}
                      </td>
                      <td>{date(item.stockout_date)}</td>
                      <td>
                        <strong>{date(item.order_by_date)}</strong>
                      </td>
                      <td>
                        {number(item.recommended_qty)} {item.unit}
                      </td>
                      <td>{money(item.estimated_cost)}</td>
                    </tr>
                  ))}
                </DataTable>
              ) : (
                <Empty>Заказов на выбранный горизонт нет.</Empty>
              )}
            </>
          </Panel>
          <ExplanationBlock value={query.data.explanation} />
        </>
      )}
    </>
  );
}
