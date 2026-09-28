import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../shared/api";
import { date, money, number, percent } from "../shared/format";
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
} from "../shared/ui";

export function EconomicsPage() {
  const products = useQuery({ queryKey: ["products"], queryFn: api.products });
  const services = useQuery({ queryKey: ["services"], queryFn: api.services });
  const suppliers = useQuery({
    queryKey: ["suppliers"],
    queryFn: api.suppliers,
  });
  const [selectedSku, setSelectedSku] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [supplier, setSupplier] = useState("");
  const [change, setChange] = useState("15");
  const sku = selectedSku || products.data?.[0]?.sku || "";
  const serviceId = selectedService || services.data?.[0]?.service_id || "";
  const priceQuery = useQuery({
    queryKey: ["price-dynamics", sku, supplier],
    queryFn: () => api.prices(sku, supplier),
    enabled: !!sku,
  });
  const costQuery = useQuery({
    queryKey: ["service-cost", serviceId],
    queryFn: () => api.serviceCost(serviceId),
    enabled: !!serviceId,
  });
  const simulation = useMutation({
    mutationFn: (body: {
      service_id: string;
      price_changes: { sku: string; delta_pct: number }[];
    }) => api.simulate(body),
  });
  const service = services.data?.find((item) => item.service_id === serviceId);
  return (
    <>
      <PageHeading
        eyebrow="АНАЛИТИКА / ЦЕНЫ И УСЛУГИ"
        title="Экономика услуг"
        description="Закупочные цены и себестоимость услуг по сети SPA. Mock API не разделяет эти расчёты по объектам."
      />
      <div className="two-col economics-grid">
        <div className="column-stack">
          <Panel title="Динамика закупочной цены" eyebrow="ПОЗИЦИЯ И ПОСТАВЩИК">
            <div className="filters">
              <Field label="Товар">
                <select
                  value={sku}
                  onChange={(event) => {
                    setSelectedSku(event.target.value);
                    setSupplier("");
                  }}
                >
                  {products.data?.map((item) => (
                    <option key={item.sku} value={item.sku}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Поставщик">
                <select
                  value={supplier}
                  onChange={(event) => setSupplier(event.target.value)}
                >
                  <option value="">Все поставщики</option>
                  {suppliers.data
                    ?.filter((item) =>
                      item.products.some((product) => product.sku === sku),
                    )
                    .map((item) => (
                      <option value={item.supplier_id} key={item.supplier_id}>
                        {item.name}
                      </option>
                    ))}
                </select>
              </Field>
            </div>
          </Panel>
          {products.isError ? (
            <Failure error={products.error} retry={() => products.refetch()} />
          ) : priceQuery.isPending ? (
            <Loading />
          ) : priceQuery.isError ? (
            <Failure
              error={priceQuery.error}
              retry={() => priceQuery.refetch()}
            />
          ) : (
            <>
              <div className="metric-grid compact">
                <Metric
                  label="Базовая цена"
                  value={money(priceQuery.data.base_avg_price)}
                  note={priceQuery.data.base_period}
                />
                <Metric
                  label="Текущая цена"
                  value={money(priceQuery.data.current_avg_price)}
                  note={priceQuery.data.current_period}
                />
                <Metric
                  label="Изменение"
                  value={percent(priceQuery.data.delta_pct)}
                  note={money(priceQuery.data.delta_rub)}
                />
              </div>
              <Warnings items={priceQuery.data.warnings} />
              <Panel title="История закупок" eyebrow="ЦЕНА ПО НАКЛАДНЫМ">
                {priceQuery.data.purchases.length ? (
                  <DataTable
                    headers={[
                      "Дата",
                      "Поставщик",
                      "Цена",
                      "Количество",
                      "Накладная",
                    ]}
                  >
                    {priceQuery.data.purchases.map((item, index) => (
                      <tr key={`${item.invoice_no}-${index}`}>
                        <td>{date(item.date)}</td>
                        <td>{item.supplier_name}</td>
                        <td>{money(item.unit_price)}</td>
                        <td>{number(item.qty)}</td>
                        <td>{item.invoice_no}</td>
                      </tr>
                    ))}
                  </DataTable>
                ) : (
                  <Empty>Закупок за выбранные периоды нет.</Empty>
                )}
              </Panel>
              <ExplanationBlock value={priceQuery.data.explanation} />
            </>
          )}
        </div>
        <div className="column-stack">
          <Panel title="Себестоимость услуги" eyebrow="ПРОЦЕДУРА И СЦЕНАРИЙ">
            <div className="filters">
              <Field label="Услуга">
                <select
                  value={serviceId}
                  onChange={(event) => {
                    setSelectedService(event.target.value);
                    simulation.reset();
                  }}
                >
                  {services.data?.map((item) => (
                    <option key={item.service_id} value={item.service_id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Panel>
          {services.isError ? (
            <Failure error={services.error} retry={() => services.refetch()} />
          ) : costQuery.isPending ? (
            <Loading />
          ) : costQuery.isError ? (
            <Failure
              error={costQuery.error}
              retry={() => costQuery.refetch()}
            />
          ) : (
            <>
              <div className="metric-grid compact">
                <Metric
                  label="Себестоимость"
                  value={money(costQuery.data.current_total_cost)}
                  note={`${costQuery.data.current_period} · изменение ${percent(costQuery.data.cost_delta_pct)}`}
                />
                <Metric
                  label="Маржа"
                  value={money(costQuery.data.current_margin_rub)}
                  note={`${percent(costQuery.data.current_margin_pct)} от цены услуги`}
                />
              </div>
              <Panel title="Материалы услуги" eyebrow="РАСХОД И ЦЕНА">
                {costQuery.data.materials.length ? (
                  <DataTable
                    headers={["Материал", "Норма", "Цена", "Себестоимость"]}
                  >
                    {costQuery.data.materials.map((item) => (
                      <tr key={item.sku}>
                        <td>{item.name}</td>
                        <td>
                          {number(item.qty)} {item.unit}
                        </td>
                        <td>{money(item.current_price)}</td>
                        <td>{money(item.current_cost)}</td>
                      </tr>
                    ))}
                  </DataTable>
                ) : (
                  <Empty />
                )}
              </Panel>
              <Panel
                title="Что если цены вырастут?"
                eyebrow="СЦЕНАРИЙ ДЛЯ МАТЕРИАЛОВ УСЛУГИ"
              >
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (service && Number(change) >= -100)
                      simulation.mutate({
                        service_id: serviceId,
                        price_changes: service.norms.map((item) => ({
                          sku: item.sku,
                          delta_pct: Number(change),
                        })),
                      });
                  }}
                >
                  <div className="filters">
                    <Field label="Изменение закупочных цен, %">
                      <input
                        type="number"
                        min="-100"
                        value={change}
                        onChange={(event) => setChange(event.target.value)}
                      />
                    </Field>
                    <button
                      className="button primary"
                      type="submit"
                      disabled={
                        simulation.isPending ||
                        !service ||
                        Number(change) < -100
                      }
                    >
                      Пересчитать
                    </button>
                  </div>
                </form>
                {simulation.isPending && (
                  <Loading label="Пересчитываем маржу…" />
                )}
                {simulation.isError && (
                  <Failure
                    error={simulation.error}
                    retry={() =>
                      service &&
                      simulation.mutate({
                        service_id: serviceId,
                        price_changes: service.norms.map((item) => ({
                          sku: item.sku,
                          delta_pct: Number(change),
                        })),
                      })
                    }
                  />
                )}
                {simulation.data && (
                  <div className="sim-result">
                    <Metric
                      label="Маржа в сценарии"
                      value={money(simulation.data.current_margin_rub)}
                      note={percent(simulation.data.current_margin_pct)}
                    />
                    <Metric
                      label="Изменение маржи"
                      value={money(simulation.data.margin_delta_rub)}
                      note={percent(simulation.data.margin_delta_pct)}
                    />
                    <Warnings items={simulation.data.warnings} />
                    <ExplanationBlock value={simulation.data.explanation} />
                  </div>
                )}
              </Panel>
              <ExplanationBlock value={costQuery.data.explanation} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
