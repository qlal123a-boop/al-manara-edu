import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

// Native Bolt config — replaces the Lovable sandbox wrapper.
// The Lovable config forced port 8080 and injected editor-only plugins
// (dev-server-bridge, hmr-gate, assets-proxy) that interfered with Bolt's
// preview proxy. This loads only the standard plugins the app needs.
//
// Plugin order matters: tanstackStart (which registers the router plugin)
// MUST come before the React JSX transform plugin.
export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    }),
    react(),
  ],
  resolve: {
    tsconfigPaths: true,
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
    ignoreOutdatedRequests: true,
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
  },
  define: (() => {
    const loadedEnv = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "VITE_");
    const envDefine: Record<string, string> = {};
    for (const [key, value] of Object.entries(loadedEnv)) {
      envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
    }
    return envDefine;
  })(),
});
