import { defineStore } from "pinia";
import { getHousehold } from "../api";
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
  },
});
