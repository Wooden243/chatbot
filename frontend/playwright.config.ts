import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    channel: "chrome",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command:
        "..\\backend\\.venv\\Scripts\\python.exe -m uvicorn tests.e2e_server:app --app-dir ../backend --host 127.0.0.1 --port 8000",
      url: "http://127.0.0.1:8000/health",
      reuseExistingServer: false,
    },
    {
      command: "npm run start -- --hostname 127.0.0.1",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: false,
      env: { NEXT_TELEMETRY_DISABLED: "1" },
    },
  ],
});
