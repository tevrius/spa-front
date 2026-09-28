import { useQuery } from "@tanstack/react-query";
import { metaQueries } from "@/entities/meta";
import { StockPage } from "@/pages/stock";
import { AlertsPage } from "@/pages/alerts";

export function StockRoute() {
  const { data } = useQuery(metaQueries.all());
  return <StockPage categories={data?.categories ?? []} />;
}

export function AlertsRoute() {
  const { data } = useQuery(metaQueries.all());
  return <AlertsPage alertTypes={data?.alert_types ?? []} />;
}
