import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  // server: {
  //   host: "0.0.0.0", // Allows access from the local network
  //   port: 5173,
  // },
  // define: {
  //   __API_BASE_URL__: JSON.stringify("http://192.168.1.2:5000"), // Replace with your backend IP
  // },
});
