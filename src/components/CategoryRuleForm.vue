<script setup>
import { ref } from "vue";
import { useCategoryRuleStore } from "../stores/categoryRule";

const props = defineProps({
  initialMatchText: {
    type: String,
    default: "",
  },
  initialCategory: {
    type: String,
    default: "",
  },
  initialSubCategory: {
    type: String,
    default: "",
  },
  initialNeed: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["saved", "cancel"]);

const ruleStore = useCategoryRuleStore();
const matchText = ref(props.initialMatchText);
const category = ref(props.initialCategory);
const subCategory = ref(props.initialSubCategory);
const need = ref(props.initialNeed);
const saving = ref(false);
const error = ref(null);

async function save() {
  if (!matchText.value.trim() || !category.value.trim() || !subCategory.value.trim()) {
    error.value = "Match text, category, and sub-category are required";
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    await ruleStore.createRule({
      match_text: matchText.value.trim(),
      category: category.value.trim(),
      sub_category: subCategory.value.trim(),
      need: need.value,
    });
    emit("saved");
  } catch (err) {
    error.value = err.response?.data?.message || "Failed to save rule";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="rule-form">
    <v-text-field
      v-model="matchText"
      label="Match text"
      hint="Applied when a transaction description contains this text (case-insensitive)"
      persistent-hint
      density="compact"
      variant="outlined"
      class="mb-3"
    />
    <div class="d-flex ga-3 mb-3 rule-form__categories">
      <v-text-field
        v-model="category"
        label="Category"
        density="compact"
        variant="outlined"
        hide-details
      />
      <v-text-field
        v-model="subCategory"
        label="Sub-category"
        density="compact"
        variant="outlined"
        hide-details
      />
    </div>
    <v-checkbox
      v-model="need"
      label="Essential expense (need)"
      density="compact"
      hide-details
      class="mb-2"
    />
    <v-alert
      v-if="error"
      type="error"
      density="compact"
      class="mb-3"
    >
      {{ error }}
    </v-alert>
    <div class="d-flex justify-end ga-2">
      <v-btn
        variant="text"
        :disabled="saving"
        @click="emit('cancel')"
      >
        Cancel
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        :loading="saving"
        @click="save"
      >
        Save Rule
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 600px) {
  .rule-form__categories {
    flex-direction: column;
  }
}
</style>
