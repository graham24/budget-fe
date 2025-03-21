import { defineStore } from "pinia";
import { getHouseholds } from "../api";
import type { Household } from "../types";

export const useHouseholdStore = defineStore("household", {
  state: () => ({
    households: [] as Household[],
  }),
  actions: {
    async fetchHouseholds() {
      try {
        this.households = await getHouseholds();
      } catch (error) {
        console.error("Error fetching households:", error);
      }
    },
  },
});
