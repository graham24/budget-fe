import { defineStore } from "pinia";
import { getUsers } from "../api";
import type { User } from "../types";

export const useUserStore = defineStore("user", {
  state: () => ({
    users: [] as User[],
  }),
  actions: {
    async fetchUsers() {
      try {
        this.users = await getUsers();
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    },
  },
});
