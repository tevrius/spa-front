import ui from "../shared/ui.module.css";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "../app/App";
import { api } from "../shared/api";
import { date, money, movementNames, number } from "../shared/format";
import {
  DataTable,
  Empty,
  Failure,
  Field,
  Loading,
  Metric,
  PageHeading,
  Panel,
  Status,
} from "../shared/ui";

export function StockPage({ categories }: { categories: string[] }) {
  const location = useLocation();
  const [category, setCategory] = useState("");
  const [belowMin, setBelowMin] = useState(false);
  const query = useQuery({
    queryKey: ["stock", location, category, belowMin],
    queryFn: () => api.stock(location, category, belowMin),
  });
  return (
    <>
      <PageHeading
        eyebrow="СКЛАД / ОСТАТКИ"
        title="Состояние запасов"
        description="Остатки, запас в днях и сроки годности по выбранному объекту."
      />
      <Panel className={ui["filter-panel"]}>
        <div className={ui["filters"]}>
          <Field label="Категория">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">Все категории</option>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <label className={ui["check-field"]}>
            <input
              type="checkbox"
              checked={belowMin}
              onChange={(event) => setBelowMin(event.target.checked)}
            />{" "}
            Только ниже минимального остатка
          </label>
        </div>
      </Panel>
      <Panel
        title="Позиции на складе"
        eyebrow={query.data ? `${query.data.length} позиций` : "ЗАГРУЗКА"}
      >
        {query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <Failure error={query.error} retry={() => query.refetch()} />
        ) : query.data.length ? (
          <DataTable
            headers={[
              "Позиция",
              "Остаток",
              "Запас",
              "Мин. остаток",
              "Ближайший срок",
              "Стоимость",
            ]}
          >
            {query.data.map((item) => (
              <tr key={`${item.location}-${item.sku}`}>
                <td>
                  <Link className={ui["table-title"]} to={`/stock/${item.sku}`}>
                    {item.name}
                  </Link>
                  <span className={ui["table-sub"]}>
                    {item.sku} · {item.category}
                  </span>
                </td>
                <td>
                  <strong>
                    {number(item.qty)} {item.unit}
                  </strong>
                </td>
                <td>
                  {item.days_of_cover == null
                    ? "Нет расхода"
                    : `${number(item.days_of_cover)} дн.`}
                </td>
                <td>
                  {number(item.min_stock)} {item.unit}
                </td>
                <td>{date(item.nearest_expiry)}</td>
                <td>{money(item.stock_value)}</td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <Empty />
        )}
      </Panel>
    </>
  );
}

export function ProductPage() {
  const { sku = "" } = useParams();
  const location = useLocation();
  const [offset, setOffset] = useState(0);
  const product = useQuery({
    queryKey: ["product", sku],
    queryFn: () => api.product(sku),
  });
  const stock = useQuery({
    queryKey: ["stock-item", sku, location],
    queryFn: () =>
      api.stock(location, "", false, sku).then((items) => items[0]),
    enabled: !!sku,
  });
  const batches = useQuery({
    queryKey: ["batches", sku, location],
    queryFn: () => api.batches(sku, location),
  });
  const movements = useQuery({
    queryKey: ["movements", sku, location, offset],
    queryFn: () => api.movements(sku, location, offset),
  });
  if (product.isPending) return <Loading />;
  if (product.isError)
    return <Failure error={product.error} retry={() => product.refetch()} />;
  const item = stock.data;
  return (
    <>
      <Link to="/stock" className={ui["back-link"]}>
        ← Все остатки
      </Link>
      <PageHeading
        eyebrow={`${product.data.category} · ${sku}`}
        title={product.data.name}
        description={`Условия хранения: ${product.data.storage}. Поставщик: ${product.data.default_supplier_id}. Срок поставки: ${product.data.lead_time_days} дн.`}
        action={
          <Link
            className={[ui["button"], ui["primary"]].join(" ")}
            to={`/forecast?sku=${sku}`}
          >
            Рассчитать закупку →
          </Link>
        }
      />
      {stock.isError ? (
        <Failure error={stock.error} retry={() => stock.refetch()} />
      ) : stock.isPending ? (
        <Loading />
      ) : !item ? (
        <Empty>Нет остатков по выбранному объекту.</Empty>
      ) : (
        <div className={ui["metric-grid"]}>
          <Metric
            label="Остаток"
            value={`${number(item.qty)} ${item.unit}`}
            note={`На ${date(item.updated_at)}`}
          />
          <Metric
            label="Запас"
            value={
              item.days_of_cover == null
                ? "Нет расхода"
                : `${number(item.days_of_cover)} дн.`
            }
            note="По фактическому расходу"
          />
          <Metric
            label="Страховой запас"
            value={`${number(item.safety_stock)} ${item.unit}`}
            note={`${product.data.safety_stock_days} дней`}
          />
          <Metric
            label="Стоимость"
            value={money(item.stock_value)}
            note={`Ближайший срок: ${date(item.nearest_expiry)}`}
          />
        </div>
      )}
      <div className={ui["two-col"]}>
        <Panel title="Партии" eyebrow="СРОКИ ГОДНОСТИ">
          {batches.isPending ? (
            <Loading />
          ) : batches.isError ? (
            <Failure error={batches.error} retry={() => batches.refetch()} />
          ) : batches.data.length ? (
            <DataTable headers={["Партия", "Остаток", "Истекает", "Статус"]}>
              {batches.data.map((batch) => (
                <tr key={batch.batch_id}>
                  <td>
                    <strong>{batch.batch_id}</strong>
                    <span className={ui["table-sub"]}>{batch.invoice_no}</span>
                  </td>
                  <td>
                    {number(batch.qty)} {batch.unit}
                  </td>
                  <td>{date(batch.expires_at)}</td>
                  <td>
                    <Status
                      kind={
                        batch.status === "ok"
                          ? "info"
                          : batch.status === "expiring"
                            ? "warning"
                            : "critical"
                      }
                    >
                      {batch.status === "ok"
                        ? "В норме"
                        : batch.status === "expiring"
                          ? "Скоро истечёт"
                          : "Истёк"}
                    </Status>
                  </td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <Empty>Партии не найдены.</Empty>
          )}
        </Panel>
        <Panel title="Движение товара" eyebrow="ПОСЛЕДНИЕ ОПЕРАЦИИ">
          {movements.isPending ? (
            <Loading />
          ) : movements.isError ? (
            <Failure
              error={movements.error}
              retry={() => movements.refetch()}
            />
          ) : movements.data.items.length ? (
            <>
              <DataTable
                headers={["Дата", "Операция", "Количество", "Документ"]}
              >
                {movements.data.items.map((row) => (
                  <tr key={row.movement_id}>
                    <td>{date(row.date)}</td>
                    <td>{movementNames[row.type] || row.type}</td>
                    <td>
                      {number(row.qty)} {row.unit}
                    </td>
                    <td>{row.doc_no || "—"}</td>
                  </tr>
                ))}
              </DataTable>
              <div className={ui["pagination"]}>
                <button
                  className={[ui["button"], ui["secondary"]].join(" ")}
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - 10))}
                >
                  ← Назад
                </button>
                <span>
                  {offset + 1}–{Math.min(offset + 10, movements.data.total)} из{" "}
                  {movements.data.total}
                </span>
                <button
                  className={[ui["button"], ui["secondary"]].join(" ")}
                  disabled={offset + 10 >= movements.data.total}
                  onClick={() => setOffset(offset + 10)}
                >
                  Далее →
                </button>
              </div>
            </>
          ) : (
            <Empty>Движений нет.</Empty>
          )}
        </Panel>
      </div>
    </>
  );
}
