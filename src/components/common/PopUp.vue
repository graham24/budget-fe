<script setup>
import { ref } from "vue";

const isVisible = ref(false);
const props = defineProps({
  buttonText: {
    type: String,
    default: "Open",
  },
  component: {
    type: Object,
    required: true,
  },
});

function close() {
  isVisible.value = false;
}
</script>

<template>
  <div>
    <div>
      <button @click="isVisible = true">{{ buttonText }}</button>
    </div>
    <div v-if="isVisible" class="modal-overlay">
      <div class="modal">
        <div class="close-button" @click="close()">x</div>
        <slot name="form">
          <component :is="component" />
        </slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background-color: black;
  padding: 20px;
  border-radius: 10px;
  border: 2px solid white;
  width: 50%;
  max-width: 600px;
  position: relative;
}
.close-button {
  position: absolute;
  text-align: right;
  /* border: 2px solid white; */
  border-radius: 5px;
  top: 0;
  right: 0;
  margin: 10px;
  cursor: pointer;
  /* padding: 2px; */
}
</style>
