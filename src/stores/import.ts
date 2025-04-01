import { defineStore } from "pinia";
import { uploadTransactions } from "../api";

export const useImportStore = defineStore("import", {
  state: () => ({
    accountId: null as number | null,
    importFile: null,
    importedTransactions: null,
  }),
  actions: {
    async importTransactions() {
      try {
        if (this.accountId !== null) {
          if (this.importFile) {
            this.importedTransactions =
              (await uploadTransactions(this.accountId, this.importFile)) || null;
          } else {
            console.error("Import file is null. Cannot upload transactions.");
          }
        } else {
          console.error("Account ID is null. Cannot upload transactions.");
        }
      } catch (error) {
        console.error("Error importing transactions:", error);
      }
    },
  },
});
