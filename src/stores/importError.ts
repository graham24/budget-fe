import { defineStore } from "pinia";
import { deleteImportError, getImportErrors } from "../api";
import { useHouseholdStore } from "./household";
import type { ImportError } from "../types";

export const useImportErrorStore = defineStore("importError", {
  state: () => ({
    errors: [] as ImportError[],
    loaded: false,
  }),
  actions: {
    async fetchErrors() {
      const householdStore = useHouseholdStore();
      const householdId = householdStore.household?.household?.id;
      if (!householdId) return;
      try {
        this.errors = await getImportErrors(householdId);
        this.loaded = true;
      } catch (error) {
        console.error("Error fetching import errors:", error);
      }
    },
    async dismissError(id: number) {
      await deleteImportError(id);
      this.errors = this.errors.filter((error) => error.id !== id);
    },
  },
});
