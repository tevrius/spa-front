import { queryOptions } from "@tanstack/react-query";
import { endpoints, http, params } from "@/shared/api";
import type {
  Budget,
  Forecast,
  Period,
  PurchasePlan,
  ReorderList,
} from "@/shared/types";

export type ForecastRequest = {
  sku: string;
  location: string;
  horizon_months: number;
  safety_stock_days: number;
  budget_limit: number | null;
};

export type PlanRequest = {
  period: Period;
  location: string;
  budget_limit: number | null;
};

export type BudgetRequest = {
  period: Period;
  location: string;
  limit: number | null;
  compare_with_previous: boolean;
};

export const procurementApi = {
  reorder: (location: string, horizon_days: number) =>
    http.get<ReorderList>(
      `${endpoints.reorder}${params({ location, horizon_days })}`,
    ),
  forecast: (body: ForecastRequest) =>
    http.post<Forecast, ForecastRequest>(endpoints.forecast, body),
  plan: (body: PlanRequest) =>
    http.post<PurchasePlan, PlanRequest>(endpoints.plan, body),
  budget: (body: BudgetRequest) =>
    http.post<Budget, BudgetRequest>(endpoints.budget, body),
};

export const procurementQueries = {
  reorder: (location: string, horizon: number) =>
    queryOptions({
      queryKey: ["reorder", location, horizon],
      queryFn: () => procurementApi.reorder(location, horizon),
    }),
  forecast: (body: ForecastRequest) =>
    queryOptions({
      queryKey: ["forecast", body],
      queryFn: () => procurementApi.forecast(body),
    }),
  plan: (body: PlanRequest) =>
    queryOptions({
      queryKey: ["plan", body],
      queryFn: () => procurementApi.plan(body),
    }),
  budget: (body: BudgetRequest) =>
    queryOptions({
      queryKey: ["budget", body],
      queryFn: () => procurementApi.budget(body),
    }),
};
