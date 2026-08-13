import "vuetify/styles";
import { createVuetify } from "vuetify";
import type { ThemeDefinition } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import "@mdi/font/css/materialdesignicons.css";


// Matches the marketing site's palette: one confident blue, slate-navy
// neutrals, deep (not neon) semantic colors.
const light: ThemeDefinition = {
  dark: false,
  colors: {
    background: "#f5f7fc",
    surface: "#ffffff",
    "surface-variant": "#eef1f8",
    primary: "#3860c9",
    "primary-darken-1": "#2c4da3",
    secondary: "#5b647a",
    success: "#1f8f61",
    error: "#d64545",
    info: "#3860c9",
    warning: "#b5791f",
    "on-background": "#10141d",
    "on-surface": "#10141d",
    outline: "#e2e6f0",
  },
};

const dark: ThemeDefinition = {
  dark: true,
  colors: {
    background: "#0b0e15",
    surface: "#151a25",
    "surface-variant": "#1b2130",
    primary: "#5b8def",
    "primary-darken-1": "#3f63c4",
    secondary: "#9aa5ba",
    success: "#5cc98f",
    error: "#ef5f5f",
    info: "#5b8def",
    warning: "#e8a94b",
    "on-background": "#eaeef6",
    "on-surface": "#eaeef6",
    outline: "#242c3c",
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
