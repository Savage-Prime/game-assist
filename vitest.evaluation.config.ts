import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Include only the RNG evaluation files
		include: ["src/evaluation/**/*.evaluation.ts"],
		environment: "node",
		globals: true,
		watch: false,
		// Increase timeouts for long-running statistical tests
		testTimeout: 30000,
		hookTimeout: 30000,
		// Run tests sequentially to avoid interference
		pool: "forks",
		poolOptions: { forks: { singleFork: true } },
	},
});
