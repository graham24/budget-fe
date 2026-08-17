<template>
  <v-app>
    <router-view v-if="!authStore.user || authStore.previewing" />
    <div
      v-else
      class="app-frame"
    >
      <header class="top-bar">
        <div class="top-bar__brand">
          <div class="brand-mark">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgb(var(--v-theme-primary))"
              stroke-width="2.6"
              stroke-linecap="round"
            ><path d="M4 18h4M4 12h9M4 6h13" /></svg>
          </div>
          <span class="top-bar__name">Debrief</span>
        </div>
        <div class="top-bar__actions">
          <v-btn
            variant="text"
            density="comfortable"
            icon
            aria-label="Import errors"
            @click="importErrorsDialog = true"
          >
            <v-badge
              :model-value="importErrorStore.errors.length > 0"
              :content="importErrorStore.errors.length"
              color="error"
              floating
            >
              <v-icon icon="mdi-bell-outline" />
            </v-badge>
          </v-btn>
          <v-btn
            variant="text"
            density="comfortable"
            icon
            :aria-label="`Switch to ${isDark ? 'light' : 'dark'} mode`"
            @click="toggleTheme"
          >
            <v-icon :icon="isDark ? 'mdi-white-balance-sunny' : 'mdi-weather-night'" />
          </v-btn>
          <v-menu>
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                variant="text"
                density="comfortable"
                icon
                aria-label="Settings"
              >
                <v-icon icon="mdi-cog-outline" />
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item
                prepend-icon="mdi-account-outline"
                title="Profile"
                @click="profileDialog = true"
              />
              <v-list-item
                prepend-icon="mdi-home-outline"
                title="Household"
                @click="householdDialog = true"
              />
              <v-list-item
                prepend-icon="mdi-bank-outline"
                title="Accounts"
                @click="accountsDialog = true"
              />
              <v-list-item
                prepend-icon="mdi-credit-card-outline"
                title="Billing"
                @click="billingDialog = true"
              />
            </v-list>
          </v-menu>
          <span class="top-bar__user muted">{{ displayName }}</span>
          <v-btn
            variant="outlined"
            density="comfortable"
            @click="logout"
          >
            Log out
          </v-btn>
        </div>
      </header>
      <v-main class="app-main">
        <router-view />
      </v-main>
      <Dialog
        v-model="profileDialog"
        title="Profile"
      >
        <ProfileForm
          :prompt="namePrompt"
          @saved="closeProfileDialog"
          @cancel="closeProfileDialog"
        />
      </Dialog>
      <Dialog
        v-model="householdDialog"
        title="Household"
      >
        <HouseholdForm
          @saved="householdDialog = false"
          @open-simplefin-wizard="openSimplefinWizard"
        />
      </Dialog>
      <Dialog
        v-model="accountsDialog"
        title="Accounts"
        max-width="760"
      >
        <AccountsManager />
      </Dialog>
      <Dialog
        v-model="simplefinWizardDialog"
        title="Connect SimpleFin Accounts"
        max-width="760"
      >
        <SimplefinWizard
          v-if="householdStore.household?.household?.id"
          :household-id="householdStore.household.household.id"
          @done="simplefinWizardDialog = false"
        />
      </Dialog>
      <Dialog
        v-model="importErrorsDialog"
        title="Import Errors"
        max-width="600"
      >
        <ImportErrorsManager />
      </Dialog>
      <Dialog
        v-model="billingDialog"
        title="Billing"
        max-width="420"
      >
        <BillingSettings />
      </Dialog>
    </div>
  </v-app>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useHouseholdStore } from "@/stores/household";
import { useAccountStore } from "@/stores/account";
import { useUserStore } from "@/stores/user";
import { useTransactionStore } from "@/stores/transaction";
import { useSimplefinStore } from "@/stores/simplefin";
import { useImportErrorStore } from "@/stores/importError";
import { useTheme } from "vuetify";
import Dialog from "./components/common/Dialog.vue";
import ProfileForm from "./components/ProfileForm.vue";
import HouseholdForm from "./components/HouseholdForm.vue";
import AccountsManager from "./components/AccountsManager.vue";
import SimplefinWizard from "./components/SimplefinWizard.vue";
import ImportErrorsManager from "./components/ImportErrorsManager.vue";
import BillingSettings from "./components/BillingSettings.vue";

const router = useRouter();
const authStore = useAuthStore();
const householdStore = useHouseholdStore();
const accountStore = useAccountStore();
const userStore = useUserStore();
const transactionStore = useTransactionStore();
const simplefinStore = useSimplefinStore();
const importErrorStore = useImportErrorStore();
const theme = useTheme();
const themeName = ref(theme.global.name.value);
const profileDialog = ref(false);
const householdDialog = ref(false);
const accountsDialog = ref(false);
const simplefinWizardDialog = ref(false);
const importErrorsDialog = ref(false);
const billingDialog = ref(false);
const namePrompt = ref(false);

function openSimplefinWizard() {
  householdDialog.value = false;
  simplefinWizardDialog.value = true;
}
const displayName = computed(
  () => authStore.user?.first_name ?? "there"
);

onMounted(() => {
  const storedTheme = localStorage.getItem("preferred-theme");
  if (storedTheme) {
    themeName.value = storedTheme;
    theme.global.name.value = storedTheme;
  }
});

function closeProfileDialog() {
  profileDialog.value = false;
  namePrompt.value = false;
}

// Placeholder users (added to a household by email) have no name yet —
// prompt for it on first login
watch(
  () => authStore.user,
  (user) => {
    if (user && !user.first_name) {
      namePrompt.value = true;
      profileDialog.value = true;
    }
  },
  { immediate: true }
);

watch(
  () => householdStore.household?.household?.id,
  (householdId) => {
    if (householdId) importErrorStore.fetchErrors();
  },
  { immediate: true }
);

function logout() {
  authStore.logout();
  // Clear per-user data so a different login doesn't see stale state
  householdStore.$reset();
  accountStore.$reset();
  userStore.$reset();
  transactionStore.$reset();
  simplefinStore.$reset();
  importErrorStore.$reset();
  router.push("/");
}

const isDark = computed(() => theme.global.current.value.dark);

function toggleTheme() {
  themeName.value = isDark.value ? "light" : "dark";
}

watch(themeName, (val) => {
  theme.global.name.value = val;
  localStorage.setItem("preferred-theme", val);
});
</script>

<style scoped>
.app-frame {
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
}

/* Slim product-style top bar: brand left, session controls right */
.top-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 20px;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.9);
}
.top-bar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.top-bar__name {
  font-weight: 800;
  letter-spacing: -0.01em;
  font-size: 1.05rem;
}
.top-bar__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.top-bar__user {
  font-size: 0.875rem;
  font-weight: 600;
}

.brand-mark {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: rgba(var(--v-theme-primary), 0.12);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.app-main {
  padding: 4px 8px 16px;
}

@media (max-width: 600px) {
  .top-bar {
    padding: 0 12px;
  }
  .top-bar__user {
    display: none;
  }
  .app-main {
    padding: 0 0 12px;
  }
}
</style>
