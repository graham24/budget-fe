<script setup>
const props = defineProps({
  padding: {
    type: String,
    default: "16px",
  },
  border: {
    type: Boolean,
    default: true,
  },
  tag: {
    type: String,
    default: "div",
  },
});
</script>

<template>
  <component
    :is="tag"
    class="surface-card"
    :class="[{ 'surface-card--borderless': !border }]"
  >
    <div class="surface-card__body" :style="{ padding }">
      <slot />
    </div>
  </component>
</template>

<style scoped>
.surface-card {
  background: rgba(var(--v-theme-surface), 0.95);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  border: 1px solid rgba(var(--v-theme-outline), 0.3);
  backdrop-filter: blur(10px);
}
.surface-card--borderless {
  border-color: transparent;
}
.surface-card__body {
  width: 100%;
}

@media (max-width: 960px) {
  .surface-card {
    border-radius: var(--radius-sm);
  }
}
</style>
