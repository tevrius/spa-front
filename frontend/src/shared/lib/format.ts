const numberFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 2,
});
const currencyFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const number = (value: number | null | undefined) =>
  value == null ? "—" : numberFormatter.format(value);
export const money = (value: number | null | undefined) =>
  value == null ? "—" : currencyFormatter.format(value);
export const percent = (value: number | null | undefined) =>
  value == null ? "—" : `${number(value)}%`;
export const date = (value: string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "—";
export const periodName = {
  month: "Месяц",
  quarter: "Квартал",
  half_year: "Полгода",
  year: "Год",
};
export const alertNames: Record<string, string> = {
  deficit_risk: "Риск дефицита",
  low_stock: "Низкий остаток",
  overstock: "Излишек",
  no_movement: "Нет движения",
  expiring_batch: "Истекает срок",
  consumption_spike: "Рост расхода",
  price_growth: "Рост цены",
};
export const severityNames: Record<string, string> = {
  critical: "Критично",
  warning: "Внимание",
  info: "Информация",
  high: "Высокий",
  normal: "Плановый",
  error: "Ошибка",
};
export const movementNames: Record<string, string> = {
  receipt: "Приход",
  consume: "Расход",
  writeoff: "Списание",
  return: "Возврат",
  correction: "Корректировка",
};
export function plural(value: number, one: string, few: string, many: string) {
  const category = new Intl.PluralRules("ru-RU").select(value);
  return `${number(value)} ${category === "one" ? one : category === "few" ? few : many}`;
}
