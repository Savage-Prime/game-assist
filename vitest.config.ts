import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// match common test file patterns in this repo
		include: ["src/**/*.spec.ts", "src/**/*.test.ts", "test/**/*.ts", "src/**/*.test.ts"],
		environment: "node",
		globals: true,
	},
});
