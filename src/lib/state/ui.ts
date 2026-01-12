import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type UiState = {
  resultsCollapsed: boolean;
  summaryCollapsed: boolean;
  toggleResults: () => void;
  toggleSummary: () => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      resultsCollapsed: false,
      summaryCollapsed: false,
      toggleResults: () =>
        set((state) => ({ resultsCollapsed: !state.resultsCollapsed })),
      toggleSummary: () =>
        set((state) => ({ summaryCollapsed: !state.summaryCollapsed })),
    }),
    {
      name: "ui-preferences",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        resultsCollapsed: state.resultsCollapsed,
        summaryCollapsed: state.summaryCollapsed,
      }),
    },
  ),
);
