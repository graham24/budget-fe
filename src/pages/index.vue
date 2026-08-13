<template>
  <div class="landing">
    <header class="landing-nav">
      <div class="landing-nav__brand">
        <div class="brand-mark">
          <v-icon
            icon="mdi-wallet-outline"
            size="18"
            color="primary"
          />
        </div>
        <span class="landing-nav__name">Budget</span>
      </div>
      <v-btn
        variant="outlined"
        density="comfortable"
        @click="loginDialog = true"
      >
        Log in
      </v-btn>
    </header>

    <main>
      <section class="hero">
        <p class="pill">
          Household budgeting, simplified
        </p>
        <h1 class="hero__title">
          Track how your money moves
        </h1>
        <p class="hero__subtitle muted">
          One clear view of income, spending, and savings for your whole household —
          import transactions, catch overspending early, and see where every dollar goes.
        </p>
        <div class="hero__cta">
          <v-btn
            color="primary"
            size="large"
            @click="loginDialog = true"
          >
            Get started free
          </v-btn>
        </div>
      </section>

      <section class="features">
        <SurfaceCard
          v-for="feature in features"
          :key="feature.title"
          class="feature-card"
          tag="article"
        >
          <div class="feature-card__icon">
            <v-icon
              :icon="feature.icon"
              size="22"
              color="primary"
            />
          </div>
          <h3 class="feature-card__title">
            {{ feature.title }}
          </h3>
          <p class="feature-card__body muted">
            {{ feature.body }}
          </p>
        </SurfaceCard>
      </section>

      <section class="closing">
        <SurfaceCard
          tag="section"
          class="closing-card"
        >
          <h2 class="text-h5 font-weight-bold mb-2">
            Ready to see where your money goes?
          </h2>
          <p class="muted mb-4">
            Sign in with Google — no passwords, no setup fees.
          </p>
          <v-btn
            color="primary"
            size="large"
            @click="loginDialog = true"
          >
            Get started free
          </v-btn>
        </SurfaceCard>
      </section>
    </main>

    <footer class="landing-footer muted">
      <span>&copy; {{ year }} Budget</span>
    </footer>

    <v-dialog
      v-model="loginDialog"
      max-width="420"
    >
      <SurfaceCard
        tag="section"
        class="login-card"
      >
        <div class="text-center mb-6">
          <p class="pill">
            Welcome back
          </p>
          <h2 class="text-h5 font-weight-bold mb-2">
            Sign in to Budget
          </h2>
          <p class="muted">
            Use your Google account to sign in or create a new household.
          </p>
        </div>
        <v-alert
          v-if="loginError"
          type="error"
          density="compact"
          class="mb-3"
        >
          {{ loginError }}
        </v-alert>
        <div class="google-login-wrap">
          <GoogleLogin :callback="handleGoogleLogin" />
        </div>
      </SurfaceCard>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { GoogleLogin } from "vue3-google-login";
import { useAuthStore } from "@/stores/auth";
import SurfaceCard from "@/components/common/SurfaceCard.vue";

const router = useRouter();
const authStore = useAuthStore();

const loginDialog = ref(false);
const loginError = ref(null);
const year = computed(() => new Date().getFullYear());

const features = [
  {
    icon: "mdi-swap-horizontal",
    title: "Import transactions",
    body: "Pull in bank data or upload a CSV and let auto-categorization sort income, needs, and wants for you.",
  },
  {
    icon: "mdi-chart-line",
    title: "Three-month view",
    body: "See spending trends over a rolling window so you can catch changes before they become a problem.",
  },
  {
    icon: "mdi-target",
    title: "Budget targets",
    body: "Set per-category limits and track actuals against them, with overspend flags right on the table.",
  },
  {
    icon: "mdi-account-group-outline",
    title: "Built for households",
    body: "Invite your partner or roommates so everyone sees the same shared picture of your finances.",
  },
];

async function handleGoogleLogin(response) {
  loginError.value = null;
  try {
    await authStore.loginWithGoogle(response.credential);
    loginDialog.value = false;
    router.push("/dashboard");
  } catch (error) {
    loginError.value = error.response?.data?.message || "Login failed";
  }
}
</script>

<style scoped>
.landing {
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
}

.landing-nav {
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
.landing-nav__brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.landing-nav__name {
  font-weight: 800;
  letter-spacing: -0.01em;
  font-size: 1.05rem;
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

.hero {
  max-width: 720px;
  margin: 0 auto;
  padding: 96px 20px 56px;
  text-align: center;
}
.hero__title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 12px 0 16px;
}
.hero__subtitle {
  font-size: 1.05rem;
  max-width: 560px;
  margin: 0 auto;
}
.hero__cta {
  margin-top: 32px;
}

.features {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px 64px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--gap);
}
.feature-card {
  text-align: left;
}
.feature-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: rgba(var(--v-theme-primary), 0.12);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  margin-bottom: 12px;
}
.feature-card__title {
  font-weight: 700;
  margin-bottom: 6px;
}
.feature-card__body {
  font-size: 0.9rem;
}

.closing {
  max-width: 640px;
  margin: 0 auto;
  padding: 0 20px 96px;
}
.closing-card {
  text-align: center;
}

.landing-footer {
  text-align: center;
  padding: 20px;
  font-size: 0.85rem;
  border-top: 1px solid rgba(var(--v-theme-outline), 0.9);
}

.login-card {
  text-align: center;
}
.google-login-wrap {
  display: flex;
  justify-content: center;
}

@media (max-width: 960px) {
  .features {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 600px) {
  .landing-nav {
    padding: 0 12px;
  }
  .hero {
    padding: 64px 16px 40px;
  }
  .features {
    grid-template-columns: 1fr;
  }
}
</style>
