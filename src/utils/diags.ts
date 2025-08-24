export class Diags {
	info(msg: string, extra: Record<string, unknown> = {}) {
		console.log(JSON.stringify({ level: "info", msg, ...extra }));
	}

	warn(msg: string, extra: Record<string, unknown> = {}) {
		console.warn(JSON.stringify({ level: "warn", msg, ...extra }));
	}

	error(msg: string, extra: Record<string, unknown> = {}) {
		console.error(JSON.stringify({ level: "error", msg, ...extra }));
	}
}

export const log = new Diags();
