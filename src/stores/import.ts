import { defineStore } from "pinia";
import { uploadTransactions } from "../api";
import { useTransactionStore } from "./transaction";

export const useImportStore = defineStore("import", {
  state: () => ({
    accountId: null as number | null,
    importFile: null,
    importedTransactions: null,
  }),
  actions: {
    async importTransactions() {
      if (this.accountId === null) {
        console.error("Account ID is null. Cannot upload transactions.");
        return;
      }
      if (!this.importFile) {
        console.error("Import file is null. Cannot upload transactions.");
        return;
      }

      try {
        const transactionStore = useTransactionStore();
        const result = await uploadTransactions(this.accountId, this.importFile);
        this.importFile = null;
        this.importedTransactions = result ?? null;
        await transactionStore.fetchTransactions(null, true);
        return this.importedTransactions;
      } catch (error) {
        console.error("Error importing transactions:", error);
        throw error;
      }
    },
  },
});
