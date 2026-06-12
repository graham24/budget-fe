<script setup>
import { useNetWorthStore } from "../stores/netWorth";
import SurfaceCard from "./common/SurfaceCard.vue";

const emit = defineEmits(["details"]);

const netWorthStore = useNetWorthStore();
</script>

<template>
  <SurfaceCard v-if="netWorthStore.items.length" padding="10px 16px">
    <div class="nw-bar">
      <span class="pill">Net worth</span>
      <span class="nw-bar__value">
        {{ formatCurrency(netWorthStore.netWorth) }}
      </span>
      <span class="nw-bar__breakdown muted">
        Assets {{ formatCurrency(netWorthStore.totalAssets) }} −
        Debts {{ formatCurrency(netWorthStore.totalDebts) }}
      </span>
      <v-spacer />
      <v-btn size="small" variant="text" color="primary" @click="emit('details')">
        Details
      </v-btn>
    </div>
  </SurfaceCard>
</template>

<style scoped>
.nw-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.nw-bar__value {
  font-size: 1.15rem;
  font-weight: 800;
}
.nw-bar__breakdown {
  font-size: 0.85rem;
}
.muted {
  color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>
