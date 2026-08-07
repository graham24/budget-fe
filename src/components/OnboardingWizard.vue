<script setup>
import { ref, computed } from "vue";
import { useHouseholdStore } from "../stores/household";
import { useUserStore } from "../stores/user";
import { useAccountStore } from "../stores/account";
import AccountForm from "./AccountForm.vue";
import AnthropicKeyPanel from "./AnthropicKeyPanel.vue";
import SimplefinPanel from "./SimplefinPanel.vue";
import SimplefinWizard from "./SimplefinWizard.vue";

const emit = defineEmits(["done"]);

const householdStore = useHouseholdStore();
const userStore = useUserStore();
const accountStore = useAccountStore();

const STEPS = ["Household", "Members", "SimpleFin", "AI categorization", "Accounts"];
const step = ref(0);
const mappingAccounts = ref(false);

const householdId = computed(() => householdStore.household?.household?.id);

const name = ref(householdStore.household?.household?.name ?? "");
const savingName = ref(false);
const nameError = ref(null);

async function continueFromName() {
  if (!name.value.trim()) {
    nameError.value = "Household name is required";
    return;
  }
  savingName.value = true;
  nameError.value = null;
  try {
    await householdStore.updateName(name.value.trim());
    step.value = 1;
  } catch (err) {
    nameError.value = err.response?.data?.message || "Failed to save household";
  } finally {
    savingName.value = false;
  }
}

const memberEmail = ref("");
const adding = ref(false);
const memberError = ref(null);

async function addMember() {
  if (!memberEmail.value.trim()) return;
  adding.value = true;
  memberError.value = null;
  try {
    await userStore.addMember(memberEmail.value.trim());
    memberEmail.value = "";
  } catch (err) {
    memberError.value = err.response?.data?.message || "Failed to add member";
  } finally {
    adding.value = false;
  }
}

function memberName(user) {
  const full = `${user.first_name} ${user.last_name}`.trim();
  return full || user.email;
}

function openMapping() {
  mappingAccounts.value = true;
}

// Once accounts are mapped, move straight on to the AI-key step rather
// than dropping back onto the SimpleFin redeem screen.
function finishMapping() {
  mappingAccounts.value = false;
  step.value = 3;
}

function finish() {
  emit("done");
}
</script>

<template>
  <div class="onboarding-wizard">
    <div v-if="mappingAccounts">
      <SimplefinWizard
        v-if="householdId"
        :household-id="householdId"
        @done="finishMapping"
      />
    </div>
    <div v-else>
      <div class="stack-header">
        <div class="text-subtitle-1 font-weight-bold">
          Welcome — let's set up your household
        </div>
        <div class="counter muted">
          {{ step + 1 }} / {{ STEPS.length }}
        </div>
      </div>
      <div class="muted text-caption mb-4">
        {{ STEPS[step] }}
      </div>

      <div v-if="step === 0">
        <p
          class="muted mb-3"
          style="font-size: 0.9rem"
        >
          This is the name your household goes by — you can change it anytime
          in Settings.
        </p>
        <v-text-field
          v-model="name"
          label="Household name"
          density="compact"
          variant="outlined"
          hide-details
          @keyup.enter="continueFromName"
        />
        <v-alert
          v-if="nameError"
          type="error"
          density="compact"
          class="mt-3"
        >
          {{ nameError }}
        </v-alert>
        <div class="d-flex justify-end mt-4">
          <v-btn
            color="primary"
            variant="flat"
            :loading="savingName"
            @click="continueFromName"
          >
            Continue
          </v-btn>
        </div>
      </div>

      <div v-else-if="step === 1">
        <p
          class="muted mb-3"
          style="font-size: 0.9rem"
        >
          Invite anyone else who shares this budget — optional, you can add
          people later from Settings.
        </p>
        <v-list
          v-if="userStore.users.users.length"
          density="compact"
          class="mb-3"
        >
          <v-list-item
            v-for="user in userStore.users.users"
            :key="user.id"
            :title="memberName(user)"
            :subtitle="user.first_name ? user.email : undefined"
          >
            <template #append>
              <span
                v-if="!user.first_name"
                class="pill"
              >Invited</span>
            </template>
          </v-list-item>
        </v-list>
        <div class="d-flex ga-2">
          <v-text-field
            v-model="memberEmail"
            label="Add member by email"
            type="email"
            density="compact"
            variant="outlined"
            hide-details
            @keyup.enter="addMember"
          />
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-account-plus-outline"
            :loading="adding"
            :disabled="!memberEmail.trim()"
            @click="addMember"
          >
            Add
          </v-btn>
        </div>
        <v-alert
          v-if="memberError"
          type="error"
          density="compact"
          class="mt-3"
        >
          {{ memberError }}
        </v-alert>
        <div class="d-flex justify-space-between mt-4">
          <v-btn
            variant="text"
            @click="step = 0"
          >
            Back
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="step = 2"
          >
            Continue
          </v-btn>
        </div>
      </div>

      <div v-else-if="step === 2">
        <p
          class="muted mb-3"
          style="font-size: 0.9rem"
        >
          Connect SimpleFin to pull in your real bank accounts and keep
          transactions synced automatically — you'll be walked through
          matching each one to an account here. Optional; skip to add
          accounts by hand instead.
        </p>
        <SimplefinPanel @open-simplefin-wizard="openMapping" />
        <div class="d-flex justify-space-between mt-4">
          <v-btn
            variant="text"
            @click="step = 1"
          >
            Back
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="step = 3"
          >
            {{ accountStore.accounts.accounts.length ? "Continue" : "Skip" }}
          </v-btn>
        </div>
      </div>

      <div v-else-if="step === 3">
        <p
          class="muted mb-3"
          style="font-size: 0.9rem"
        >
          Add an Anthropic API key to auto-categorize imported transactions
          and generate budget analysis. Optional — you can add it later from
          Settings.
        </p>
        <AnthropicKeyPanel />
        <div class="d-flex justify-space-between mt-4">
          <v-btn
            variant="text"
            @click="step = 2"
          >
            Back
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="step = 4"
          >
            Continue
          </v-btn>
        </div>
      </div>

      <div v-else-if="step === 4">
        <p
          class="muted mb-3"
          style="font-size: 0.9rem"
        >
          Add at least one account to track — imported transactions and
          manual entries both need to belong to one.
        </p>
        <v-table
          v-if="accountStore.accounts.accounts.length"
          density="compact"
          class="mb-4"
        >
          <tbody>
            <tr
              v-for="account in accountStore.accounts.accounts"
              :key="account.id"
            >
              <td class="font-weight-medium">
                {{ account.description }}
              </td>
              <td>{{ account.type }}</td>
              <td>{{ account.bank }}</td>
            </tr>
          </tbody>
        </v-table>
        <AccountForm :key="accountStore.accounts.accounts.length" />
        <div class="d-flex justify-space-between mt-4">
          <v-btn
            variant="text"
            @click="step = 3"
          >
            Back
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :disabled="!accountStore.accounts.accounts.length"
            @click="finish"
          >
            Finish
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stack-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}
.counter {
  font-weight: 700;
  white-space: nowrap;
}
.muted {
  color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>
