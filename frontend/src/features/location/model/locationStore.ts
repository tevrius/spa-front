import { useQuery } from "@tanstack/react-query";
import { create } from "zustand";
import { metaQueries } from "@/entities/meta";

type LocationState = {
  selectedCode: string;
  setSelectedCode: (code: string) => void;
};

export const useLocationStore = create<LocationState>((set) => ({
  selectedCode: "",
  setSelectedCode: (selectedCode) => set({ selectedCode }),
}));

export function useSelectedLocation() {
  const selectedCode = useLocationStore((state) => state.selectedCode);
  const { data } = useQuery(metaQueries.all());
  return selectedCode || data?.locations[0]?.code || "";
}
