<script setup>
const props = defineProps({
  padding: {
    type: String,
    default: "20px 22px",
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
    <div
      class="surface-card__body"
      :style="{ padding }"
    >
      <slot />
    </div>
  </component>
</template>

<style scoped>
.surface-card {
  background: rgb(var(--v-theme-surface));
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--hairline);
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
