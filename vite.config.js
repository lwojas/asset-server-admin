import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_ASSET_SERVER_URL || "http://localhost:3002";

  return {
    plugins: [react()],
    server: {
      // The asset server does not send CORS headers (see docs/README.md /
      // project notes), so browser fetches to a different origin are
      // blocked. Proxying same-origin during `vite dev` sidesteps that for
      // local development; production still talks to VITE_ASSET_SERVER_URL
      // directly and requires the asset server (or a reverse proxy in
      // front of it) to allow cross-origin requests.
      proxy: {
        "/projects": { target, changeOrigin: true },
        "/health": { target, changeOrigin: true },
      },
    },
  };
});
