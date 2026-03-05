import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward /analyze, /health, and /models to the FastAPI backend
      "/analyze": "http://localhost:8000",
      "/health": "http://localhost:8000",
      "/models": "http://localhost:8000",
    },
  },
});
