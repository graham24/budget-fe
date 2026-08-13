<script setup>
import { ref, shallowRef, watch } from "vue";
import { useTransactionStore } from "../stores/transaction";
import { useAccountStore } from "../stores/account";
import { useUserStore } from "../stores/user";
import SurfaceCard from "./common/SurfaceCard.vue";
import SectionHeader from "./common/SectionHeader.vue";
import TransactionReviewDialog from "./TransactionReviewDialog.vue";
import TransactionsTable from "./TransactionsTable.vue";
// import DayJsAdapter from '@date-io/dayjs'

defineProps({
  readOnly: {
    type: Boolean,
    default: false,
  },
});

const transactionStore = useTransactionStore();
const showDatePicker = ref(false);
const selectedDates = ref(null);
const searchTerm = ref(null);
const debouncedSearchTerm = ref(null);
const showReviewDialog = ref(false);
// Snapshot of the unknown queue taken when the dialog opens, so rows don't
// shift out from under the reviewer as they get categorized
const reviewList = ref([]);

function openReview() {
  reviewList.value = [...transactionStore.unknownTransactions];
  showReviewDialog.value = true;
}

// Export the active 3-month window as CSV
function exportCsv() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  start.setMonth(start.getMonth() - (transactionStore.monthsAgo + 3));
  const end = new Date();
  end.setDate(1);
  end.setHours(0, 0, 0, 0);
  end.setMonth(end.getMonth() - transactionStore.monthsAgo);

  const rows = transactionStore.transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= start && d < end;
  });

  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const header = "Date,Description,Category,Sub-Category,Amount,Need,Type,Account ID";
  const lines = rows.map((t) =>
    [
      new Date(t.date).toISOString().split("T")[0],
      escape(t.description),
      escape(t.category),
      escape(t.sub_category),
      t.amount,
      t.need,
      t.type,
      t.account_id,
    ].join(",")
  );

  const blob = new Blob([[header, ...lines].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `transactions-${start.toISOString().split("T")[0]}-to-${end.toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Debounce so the four tables only re-filter after typing pauses
let searchTimeout = null;
watch(searchTerm, (value) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    debouncedSearchTerm.value = value;
  }, 250);
});

function selectDates() {
  if (selectedDates.value.length > 1) {
    console.log(
      "Selected dates:",
      selectedDates.value[0],
      selectedDates.value[selectedDates.value.length - 1]
    );
    setTimeout(() => {
      showDatePicker.value = !showDatePicker.value;
    }, 500);
  }
}
</script>

<template>
  <div class="container">
    <div>
      <div>
        <div class="toolbar mb-3">
          <v-text-field
            v-model="searchTerm"
            label="Search transactions"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            hide-details
            single-line
            density="comfortable"
            class="search-input"
          />
          <v-menu
            v-model="showDatePicker"
            :close-on-content-click="false"
          >
            <template #activator="{ props: menuProps }">
              <v-btn
                icon="mdi-calendar-blank"
                variant="tonal"
                v-bind="menuProps"
              />
            </template>
            <v-date-picker
              v-model="selectedDates"
              multiple="range"
              @update:model-value="selectDates()"
            />
          </v-menu>
          <v-btn
            v-if="!readOnly && transactionStore.unknownTransactions.length"
            color="warning"
            variant="tonal"
            prepend-icon="mdi-eye-check"
            @click="openReview"
          >
            Review ({{ transactionStore.unknownTransactions.length }})
          </v-btn>
          <v-btn
            variant="tonal"
            prepend-icon="mdi-download"
            @click="exportCsv"
          >
            Export CSV
          </v-btn>
        </div>
        <TransactionsTable
          :type="'income'"
          :search-term="debouncedSearchTerm"
          :date-range="selectedDates"
          :read-only="readOnly"
        />
        <TransactionsTable
          :type="'expenses-need'"
          :search-term="debouncedSearchTerm"
          :date-range="selectedDates"
          :read-only="readOnly"
        />
        <TransactionsTable
          :type="'expenses-want'"
          :search-term="debouncedSearchTerm"
          :date-range="selectedDates"
          :read-only="readOnly"
        />
        <TransactionsTable
          :type="'transfers'"
          :search-term="debouncedSearchTerm"
          :date-range="selectedDates"
          :read-only="readOnly"
        />
        <TransactionReviewDialog
          v-if="!readOnly"
          v-model="showReviewDialog"
          :transactions="reviewList"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.search-input {
  min-width: 260px;
  flex: 1;
}
.container {
  position: relative;
}

@media (max-width: 960px) {
  .search-input {
    min-width: 100%;
  }
}
</style>
