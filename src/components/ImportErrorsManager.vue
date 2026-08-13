<script setup>
import { onMounted, ref } from "vue";
import { useImportErrorStore } from "../stores/importError";

const errorStore = useImportErrorStore();
const dismissingId = ref(null);

onMounted(() => {
  errorStore.fetchErrors();
});

async function dismiss(error) {
  dismissingId.value = error.id;
  try {
    await errorStore.dismissError(error.id);
  } catch (error) {
    console.error("Error dismissing import error:", error);
  } finally {
    dismissingId.value = null;
  }
}
</script>

<template>
  <div class="import-errors-manager">
    <p class="text-caption muted mb-4">
      Connection issues reported by SimpleFin during the scheduled account
      sync (e.g. a bank needs re-authorization). Dismiss an entry once
      you've resolved it.
    </p>

    <v-list
      v-if="errorStore.errors.length"
      density="compact"
    >
      <v-list-item
        v-for="error in errorStore.errors"
        :key="error.id"
        class="error-item"
      >
        <template #prepend>
          <v-icon
            icon="mdi-alert-circle-outline"
            color="error"
            size="small"
          />
        </template>
        <v-list-item-title class="text-wrap">
          {{ error.message }}
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ new Date(error.created).toLocaleString() }}
        </v-list-item-subtitle>
        <template #append>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            :loading="dismissingId === error.id"
            @click="dismiss(error)"
          />
        </template>
      </v-list-item>
    </v-list>
    <p
      v-else-if="errorStore.loaded"
      class="text-center muted py-4"
    >
      No import errors. Everything's syncing cleanly.
    </p>
  </div>
</template>

<style scoped>
.error-item {
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
}
.error-item:last-child {
  border-bottom: none;
}
</style>
