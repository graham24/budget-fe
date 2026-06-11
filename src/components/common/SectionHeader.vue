<script setup>
defineProps({
  label: {
    type: String,
    default: "",
  },
  title: {
    type: String,
    default: "",
  },
  subtitle: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <div class="section-header">
    <div class="section-header__text">
      <div v-if="label" class="pill">{{ label }}</div>
      <div v-if="title" class="title">{{ title }}</div>
      <div v-if="subtitle" class="subtitle muted">{{ subtitle }}</div>
    </div>
    <div class="section-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.section-header__text {
  display: grid;
  gap: 4px;
}
.title {
  font-weight: 700;
}
.subtitle {
  font-size: 0.95rem;
}
.section-header__actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  min-width: 200px;
}
/* quiet uppercase eyebrow instead of a colored pill */
.pill {
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-weight: 700;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.muted {
  color: rgba(var(--v-theme-on-background), 0.65);
}

@media (max-width: 960px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .section-header__actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
