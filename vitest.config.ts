import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults } from "vitest/config";

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        // Silence the app logger (writes to stderr) during tests
        env: { LOG_LEVEL: "silent" },
        // Added to fix the error: "ReferenceError: window is not defined"
        environment: "jsdom",
        // Added to ignore the *.data.ts files
        include: [...configDefaults.include],
        exclude: [...configDefaults.exclude, "**/*.data.ts", "src/capture-core", "src/capture-core-utils"],
    },
});
