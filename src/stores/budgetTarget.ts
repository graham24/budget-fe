import { defineStore } from "pinia";
import {
  deleteBudgetTarget,
  getBudgetTargets,
  saveBudgetTarget,
} from "../api";
import { useHouseholdStore } from "./household";
import type { BudgetTarget } from "../types";

export const useBudgetTargetStore = defineStore("budgetTarget", {
  state: () => ({
    targets: [] as BudgetTarget[],
    loaded: false,
  }),
  actions: {
    async fetchTargets() {
      const householdStore = useHouseholdStore();
      const householdId = householdStore.household?.household?.id;
      if (!householdId) return;
      try {
        this.targets = await getBudgetTargets(householdId);
        this.loaded = true;
      } catch (error) {
        console.error("Error fetching budget targets:", error);
      }
    },
    async saveTarget(category: string, monthly_limit: number) {
      const householdStore = useHouseholdStore();
      const householdId = householdStore.household?.household?.id;
      if (!householdId) throw new Error("No household loaded");
      const saved = await saveBudgetTarget({
        household_id: householdId,
        category,
        monthly_limit,
      });
      const idx = this.targets.findIndex((t) => t.id === saved.id);
      if (idx !== -1) this.targets[idx] = saved;
      else this.targets.push(saved);
      return saved;
    },
    async deleteTarget(id: number) {
      await deleteBudgetTarget(id);
      this.targets = this.targets.filter((t) => t.id !== id);
    },
  },
});
