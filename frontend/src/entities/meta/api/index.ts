import { queryOptions } from "@tanstack/react-query";
import { endpoints, http } from "@/shared/api";
import type { Meta } from "@/shared/types";

export const metaApi = {
  get: () => http.get<Meta>(endpoints.meta),
};

export const metaQueries = {
  all: () => queryOptions({ queryKey: ["meta"], queryFn: metaApi.get }),
};
