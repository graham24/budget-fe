<script setup>
import { ref, shallowRef } from "vue";
import { useTransactionStore } from "../stores/transaction";
import { useAccountStore } from "../stores/account";
import { useUserStore } from "../stores/user";
import SurfaceCard from "./common/SurfaceCard.vue";
import SectionHeader from "./common/SectionHeader.vue";
import TransactionReviewDialog from "./TransactionReviewDialog.vue";
import TransactionsTable from "./TransactionsTable.vue";
// import DayJsAdapter from '@date-io/dayjs'

// const search = ref("");
// const transactionStore = useTransactionStore();
// const userStore = useUserStore();
const showDatePicker = ref(false);
const selectedDates = ref(null);
const searchTerm = ref(null);
const showReviewDialog = ref(false);

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
    <div class="position-relative">
      <div>
        <v-icon
          class="position-absolute right-0 top-0"
          style="z-index: 2"
          @click="showDatePicker = !showDatePicker"
          >mdi-calendar-blank</v-icon
        >
        <v-date-picker
          v-if="showDatePicker"
          v-model="selectedDates"
          v-on:update:model-value="selectDates()"
          multiple="range"
          class="position-absolute top-0 right-0"
          style="z-index: 1"
        ></v-date-picker>
        <!-- <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-eye-check"
          @click="showReviewDialog = true"
        >
          Review
        </v-btn> -->
        <v-text-field
          v-model="searchTerm"
          label="Search transactions"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          hide-details
          single-line
          density="comfortable"
          class="search-input"
        ></v-text-field>
        <TransactionsTable
          :type="'income'"
          :searchTerm="searchTerm"
          :dateRange="selectedDates"
        />
         <TransactionsTable
          :type="'expenses-need'"
          :searchTerm="searchTerm"
          :dateRange="selectedDates"
        />
         <TransactionsTable
          :type="'expenses-want'"
          :searchTerm="searchTerm"
          :dateRange="selectedDates"
        />
         <TransactionsTable
          :type="'transfers'"
          :searchTerm="searchTerm"
          :dateRange="selectedDates"
        />
        <!-- <TransactionReviewDialog
      v-model="showReviewDialog"
      :transactions="transactionStore.transactions.all_transactions"
    /> -->
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-input {
  min-width: 260px;
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
