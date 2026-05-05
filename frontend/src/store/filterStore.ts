import { create } from "zustand";
import type { LeaveCategory } from "../types";

interface FilterState {
  year: number;
  category: LeaveCategory | "all";
  setYear: (year: number) => void;
  setCategory: (category: LeaveCategory | "all") => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  year: new Date().getFullYear(),
  category: "all",
  setYear: (year) => set({ year }),
  setCategory: (category) => set({ category }),
}));
