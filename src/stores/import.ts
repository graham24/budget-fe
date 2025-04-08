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
      try {
        if (this.accountId !== null) {
          if (this.importFile) {
            this.importedTransactions =
              (await uploadTransactions(this.accountId, this.importFile).then(() => {
                this.importFile = null;
                const transactionStore = useTransactionStore();
                transactionStore.transactions.all_transactions.push(this.importedTransactions)
                return this.importedTransactions;
              })) || null;
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
