import { defineStore } from "pinia";
import { getHousehold } from "../api";
import type { Household } from "../types";

export const useHouseholdStore = defineStore("household", {
  state: () => ({
    household: null as Household | null,
  }),
  actions: {
    async fetchHousehold() {
      try {
        this.household = await getHousehold() || null;
      } catch (error) {
        console.error("Error fetching household:", error);
      }
    },
  },
});
