<script>
import { ref, watch, computed, defineComponent } from "vue";

export default defineComponent({
  props: {
    modelValue: Boolean,
    title: String,
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const isOpen = computed({
      get: () => props.modelValue,
      set: (value) => emit("update:modelValue", value),
    });

    watch(
      () => props.modelValue,
      (newValue) => {
        isOpen.value = newValue;
      }
    );

    const closeDialog = () => {
      isOpen.value = false;
      emit("update:modelValue", false);
    };

    return {
      isOpen,
      closeDialog,
    };
  },
});
</script>

<template>
  <v-dialog v-model="isOpen" max-width="600px">
    <v-card>
      <v-card-title>
        <span class="text-h5">{{ title }}</span>
      </v-card-title>
      <v-card-text>
        <slot></slot>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="closeDialog">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
