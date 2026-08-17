// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Bolt sandbox detection — the lovable config checks for this env var to enable
// sandbox mode (forces port 8080, enables dev-server-bridge for preview). Set it
// here so it's present before the config plugin evaluates.
process.env.LOVABLE_SANDBOX = process.env.LOVABLE_SANDBOX ?? "1";

export default defineConfig({
  // Explicitly bind the dev server to 0.0.0.0:8080 so Bolt can detect and proxy it.
  vite: {
    server: {
      host: "0.0.0.0",
      port: 8080,
      strictPort: true,
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
