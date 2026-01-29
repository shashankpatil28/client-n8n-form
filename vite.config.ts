import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      }
    },
    server: {
      proxy: {
        // Proxy /api/n8n requests to the n8n webhook URL to avoid CORS issues in development
        // Configure VITE_N8N_API_BASE_URL in your .env file
        "/api/n8n": {
          target: env.VITE_N8N_API_BASE_URL || "https://your-n8n-instance.com/webhook",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/n8n/, ""),
          secure: false,
        },
      },
    },
  };
});
