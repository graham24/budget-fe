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
      <div
        v-if="label"
        class="pill"
      >
        {{ label }}
      </div>
      <div
        v-if="title"
        class="title"
      >
        {{ title }}
      </div>
      <div
        v-if="subtitle"
        class="subtitle muted"
      >
        {{ subtitle }}
      </div>
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
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.section-header__text {
  display: grid;
  gap: 1px;
}
.title {
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
}
.subtitle {
  font-size: 13px;
  line-height: 1.45;
  margin-top: 2px;
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
  font-family: var(--font-sans);
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-weight: 700;
  font-size: 11px;
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
