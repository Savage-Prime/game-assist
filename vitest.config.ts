import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// match common test file patterns in this repo
		include: ["src/tests/**/*.spec.ts", "src/tests/**/*.test.ts", "src/**/*.test.ts"],
		environment: "node",
		globals: true,
		watch: false, // Don't watch for file changes by default
	},
});
