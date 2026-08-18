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
        // Vitest <1 also collected every file under a __tests__ directory. Vitest 3 dropped that
        // default, which would silently skip the *.specs.ts suites, so it is restored explicitly.
        // The *.data.ts exclusion below exists because this pattern also matches fixture files.
        include: [...configDefaults.include, "**/__tests__/**/*.?(c|m)[jt]s?(x)"],
        exclude: [...configDefaults.exclude, "**/*.data.ts", "src/capture-core", "src/capture-core-utils"],
    },
});
