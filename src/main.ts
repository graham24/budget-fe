/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from "@/plugins";

// Components
import App from "./App.vue";

// Global styles
import "@/styles/tokens.css";
import "@/styles/global.css";

// Composables
import { createApp } from "vue";
import { createPinia } from "pinia";

// Google Sign-In
import vue3GoogleLogin from "vue3-google-login";

// Auth
import { useAuthStore } from "@/stores/auth";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(vue3GoogleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
});

// Restore the session before the router's first navigation runs so the
// auth guard (router/index.ts) sees the correct logged-in state.
useAuthStore(pinia).restore();

interface FormatDate {
  (date: string | number | Date): string;
}

interface FormatCurrency {
  (amount: number): string;
}

(app.config.globalProperties.formatDate = ((
  date: string | number | Date
): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  };
  return new Date(date).toLocaleDateString(undefined, options);
}) as FormatDate),
  (app.config.globalProperties.formatCurrency = ((amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }) as FormatCurrency),
  registerPlugins(app);

app.mount("#app");
