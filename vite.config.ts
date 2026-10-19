import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  // Empty prefix loads every variable, including ones without VITE_. They stay in this Node process
  // and are never bundled, so the API key never reaches the browser.
  const env = loadEnv(mode, process.cwd(), "")

  const voiceAgentProxy = {
    "/api": {
      target: env.VOICE_AGENT_URL ?? "http://localhost:8000",
      changeOrigin: true,
      rewrite: (requestPath: string) => requestPath.replace(/^\/api/, ""),
      headers: { "X-API-Key": env.VOICE_AGENT_API_KEY ?? "" },
    },
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": path.resolve(import.meta.dirname, "src") },
    },
    server: { proxy: voiceAgentProxy },
    preview: { proxy: voiceAgentProxy },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
      clearMocks: true,
    },
  }
})
