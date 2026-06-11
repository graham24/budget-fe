import "vuetify/styles";
import { createVuetify } from "vuetify";
import type { ThemeDefinition } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import "@mdi/font/css/materialdesignicons.css";


// Restrained, finance-grade palette: one confident blue, slate neutrals,
// deep (not neon) semantic colors.
const light: ThemeDefinition = {
  dark: false,
  colors: {
    background: "#f7f8fa",
    surface: "#ffffff",
    "surface-variant": "#f1f3f5",
    primary: "#1d4ed8",
    "primary-darken-1": "#1e40af",
    secondary: "#475569",
    success: "#047857",
    error: "#b91c1c",
    info: "#0369a1",
    warning: "#b45309",
    "on-background": "#0f172a",
    "on-surface": "#0f172a",
    outline: "#e2e8f0",
  },
};

const dark: ThemeDefinition = {
  dark: true,
  colors: {
    background: "#0d1117",
    surface: "#161b22",
    "surface-variant": "#1f242d",
    primary: "#6395ec",
    "primary-darken-1": "#3b82f6",
    secondary: "#8b98a9",
    success: "#3fb27f",
    error: "#e5575f",
    info: "#58a6ff",
    warning: "#d29a43",
    "on-background": "#e6e9ee",
    "on-surface": "#e6e9ee",
    outline: "#2a313c",
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
