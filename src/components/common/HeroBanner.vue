<script setup>
import SurfaceCard from "./SurfaceCard.vue";

const props = defineProps({
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
  <SurfaceCard class="hero-banner" padding="18px 22px">
    <div class="hero-banner__content">
      <div class="hero-banner__text">
        <div v-if="label" class="pill">{{ label }}</div>
        <div class="hero-banner__title">{{ title }}</div>
        <div v-if="subtitle" class="subtitle muted">
          {{ subtitle }}
        </div>
      </div>
      <div class="hero-banner__actions">
        <slot name="actions" />
      </div>
    </div>
  </SurfaceCard>
</template>

<style scoped>
.hero-banner {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-outline), 0.9);
}
.hero-banner__content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  width: 100%;
}
.hero-banner__text {
  display: grid;
  gap: 6px;
}
.hero-banner__title {
  font-size: 1.4rem;
  font-weight: 800;
}
.hero-banner__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
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
.subtitle {
  font-size: 0.95rem;
}

@media (max-width: 960px) {
  .hero-banner {
    padding: 14px 16px;
  }
  .hero-banner__content {
    flex-direction: column;
    align-items: flex-start;
  }
  .hero-banner__actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
