import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Diags } from "../utils/diags.js";

describe("Diags", () => {
	let diags: Diags;
	let consoleLogSpy: any;
	let consoleErrorSpy: any;
	let consoleWarnSpy: any;
	let originalTraceLog: string | undefined;

	beforeEach(() => {
		// Save and clear TRACE_LOG to ensure predictable test behavior
		originalTraceLog = process.env["TRACE_LOG"];
		delete process.env["TRACE_LOG"];

		diags = new Diags();
		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
	});

	afterEach(() => {
		// Restore original TRACE_LOG value
		if (originalTraceLog !== undefined) {
			process.env["TRACE_LOG"] = originalTraceLog;
		} else {
			delete process.env["TRACE_LOG"];
		}
		vi.restoreAllMocks();
	});

	describe("timestamp formatting", () => {
		it("should log timestamp in local time with UTC offset format", () => {
			diags.info("test message");

			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			const logOutput = consoleLogSpy.mock.calls[0][0];
			const parsed = JSON.parse(logOutput);

			// Verify timestamp format: YYYY-MM-DD HH:MM:SS.mmm (+/-HHMM)
			const timestampRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} \([+-]\d{4}\)$/;
			expect(parsed.ts).toMatch(timestampRegex);
		});

		it("should include correct UTC offset", () => {
			diags.info("test message");

			const logOutput = consoleLogSpy.mock.calls[0][0];
			const parsed = JSON.parse(logOutput);

			// Extract offset from timestamp
			const offsetMatch = parsed.ts.match(/\(([+-]\d{4})\)$/);
			expect(offsetMatch).toBeTruthy();

			const offset = offsetMatch![1];
			const now = new Date();
			const expectedOffsetMinutes = -now.getTimezoneOffset();
			const expectedOffsetHours = String(Math.floor(Math.abs(expectedOffsetMinutes) / 60)).padStart(2, "0");
			const expectedOffsetMins = String(Math.abs(expectedOffsetMinutes) % 60).padStart(2, "0");
			const expectedSign = expectedOffsetMinutes >= 0 ? "+" : "-";
			const expectedOffset = `${expectedSign}${expectedOffsetHours}${expectedOffsetMins}`;

			expect(offset).toBe(expectedOffset);
		});

		it("should format timestamp components correctly", () => {
			const fixedDate = new Date("2025-09-09T11:45:15.123Z");
			vi.useFakeTimers();
			vi.setSystemTime(fixedDate);

			diags.info("test message");

			const logOutput = consoleLogSpy.mock.calls[0][0];
			const parsed = JSON.parse(logOutput);

			// Extract date and time parts
			const [datePart, timePart, offsetPart] = parsed.ts.split(" ");

			// Verify date format YYYY-MM-DD
			expect(datePart).toMatch(/^\d{4}-\d{2}-\d{2}$/);

			// Verify time format HH:MM:SS.mmm
			expect(timePart).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);

			// Verify offset format (+/-)HHMM
			expect(offsetPart).toMatch(/^\([+-]\d{4}\)$/);

			vi.useRealTimers();
		});
	});

	describe("log levels", () => {
		it("should log info messages to console.log", () => {
			diags.info("info message");

			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0]);
			expect(parsed.level).toBe("info");
			expect(parsed.msg).toBe("info message");
		});

		it("should log warn messages to console.warn", () => {
			diags.warn("warning message");

			expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
			const parsed = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
			expect(parsed.level).toBe("warn");
			expect(parsed.msg).toBe("warning message");
		});

		it("should log error messages to console.error", () => {
			diags.error("error message");

			expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
			const parsed = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
			expect(parsed.level).toBe("error");
			expect(parsed.msg).toBe("error message");
		});

		it("should include extra data in log output", () => {
			diags.info("test", { userId: "123", action: "click" });

			const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0]);
			expect(parsed.data).toEqual({ userId: "123", action: "click" });
		});

		it("should include process ID in log output", () => {
			diags.info("test");

			const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0]);
			expect(parsed.pid).toBe(process.pid);
		});
	});

	describe("trace logging", () => {
		it("should not log trace messages by default", () => {
			diags.trace("trace message");

			expect(consoleLogSpy).not.toHaveBeenCalled();
		});

		it("should log trace messages when TRACE_LOG is enabled", () => {
			// Create new instance with trace enabled
			process.env["TRACE_LOG"] = "true";
			const traceDiags = new Diags();

			traceDiags.trace("trace message");

			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0]);
			expect(parsed.level).toBe("trace");
			expect(parsed.msg).toBe("trace message");

			delete process.env["TRACE_LOG"];
		});
	});

	describe("error serialization", () => {
		it("should serialize Error objects in extra data", () => {
			const error = new Error("Test error");
			error.stack = "Error: Test error\n    at test.ts:1:1";

			diags.error("error occurred", { error });

			const parsed = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
			expect(parsed.data.error).toEqual({
				name: "Error",
				message: "Test error",
				stack: "Error: Test error\n    at test.ts:1:1",
			});
		});
	});
});
