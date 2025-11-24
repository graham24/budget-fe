import "vuetify/styles";
import { createVuetify } from "vuetify";
import type { ThemeDefinition } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import "@mdi/font/css/materialdesignicons.css";


const light: ThemeDefinition = {
  dark: false,
  colors: {
    background: "#f5f7fb",
    surface: "#ffffff",
    primary: "#2563eb",
    "primary-darken-1": "#1d4ed8",
    secondary: "#6b7280",
    success: "#10b981",
    error: "#ef4444",
    info: "#0ea5e9",
    warning: "#f59e0b",
    "on-background": "#0f172a",
    "on-surface": "#0f172a",
    outline: "#e2e8f0",
  },
};

const dark: ThemeDefinition = {
  dark: true,
  colors: {
    background: "#0b1224",
    surface: "#111827",
    primary: "#60a5fa",
    "primary-darken-1": "#3b82f6",
    secondary: "#9ca3af",
    success: "#34d399",
    error: "#fb7185",
    info: "#38bdf8",
    warning: "#f59e0b",
    "on-background": "#e5e7eb",
    "on-surface": "#e5e7eb",
    outline: "#1f2937",
  },
};

export default createVuetify({
  theme: {
    defaultTheme: (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark' : 'light',
    themes: { light, dark }
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi }
  },
})
