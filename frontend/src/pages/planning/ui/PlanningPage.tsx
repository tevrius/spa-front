import styles from "./PlanningPage.module.css";
import ui from "@/shared/ui/ui.module.css";
import { memo, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelectedLocation } from "@/features/location";
import { procurementQueries } from "@/entities/procurement";
import { downloadJson } from "@/shared/lib/export";
import { date, money, number, percent, periodName } from "@/shared/lib/format";
import type { Period, PlanGroup } from "@/shared/types";
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
  Warnings,
} from "@/shared/ui";

const Breakdown = memo(function Breakdown({
  title,
  groups,
}: {
  title: string;
  groups: PlanGroup[];
}) {
  return (
    <Panel title={title}>
      {groups.length ? (
        <div className={styles["breakdown"]}>
          {groups.map((group) => (
            <div key={group.key}>
              <span>{group.label}</span>
              <strong>{money(group.cost)}</strong>
            </div>
          ))}
        </div>
      ) : (
        <Empty />
      )}
    </Panel>
  );
});

export function PlanningPage() {
  const location = useSelectedLocation();
  const [period, setPeriod] = useState<Period>("quarter");
  const [limitInput, setLimitInput] = useState("");
  const limit = limitInput.trim() ? Number(limitInput) : null;
  const valid = limit === null || limit >= 0;
  const plan = useQuery({
    ...procurementQueries.plan({ period, location, budget_limit: limit }),
    enabled: valid,
  });
  const budget = useQuery({
    ...procurementQueries.budget({
      period,
      location,
      limit,
      compare_with_previous: true,
    }),
    enabled: valid,
  });
  const maxMonth = useMemo(
    () =>
      Math.max(1, ...(budget.data?.by_month.map((item) => item.cost) || [])),
    [budget.data],
  );
  return (
    <>
      <PageHeading
        eyebrow="ЗАКУПКИ / ПЛАНИРОВАНИЕ"
        title="План и бюджет"
        description="Стоимость по месяцам, категориям и позициям. Изменение бюджета сопровождается объяснением причин."
        action={
          plan.data &&
          budget.data && (
            <button
              className={[ui["button"], ui["secondary"]].join(" ")}
              type="button"
              onClick={() =>
                downloadJson(`purchase-plan-${location}-${period}.json`, {
                  plan: plan.data,
                  budget: budget.data,
                })
              }
            >
              Скачать план ↓
            </button>
          )
        }
      />
      <Panel title="Параметры плана" className={ui["filter-panel"]}>
        <div className={[ui["filters"], styles["planning-filters"]].join(" ")}>
          <Field label="Период">
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value as Period)}
            >
              {(Object.keys(periodName) as Period[]).map((item) => (
                <option key={item} value={item}>
                  {periodName[item]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Лимит бюджета, ₽">
            <input
              type="number"
              min="0"
              placeholder="Без лимита"
              value={limitInput}
              onChange={(event) => setLimitInput(event.target.value)}
            />
          </Field>
        </div>
        {!valid && (
          <p className={ui["form-error"]}>Лимит должен быть неотрицательным.</p>
        )}
      </Panel>
      {!valid ? null : plan.isPending || budget.isPending ? (
        <Loading label="Формируем план и бюджет…" />
      ) : plan.isError ? (
        <Failure error={plan.error} retry={() => plan.refetch()} />
      ) : budget.isError ? (
        <Failure error={budget.error} retry={() => budget.refetch()} />
      ) : (
        <>
          <div
            className={[
              ui["metric-grid"],
              ui["compact"],
              styles["planning-metrics"],
            ].join(" ")}
          >
            <Metric
              label="План закупок"
              value={money(plan.data.total_cost)}
              note={`${date(plan.data.period_from)} — ${date(plan.data.period_to)}`}
            />
            <Metric
              label="Позиции в плане"
              value={number(plan.data.total_positions)}
              note="По выбранному объекту"
            />
            <Metric
              label="Бюджет периода"
              value={money(budget.data.total_cost)}
              note={periodName[period]}
            />
            <Metric
              label="К предыдущему периоду"
              value={percent(budget.data.delta_pct)}
              note={
                budget.data.delta_rub == null
                  ? "Нет данных для сравнения"
                  : money(budget.data.delta_rub)
              }
            />
          </div>
          <Warnings items={[...plan.data.warnings, ...budget.data.warnings]} />
          {plan.data.over_limit_by != null && plan.data.over_limit_by > 0 && (
            <div className={[ui["notice"], ui["notice-warning"]].join(" ")}>
              <strong>Выше лимита на {money(plan.data.over_limit_by)}</strong>
              <span>Проверьте приоритеты позиций в плане.</span>
            </div>
          )}
          <div className={[ui["two-col"], styles["planning-grid"]].join(" ")}>
            <Panel
              title="Бюджет по месяцам"
              eyebrow={`${date(budget.data.period_from)} — ${date(budget.data.period_to)}`}
            >
              {budget.data.by_month.length ? (
                <div
                  className={styles["bar-chart"]}
                  role="group"
                  aria-label="Бюджет закупок по месяцам"
                >
                  {budget.data.by_month.map((item) => (
                    <div className={styles["bar-row"]} key={item.key}>
                      <span>{item.label}</span>
                      <div className={styles["bar-track"]} aria-hidden="true">
                        <div
                          className={styles["bar-fill"]}
                          style={{ width: `${(item.cost / maxMonth) * 100}%` }}
                        />
                      </div>
                      <strong>{money(item.cost)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty />
              )}
              <p className={styles["chart-note"]}>
                Суммы и разбивка получены из API. Шкала показывает долю от
                максимального месяца.
              </p>
            </Panel>
            <Panel
              title="Почему бюджет изменился"
              eyebrow="СРАВНЕНИЕ С ПРЕДЫДУЩИМ ПЕРИОДОМ"
            >
              <div className={styles["budget-compare"]}>
                <span>Предыдущий период</span>
                <strong>{money(budget.data.previous_period_cost)}</strong>
                <span>Изменение</span>
                <strong>
                  {money(budget.data.delta_rub)} ·{" "}
                  {percent(budget.data.delta_pct)}
                </strong>
              </div>
              {budget.data.drivers.length ? (
                <div className={styles["drivers"]}>
                  {budget.data.drivers.map((driver) => (
                    <div key={driver.driver}>
                      <div>
                        <strong>{driver.label}</strong>
                        <b>{money(driver.impact_rub)}</b>
                      </div>
                      <p>
                        {driver.comment} · {percent(driver.impact_pct)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty>Драйверов изменения нет.</Empty>
              )}
            </Panel>
          </div>
          <div className={[ui["two-col"], styles["planning-grid"]].join(" ")}>
            <Breakdown title="По категориям" groups={plan.data.by_category} />
            <Breakdown title="По объектам" groups={plan.data.by_location} />
          </div>
          <div className={[ui["two-col"], styles["planning-grid"]].join(" ")}>
            <Breakdown title="По месяцам" groups={plan.data.by_month} />
            <Breakdown title="По товарам" groups={plan.data.by_product} />
          </div>
          <Panel title="Строки плана" eyebrow="ОБЪЁМ, СТОИМОСТЬ И ДАТА ЗАКАЗА">
            {plan.data.items.length ? (
              <DataTable
                headers={[
                  "Месяц",
                  "Позиция",
                  "Категория",
                  "Объект",
                  "Количество",
                  "Заказать до",
                  "Стоимость",
                ]}
              >
                {plan.data.items.map((item, index) => (
                  <tr
                    key={`${item.month}-${item.location}-${item.sku}-${index}`}
                  >
                    <td>{item.month}</td>
                    <td>
                      <strong>{item.name}</strong>
                      <span className={ui["table-sub"]}>{item.sku}</span>
                    </td>
                    <td>{item.category}</td>
                    <td>{item.location}</td>
                    <td>
                      {number(item.qty)} {item.unit}
                    </td>
                    <td>{date(item.order_by_date)}</td>
                    <td>{money(item.cost)}</td>
                  </tr>
                ))}
              </DataTable>
            ) : (
              <Empty>На выбранный период план пуст.</Empty>
            )}
          </Panel>
          <ExplanationBlock value={plan.data.explanation} />
          <ExplanationBlock value={budget.data.explanation} />
        </>
      )}
    </>
  );
}
