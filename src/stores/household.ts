import { defineStore } from "pinia";
import { claimSimplefinToken, getHousehold, updateHousehold } from "../api";
import { useAuthStore } from "./auth";
import type { Household } from "../types";

export const useHouseholdStore = defineStore("household", {
  state: () => ({
    household: null as { household: Household } | null,
  }),
  actions: {
    async fetchHousehold() {
      const authStore = useAuthStore();
      const userId = authStore.user?.id;
      if (!userId) return;
      try {
        this.household = (await getHousehold(userId)) || null;
      } catch (error) {
        console.error("Error fetching household:", error);
      }
    },
    // Errors propagate so the form can show them (e.g. 409 duplicate name)
    async updateName(name: string) {
      const householdId = this.household?.household?.id;
      if (!householdId) return;
      const updated = await updateHousehold(householdId, name);
      this.household = { household: updated };
    },
    async claimSimplefin(setupToken: string) {
      const householdId = this.household?.household?.id;
      if (!householdId || !this.household) return;
      const flags = await claimSimplefinToken(householdId, setupToken);
      this.household = {
        household: { ...this.household.household, ...flags },
      };
    },
  },
});
