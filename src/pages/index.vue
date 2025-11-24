<script setup>
import { defineComponent } from "vue";
import { ref, computed } from "vue";
import { onMounted } from "vue";
import Transactions from "../components/Transactions.vue";
import ImportForm from "../components/ImportForm.vue";
import Dialog from "../components/common/Dialog.vue";
import NetIncome from "../components/NetIncome.vue";
import NetTrend from "../components/NetTrend.vue";
import SavingsRate from "../components/SavingsRate.vue";
import Categories from "../components/Categories.vue";
import HeroBanner from "../components/common/HeroBanner.vue";
import SurfaceCard from "../components/common/SurfaceCard.vue";
import SectionHeader from "../components/common/SectionHeader.vue";
import { useHouseholdStore } from "../stores/household";
import { useAccountStore } from "../stores/account";
import { useTransactionStore } from "../stores/transaction";
import { useUserStore } from "../stores/user";

const householdStore = useHouseholdStore();
const accountsStore = useAccountStore();
const transactionsStore = useTransactionStore();
const userStore = useUserStore();
const loading = ref(true);
const showDialog = ref(false);
const monthFormatter = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
});

onMounted(async () => {
  try {
    await Promise.all([
      householdStore.fetchHousehold(),
      accountsStore.fetchAccounts(),
      transactionsStore.fetchTransactions(),
      userStore.fetchUsers(),
    ]);
  } catch (error) {
    console.log(error);
  } finally {
    loading.value = false;
  }
});
defineOptions({
  components: {
    Transactions,
  },
});

const windowLabel = computed(() => {
  const today = new Date();
  const start = new Date(
    today.getFullYear(),
    today.getMonth() - (transactionsStore.monthsAgo + 3),
    1
  );
  const end = new Date(
    today.getFullYear(),
    today.getMonth() - transactionsStore.monthsAgo,
    0
  );
  return `${monthFormatter.format(start)} - ${monthFormatter.format(end)}`;
});

const focusMonthLabel = computed(() => {
  const today = new Date();
  const month = new Date(
    today.getFullYear(),
    today.getMonth() - (transactionsStore.monthsAgo + 1),
    1
  );
  return monthFormatter.format(month);
});
</script>

<template>
  <div id="home" class="page-shell">
    <v-container v-if="!loading" fluid>
      <HeroBanner
        class="mb-6"
        label="Last 3 months"
        :title="`${householdStore.household.household.name} overview`"
        :subtitle="`${windowLabel} · Focusing on ${focusMonthLabel}`"
      >
        <template #actions>
          <v-btn
            variant="text"
            color="primary"
            prepend-icon="mdi-chevron-left"
            @click="transactionsStore.monthsAgo += 1"
            >Previous</v-btn
          >
          <v-btn
            variant="text"
            color="primary"
            prepend-icon="mdi-chevron-right"
            @click="transactionsStore.monthsAgo -= 1"
            >Next</v-btn
          >
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-upload"
            @click="showDialog = true"
            >Import</v-btn
          >
          <Dialog v-model="showDialog" title="Import Transactions">
            <ImportForm />
          </Dialog>
        </template>
      </HeroBanner>

      <v-row dense>
        <v-col cols="12" md="4">
          <div class="stack gap-md">
            <SurfaceCard class="panel-card" padding="14px 16px">
              <SectionHeader label="Cash flow" title="Net Income" />
              <NetIncome />
            </SurfaceCard>
            <SurfaceCard padding="12px 14px">
              <SectionHeader label="Trend" title="Net income (3 months)" />
              <NetTrend />
            </SurfaceCard>
            <SurfaceCard padding="12px 14px">
              <SectionHeader label="Savings rate" title="Income saved" />
              <SavingsRate />
            </SurfaceCard>
          </div>
        </v-col>
        <v-col cols="12" md="8">
          <SurfaceCard class="panel-card" padding="14px 16px">
            <SectionHeader label="Categories" title="Spending mix" />
            <Categories />
          </SurfaceCard>
        </v-col>
      </v-row>

      <v-row dense class="mt-4">
        <v-col cols="12">
          <SurfaceCard class="panel-card" padding="14px 16px">
            <SectionHeader
              label="All activity"
              title="Transactions"
              subtitle="Search and update categories without leaving the table."
            />
            <Transactions />
          </SurfaceCard>
        </v-col>
      </v-row>
    </v-container>
    <v-container v-else>
      <SurfaceCard class="text-center">
        <h1 class="text-h5 mb-2">Loading your dashboard…</h1>
        <p class="muted">Fetching households, accounts, and recent activity.</p>
      </SurfaceCard>
    </v-container>
  </div>
</template>

<style>
#home {
  width: 100%;
}
.page-shell {
  position: relative;
}
.muted {
  color: rgba(var(--v-theme-on-background), 0.65);
}
.stack {
  display: flex;
  flex-direction: column;
}
.gap-md {
  gap: 12px;
}
</style>
