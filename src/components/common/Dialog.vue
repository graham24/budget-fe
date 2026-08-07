<script>
import { computed, defineComponent } from "vue";
import { useDisplay } from "vuetify";

export default defineComponent({
  props: {
    modelValue: Boolean,
    title: String,
    maxWidth: {
      type: [String, Number],
      default: 600,
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const { xs } = useDisplay();

    const isOpen = computed({
      get: () => props.modelValue,
      set: (value) => emit("update:modelValue", value),
    });

    const closeDialog = () => {
      isOpen.value = false;
    };

    return {
      isOpen,
      closeDialog,
      xs,
    };
  },
});
</script>

<template>
  <v-dialog
    v-model="isOpen"
    :max-width="xs ? undefined : maxWidth"
    :fullscreen="xs"
    :transition="xs ? 'dialog-bottom-transition' : 'dialog-transition'"
  >
    <v-card>
      <v-card-title class="dialog-title">
        <span class="text-h5">{{ title }}</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Close dialog"
          @click="closeDialog"
        />
      </v-card-title>
      <v-card-text>
        <slot />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="primary"
          @click="closeDialog"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.dialog-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
