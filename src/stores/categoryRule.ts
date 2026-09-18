import { defineStore } from "pinia";
import {
  createCategoryRule,
  deleteCategoryRule,
  getCategoryRules,
} from "../api";
import { useHouseholdStore } from "./household";
import type { CategoryRule } from "../types";

export const useCategoryRuleStore = defineStore("categoryRule", {
  state: () => ({
    rules: [] as CategoryRule[],
    loaded: false,
  }),
  actions: {
    async fetchRules() {
      const householdStore = useHouseholdStore();
      const householdId = householdStore.household?.household?.id;
      if (!householdId) return;
      try {
        this.rules = await getCategoryRules(householdId);
        this.loaded = true;
      } catch (error) {
        console.error("Error fetching category rules:", error);
      }
    },
    // Errors propagate so callers can show them (e.g. 409 duplicate match text)
    async createRule(rule: {
      match_text: string;
      category: string;
      sub_category: string;
      need: boolean;
      income: boolean;
    }) {
      const householdStore = useHouseholdStore();
      const householdId = householdStore.household?.household?.id;
      if (!householdId) throw new Error("No household loaded");
      const created = await createCategoryRule({
        ...rule,
        household_id: householdId,
      });
      this.rules.unshift(created);
      return created;
    },
    async deleteRule(id: number) {
      await deleteCategoryRule(id);
      this.rules = this.rules.filter((rule) => rule.id !== id);
    },
  },
});
