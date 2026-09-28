import { queryOptions } from "@tanstack/react-query";
import { endpoints, http, params } from "@/shared/api";
import type {
  PriceDynamics,
  Service,
  ServiceEconomics,
  Supplier,
} from "@/shared/types";

export type SimulationRequest = {
  service_id: string;
  price_changes: { sku: string; delta_pct: number }[];
};

export const economicsApi = {
  prices: (sku: string, supplier_id: string) =>
    http.get<PriceDynamics>(
      `${endpoints.prices}${params({ sku, supplier_id })}`,
    ),
  services: () => http.get<Service[]>(endpoints.services),
  suppliers: () => http.get<Supplier[]>(endpoints.suppliers),
  serviceCost: (id: string) =>
    http.get<ServiceEconomics>(endpoints.serviceCost(id)),
  simulate: (body: SimulationRequest) =>
    http.post<ServiceEconomics, SimulationRequest>(endpoints.simulate, body),
};

export const economicsQueries = {
  prices: (sku: string, supplier: string) =>
    queryOptions({
      queryKey: ["price-dynamics", sku, supplier],
      queryFn: () => economicsApi.prices(sku, supplier),
    }),
  services: () =>
    queryOptions({ queryKey: ["services"], queryFn: economicsApi.services }),
  suppliers: () =>
    queryOptions({ queryKey: ["suppliers"], queryFn: economicsApi.suppliers }),
  serviceCost: (id: string) =>
    queryOptions({
      queryKey: ["service-cost", id],
      queryFn: () => economicsApi.serviceCost(id),
    }),
};
