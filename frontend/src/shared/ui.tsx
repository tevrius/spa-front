import styles from "./ui.module.css";
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
    <section className={[styles["panel"], className].filter(Boolean).join(" ")}>
      {(title || eyebrow || action) && (
        <header className={styles["panel-heading"]}>
          <div>
            {eyebrow && <p className={styles["eyebrow"]}>{eyebrow}</p>}
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
    <div className={styles["page-heading"]}>
      <div>
        <p className={styles["eyebrow"]}>{eyebrow}</p>
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
    <span
      className={[styles["status"], styles[`status-${kind}`]]
        .filter(Boolean)
        .join(" ")}
    >
      {children ?? severityNames[kind] ?? kind}
    </span>
  );
}

export function Loading({ label = "Загружаем данные…" }: { label?: string }) {
  return (
    <div className={styles["state"]} role="status">
      <span className={styles["spinner"]} />
      {label}
    </div>
  );
}
export function Empty({
  children = "По выбранным параметрам данных нет.",
}: {
  children?: ReactNode;
}) {
  return (
    <div className={[styles["state"], styles["empty"]].join(" ")}>
      {children}
    </div>
  );
}
export function Failure({
  error,
  retry,
}: {
  error: Error | null;
  retry?: () => void;
}) {
  return (
    <div
      className={[styles["state"], styles["failure"]].join(" ")}
      role="alert"
    >
      <strong>Не удалось получить данные</strong>
      <span>{error?.message || "Проверьте соединение с API."}</span>
      {retry && (
        <button
          className={[styles["button"], styles["secondary"]].join(" ")}
          onClick={retry}
        >
          Повторить
        </button>
      )}
    </div>
  );
}

export function Warnings({ items }: { items: ApiWarning[] }) {
  if (!items.length) return null;
  return (
    <div className={styles["warnings"]}>
      {items.map((item, index) => (
        <div
          className={[styles["notice"], styles[`notice-${item.level}`]]
            .filter(Boolean)
            .join(" ")}
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
      className={styles["explanation"]}
    >
      <p className={styles["muted"]}>Период расчёта: {value.period}</p>
      <div className={styles["explanation-grid"]}>
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
    <div
      className={[styles["metric"], tone && styles[`metric-${tone}`]]
        .filter(Boolean)
        .join(" ")}
    >
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
    <label className={styles["field"]}>
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
    <div className={styles["table-scroll"]}>
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
