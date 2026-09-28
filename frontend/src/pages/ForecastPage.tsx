import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "../app/App";
import { api } from "../shared/api";
import { downloadJson } from "../shared/export";
import { date, money, number } from "../shared/format";
import {
  ExplanationBlock,
  Empty,
  Failure,
  Field,
  Loading,
  Metric,
  PageHeading,
  Panel,
  Warnings,
} from "../shared/ui";

export function ForecastPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const products = useQuery({ queryKey: ["products"], queryFn: api.products });
  const requestedSku = searchParams.get("sku") || "";
  const sku = products.data?.some((item) => item.sku === requestedSku)
    ? requestedSku
    : products.data?.[0]?.sku || "";
  const selectedProduct = products.data?.find((item) => item.sku === sku);
  const [months, setMonths] = useState(3);
  const [safetyOverride, setSafetyOverride] = useState<{
    sku: string;
    value: number;
  } | null>(null);
  const [budget, setBudget] = useState("");
  const safetyDays =
    safetyOverride?.sku === sku
      ? safetyOverride.value
      : (selectedProduct?.safety_stock_days ?? 14);
  const limit = budget.trim() === "" ? null : Number(budget);
  const validInputs =
    safetyDays >= 0 && safetyDays <= 180 && (limit === null || limit >= 0);
  const valid = sku !== "" && validInputs;
  const query = useQuery({
    queryKey: ["forecast", sku, location, months, safetyDays, limit],
    queryFn: () =>
      api.forecast({
        sku,
        location,
        horizon_months: months,
        safety_stock_days: safetyDays,
        budget_limit: limit,
      }),
    enabled: valid,
  });
  return (
    <>
      <PageHeading
        eyebrow="ЗАКУПКИ / РАСЧЁТ"
        title="Рассчитать закупку"
        description="Прогноз, точка заказа и стоимость с исходными данными и допущениями расчёта."
      />
      <Panel
        title="Параметры расчёта"
        eyebrow="ИЗМЕНИТЕ УСЛОВИЯ — РЕЗУЛЬТАТ ОБНОВИТСЯ"
      >
        <div className="filters four">
          <Field label="Позиция">
            <select
              value={sku}
              onChange={(event) => setSearchParams({ sku: event.target.value })}
            >
              {products.data?.map((item) => (
                <option key={item.sku} value={item.sku}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Период">
            <select
              value={months}
              onChange={(event) => setMonths(Number(event.target.value))}
            >
              <option value={1}>1 месяц</option>
              <option value={3}>3 месяца</option>
              <option value={6}>6 месяцев</option>
              <option value={12}>12 месяцев</option>
            </select>
          </Field>
          <Field label="Страховой запас, дней">
            <input
              type="number"
              min="0"
              max="180"
              value={safetyDays}
              onChange={(event) =>
                setSafetyOverride({ sku, value: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="Лимит бюджета, ₽">
            <input
              type="number"
              min="0"
              placeholder="Без лимита"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
            />
          </Field>
        </div>
        {!validInputs && (
          <p className="form-error">
            Проверьте страховой запас и лимит бюджета.
          </p>
        )}
      </Panel>
      {products.isError ? (
        <Failure error={products.error} retry={() => products.refetch()} />
      ) : products.isPending ? (
        <Loading label="Загружаем товары…" />
      ) : !sku ? (
        <Empty>Нет товаров для расчёта.</Empty>
      ) : !validInputs ? null : query.isPending ? (
        <Loading label="Рассчитываем потребность…" />
      ) : query.isError ? (
        <Failure error={query.error} retry={() => query.refetch()} />
      ) : (
        <>
          <div className="result-hero">
            <div>
              <p className="eyebrow">РЕКОМЕНДАЦИЯ К ЗАКУПКЕ</p>
              <h2>
                {number(query.data.recommended_purchase_qty)}{" "}
                <span>{query.data.unit}</span>
              </h2>
              <p>
                {query.data.name} · {query.data.location_name}
              </p>
            </div>
            <div>
              <span>Ориентировочная стоимость</span>
              <strong>{money(query.data.estimated_cost)}</strong>
              <small>
                {query.data.recommended_purchase_qty > 0
                  ? `Заказать до ${date(query.data.recommended_order_date)}`
                  : "Заказ не требуется"}
              </small>
              <button
                className="button light"
                type="button"
                onClick={() =>
                  downloadJson(
                    `forecast-${query.data.sku}-${location}.json`,
                    query.data,
                  )
                }
              >
                Скачать расчёт ↓
              </button>
            </div>
          </div>
          <Warnings items={query.data.warnings} />
          {query.data.within_budget === false && (
            <div className="notice notice-warning">
              <strong>Лимит превышен</strong>
              <span>
                Рекомендация выше заданного бюджета. Проверьте объём и срок
                закупки.
              </span>
            </div>
          )}
          <div className="section-intro">
            <h2>Из чего сложилась рекомендация</h2>
            <p>
              Период {date(query.data.period_from)} —{" "}
              {date(query.data.period_to)} · {query.data.period_days} дней
            </p>
          </div>
          <div className="metric-grid">
            <Metric
              label="Прогнозный расход"
              value={`${number(query.data.forecast_demand)} ${query.data.unit}`}
              note={`Средний расход ${number(query.data.avg_daily_consumption)} ${query.data.unit}/день`}
            />
            <Metric
              label="Текущий остаток"
              value={`${number(query.data.current_stock)} ${query.data.unit}`}
              note={`Поставка в пути ${number(query.data.incoming_qty)} ${query.data.unit}`}
            />
            <Metric
              label="Без закупки к концу периода"
              value={`${number(query.data.expected_stock_without_purchase)} ${query.data.unit}`}
              note={`Исчерпание: ${date(query.data.stockout_date)}`}
              tone={
                query.data.expected_stock_without_purchase < 0
                  ? "danger"
                  : undefined
              }
            />
            <Metric
              label="Страховой запас"
              value={`${number(query.data.safety_stock)} ${query.data.unit}`}
              note={`Точка заказа ${number(query.data.reorder_point)} ${query.data.unit}`}
            />
            <Metric
              label="Цена за единицу"
              value={money(query.data.unit_price)}
              note={query.data.supplier.name}
            />
            <Metric
              label="Срок поставки"
              value={`${number(query.data.supplier.lead_time_days)} дн.`}
              note={`Сезонный коэффициент ${number(query.data.seasonality_factor)}`}
            />
          </div>
          <ExplanationBlock value={query.data.explanation} />
        </>
      )}
    </>
  );
}
