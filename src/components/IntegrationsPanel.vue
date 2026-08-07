<script setup>
import AnthropicKeyPanel from "./AnthropicKeyPanel.vue";
import SimplefinPanel from "./SimplefinPanel.vue";

const emit = defineEmits(["open-simplefin-wizard"]);
</script>

<template>
  <div class="integrations-panel">
    <AnthropicKeyPanel />
    <div class="mt-6">
      <SimplefinPanel @open-simplefin-wizard="emit('open-simplefin-wizard')" />
    </div>
  </div>
</template>
