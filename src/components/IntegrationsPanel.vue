<script setup>
import SimplefinPanel from "./SimplefinPanel.vue";

const emit = defineEmits(["open-simplefin-wizard"]);
</script>

<template>
  <div class="integrations-panel">
    <SimplefinPanel @open-simplefin-wizard="emit('open-simplefin-wizard')" />
  </div>
</template>
