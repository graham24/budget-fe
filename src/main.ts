import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { createPinia } from "pinia";
import router from "./router.ts";

const app = createApp(App);
app.use(createPinia());
app.use(router);

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
  app.mount("#app");
