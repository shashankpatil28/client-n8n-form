import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
export default defineConfig({
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
      // This will proxy any request starting with /api
      // to your n8n server.
      '/api': {
        target: 'https://n8n.taskchain.dev',
        // This is crucial for the target server to accept the request
        changeOrigin: true,
        // This removes the '/api' prefix when forwarding the request
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
