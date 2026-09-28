import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "../app/App";
import { api } from "../shared/api";
import { date, money, number, percent } from "../shared/format";
import type { ChatMessage } from "../shared/types";
import {
  DataTable,
  Empty,
  ExplanationBlock,
  Failure,
  Field,
  Loading,
  PageHeading,
  Panel,
  Warnings,
} from "../shared/ui";

const calculationLabels: Record<string, string> = {
  recommended_purchase_qty: "Рекомендуемый объём",
  estimated_cost: "Стоимость закупки",
  forecast_demand: "Прогнозный расход",
  current_stock: "Текущий остаток",
  incoming_qty: "В пути",
  reorder_point: "Точка заказа",
  stockout_date: "Исчерпание остатка",
  recommended_order_date: "Заказать до",
  total_cost: "Стоимость плана",
  total_positions: "Позиций в плане",
  previous_period_cost: "Предыдущий период",
  delta_rub: "Изменение в рублях",
  delta_pct: "Изменение, %",
  current_avg_price: "Текущая цена",
  base_avg_price: "Базовая цена",
  current_total_cost: "Себестоимость",
  current_margin_rub: "Маржа",
  current_margin_pct: "Маржинальность, %",
};
function displayCalculation(
  key: string,
  value: string | number | boolean | null,
): string {
  if (value == null) return "—";
  if (key.endsWith("_date")) return date(String(value));
  if (key.endsWith("_pct")) return percent(Number(value));
  if (key.endsWith("_cost") || key.endsWith("_price") || key.endsWith("_rub"))
    return money(Number(value));
  if (typeof value === "number") return number(value);
  return String(value);
}

function Answer({
  item,
  onFollowUp,
}: {
  item: ChatMessage;
  onFollowUp: (question: string) => void;
}) {
  const highlights = item.calculation
    ? Object.entries(item.calculation)
        .filter(
          ([key, value]) =>
            key in calculationLabels &&
            (value == null ||
              ["string", "number", "boolean"].includes(typeof value)),
        )
        .slice(0, 8)
    : [];
  return (
    <div className="answer">
      <div className="question-bubble">{item.question}</div>
      <div className="answer-card">
        <div className="answer-meta">
          <span className="assistant-mark">✳</span>
          <strong>Помощник по закупкам</strong>
          <small>{date(item.created_at)}</small>
        </div>
        <p className="answer-text">{item.answer}</p>
        <Warnings items={item.warnings} />
        {item.table && (
          <Panel title={item.table.title} className="embedded-panel">
            <DataTable headers={item.table.columns}>
              {item.table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </DataTable>
          </Panel>
        )}
        {item.calculation && Object.keys(item.calculation).length > 0 && (
          <Panel title="Данные расчёта" className="embedded-panel">
            {highlights.length > 0 && (
              <dl className="metrics-dl">
                {highlights.map(([key, value]) => (
                  <div key={key}>
                    <dt>{calculationLabels[key]}</dt>
                    <dd>
                      {displayCalculation(
                        key,
                        value as string | number | boolean | null,
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            <details className="raw-details">
              <summary>Полный ответ расчётного модуля</summary>
              <pre>{JSON.stringify(item.calculation, null, 2)}</pre>
            </details>
          </Panel>
        )}
        <ExplanationBlock value={item.explanation} />
        {item.follow_up.length > 0 && (
          <div className="follow-ups">
            <span>Уточнить вопрос</span>
            {item.follow_up.map((question) => (
              <button
                type="button"
                key={question}
                onClick={() => onFollowUp(question)}
              >
                {question} →
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatPage() {
  const location = useLocation();
  const client = useQueryClient();
  const [input, setInput] = useState("");
  const [limitInput, setLimitInput] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [latest, setLatest] = useState<ChatMessage | null>(null);
  const history = useQuery({
    queryKey: ["chat-history"],
    queryFn: api.chatHistory,
  });
  const examples = useQuery({
    queryKey: ["chat-examples"],
    queryFn: api.chatExamples,
  });
  const selected = useQuery({
    queryKey: ["chat-message", selectedId],
    queryFn: () => api.chatMessage(selectedId),
    enabled: !!selectedId,
  });
  const send = useMutation({
    mutationFn: (message: string) =>
      api.ask({
        message,
        location,
        budget_limit: limitInput.trim() ? Number(limitInput) : null,
      }),
    onSuccess: (item) => {
      setLatest(item);
      setSelectedId("");
      setInput("");
      client.invalidateQueries({ queryKey: ["chat-history"] });
    },
  });
  const ask = (question: string) => {
    if (question.trim() && !send.isPending) send.mutate(question.trim());
  };
  const visible = selectedId ? selected.data : latest;
  return (
    <>
      <PageHeading
        eyebrow="AI / ПОМОЩНИК"
        title="Спросите о закупках"
        description="Задайте вопрос обычным языком. В ответе будут рекомендации, расчёт и данные, на которых он основан."
      />
      <div className="chat-layout">
        <aside className="chat-history">
          <Panel title="История вопросов" eyebrow="ТЕКУЩАЯ СЕССИЯ">
            {history.isPending ? (
              <Loading />
            ) : history.isError ? (
              <Failure error={history.error} retry={() => history.refetch()} />
            ) : history.data.length ? (
              <div className="history-list">
                {history.data.map((item) => (
                  <button
                    key={item.message_id}
                    className={selectedId === item.message_id ? "selected" : ""}
                    onClick={() => {
                      setSelectedId(item.message_id);
                      setLatest(null);
                    }}
                  >
                    <span>{item.question}</span>
                    <small>{date(item.created_at)}</small>
                  </button>
                ))}
              </div>
            ) : (
              <Empty>История пока пуста.</Empty>
            )}
          </Panel>
        </aside>
        <div className="chat-main">
          {selected.isPending && selectedId ? (
            <Loading />
          ) : selected.isError ? (
            <Failure error={selected.error} retry={() => selected.refetch()} />
          ) : visible ? (
            <Answer item={visible} onFollowUp={ask} />
          ) : (
            <Panel className="chat-welcome">
              <div className="welcome-icon">✳</div>
              <h2>С чего начнём?</h2>
              <p>
                Помогу оценить остатки, рассчитать закупку, разобрать риски и
                составить бюджет.
              </p>
              <div className="example-grid">
                {examples.isPending ? (
                  <Loading />
                ) : examples.isError ? (
                  <Failure
                    error={examples.error}
                    retry={() => examples.refetch()}
                  />
                ) : (
                  examples.data.slice(0, 6).map((question) => (
                    <button key={question} onClick={() => ask(question)}>
                      {question}
                      <span>↗</span>
                    </button>
                  ))
                )}
              </div>
            </Panel>
          )}
          {visible?.intent === "help" && examples.data && (
            <Panel title="Примеры вопросов">
              <div className="example-grid">
                {examples.data.slice(0, 8).map((question) => (
                  <button key={question} onClick={() => ask(question)}>
                    {question}
                    <span>↗</span>
                  </button>
                ))}
              </div>
            </Panel>
          )}
          {send.isPending && (
            <Loading label="Помощник готовит ответ… Обычно это занимает около 1,5 секунды." />
          )}
          {send.isError && (
            <Failure
              error={send.error}
              retry={() => input.trim() && ask(input)}
            />
          )}
          <form
            className="chat-composer"
            onSubmit={(event) => {
              event.preventDefault();
              ask(input);
            }}
          >
            <Field label="Лимит бюджета для вопроса, ₽">
              <input
                type="number"
                min="0"
                placeholder="Не задан"
                value={limitInput}
                onChange={(event) => setLimitInput(event.target.value)}
              />
            </Field>
            <label className="visually-hidden" htmlFor="chat-question">
              Вопрос помощнику
            </label>
            <div className="composer-row">
              <textarea
                id="chat-question"
                rows={2}
                placeholder="Например: сколько масла нужно на три месяца?"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    ask(input);
                  }
                }}
              />
              <button
                className="button primary"
                type="submit"
                disabled={
                  !input.trim() ||
                  send.isPending ||
                  (limitInput.trim() !== "" && Number(limitInput) < 0)
                }
              >
                Отправить →
              </button>
            </div>
            <small>
              Ответ носит рекомендательный характер. Решение о закупке принимает
              управляющий.
            </small>
          </form>
        </div>
      </div>
    </>
  );
}
