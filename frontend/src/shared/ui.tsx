import type { ReactNode } from "react";
import { date, severityNames } from "./format";
import type { ApiWarning, Explanation } from "./types";

export function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || eyebrow || action) && (
        <header className="panel-heading">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h2>{title}</h2>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

export function Status({
  kind,
  children,
}: {
  kind: string;
  children?: ReactNode;
}) {
  return (
    <span className={`status status-${kind}`}>
      {children ?? severityNames[kind] ?? kind}
    </span>
  );
}

export function Loading({ label = "Загружаем данные…" }: { label?: string }) {
  return (
    <div className="state" role="status">
      <span className="spinner" />
      {label}
    </div>
  );
}
export function Empty({
  children = "По выбранным параметрам данных нет.",
}: {
  children?: ReactNode;
}) {
  return <div className="state empty">{children}</div>;
}
export function Failure({
  error,
  retry,
}: {
  error: Error | null;
  retry?: () => void;
}) {
  return (
    <div className="state failure" role="alert">
      <strong>Не удалось получить данные</strong>
      <span>{error?.message || "Проверьте соединение с API."}</span>
      {retry && (
        <button className="button secondary" onClick={retry}>
          Повторить
        </button>
      )}
    </div>
  );
}

export function Warnings({ items }: { items: ApiWarning[] }) {
  if (!items.length) return null;
  return (
    <div className="warnings">
      {items.map((item, index) => (
        <div
          className={`notice notice-${item.level}`}
          key={`${item.message}-${index}`}
        >
          <strong>{severityNames[item.level]}</strong>
          <span>{item.message}</span>
        </div>
      ))}
    </div>
  );
}

export function ExplanationBlock({
  value,
}: {
  value: Explanation | null | undefined;
}) {
  if (!value) return null;
  return (
    <Panel
      title="Как получен результат"
      eyebrow={`Актуально на ${date(value.as_of)}`}
      className="explanation"
    >
      <p className="muted">Период расчёта: {value.period}</p>
      <div className="explanation-grid">
        <div>
          <h3>Исходные данные</h3>
          <ul>
            {value.data_used.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Формулы</h3>
          <ul>
            {value.formulas.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Допущения</h3>
          <ul>
            {value.assumptions.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}

export function Metric({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  tone?: string;
}) {
  return (
    <div className={`metric ${tone ? `metric-${tone}` : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
