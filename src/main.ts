/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from "@/plugins";

// Components
import App from "./App.vue";
import vue3GoogleLogin from "vue3-google-login";


// Composables
import { createApp } from "vue";
import { createPinia } from "pinia";

const app = createApp(App);
app.use(createPinia());
app.use(vue3GoogleLogin, {
  clientId: "YOUR_GOOGLE_CLIENT_ID",
});

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
