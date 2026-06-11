import { defineStore } from "pinia";
import { getUsers } from "../api";
import { useHouseholdStore } from "./household";
import type { User } from "../types";

export const useUserStore = defineStore("user", {
  state: () => ({
    users: { users: [] as User[] },
  }),
  actions: {
    async fetchUsers() {
      const householdStore = useHouseholdStore();
      const householdId = householdStore.household?.household?.id;
      if (!householdId) return;
      try {
        this.users = await getUsers(householdId);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    },
  },
});
