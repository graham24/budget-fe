<template>
  <v-app>
    <div v-if="!authStore.user" class="auth-landing">
      <SurfaceCard class="auth-card" tag="section">
        <div class="text-center mb-6">
          <p class="pill">Welcome back</p>
          <h1 class="text-h4 font-weight-bold mb-2">
            Track how your money moves
          </h1>
          <p class="muted">
            Stay on top of income and expenses with an easy three-month view.
            Sign in to start your overview.
          </p>
        </div>
        <div class="d-flex justify-center">
          <div>
            <p class="text-h6 text-center mb-4">Sign in with Google</p>
            <div
              id="g_id_onload"
              data-client_id="465424205396-qhqvcr1cpm5ilkor7kldpq41nhcn80jg.apps.googleusercontent.com"
              data-callback="handleCredentialResponse"
              data-auto_prompt="false"
            ></div>
            <div class="g_id_signin" data-type="standard"></div>
          </div>
        </div>
      </SurfaceCard>
    </div>
    <div v-else class="app-frame">
      <SurfaceCard class="app-header" tag="header" padding="14px 18px">
        <div class="d-flex align-center ga-3">
          <div class="brand-mark">
            <v-icon icon="mdi-account-circle" size="28" color="primary" />
          </div>
          <div>
            <div class="text-subtitle-1 font-weight-bold">Hello, {{ displayName }}</div>
            <div class="text-caption muted">
              Past 3 months at a glance
            </div>
          </div>
        </div>
        <div class="d-flex align-center ga-2 header-actions">
          <v-btn
            variant="tonal"
            density="comfortable"
            icon
            :aria-label="`Switch to ${isDark ? 'light' : 'dark'} mode`"
            @click="toggleTheme"
          >
            <v-icon :icon="isDark ? 'mdi-white-balance-sunny' : 'mdi-weather-night'" />
          </v-btn>
          <v-btn color="primary" variant="flat" @click="logout">Logout</v-btn>
        </div>
      </SurfaceCard>
      <v-main class="app-main">
        <router-view />
      </v-main>
    </div>
  </v-app>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useTheme } from "vuetify";
import SurfaceCard from "./components/common/SurfaceCard.vue";

const authStore = useAuthStore();
const theme = useTheme();
const themeName = ref(theme.global.name.value);
const displayName = computed(
  () => authStore.user?.first_name ?? "there"
);

onMounted(() => {
  const storedTheme = localStorage.getItem("preferred-theme");
  if (storedTheme) {
    themeName.value = storedTheme;
    theme.global.name.value = storedTheme;
  }

  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    authStore.verifyUser(JSON.parse(storedUser));
  } else {
    window.handleCredentialResponse = (response) => {
      const token = response.credential;
      const data = parseJwt(token);
      authStore.login(token, data);
    };
  }
});

function parseJwt(token) {
  return JSON.parse(atob(token.split(".")[1]));
}

function logout() {
  authStore.logout();
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
.auth-landing {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 14px;
}

.auth-card {
  text-align: center;
  max-width: 720px;
  width: 100%;
}

.app-frame {
  min-height: 100vh;
  padding: 18px;
  background: radial-gradient(circle at 10% 20%, rgba(96, 165, 250, 0.15), transparent 28%),
    radial-gradient(circle at 85% 10%, rgba(16, 185, 129, 0.15), transparent 25%),
    rgb(var(--v-theme-background));
}

.app-header {
  display: flex;
  padding: 14px 18px;
  margin-bottom: 16px;
}
.app-header :deep(.surface-card__body) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.brand-mark {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(var(--v-theme-primary), 0.12);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.app-main {
  padding: 8px;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.01em;
}
.muted {
  color: rgba(var(--v-theme-on-background), 0.65);
}

@media (max-width: 960px) {
  .app-frame {
    padding: 12px;
  }
  .app-header :deep(.surface-card__body) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .app-main {
    padding: 0;
  }
  .header-actions {
    align-self: flex-end;
  }
}
</style>
