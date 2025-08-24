import type { SlashCommandBuilder } from "discord.js";

type JCmd = { name?: string; description?: string; options?: any[] };

export default function VerifyCommands(commands: Record<string, { data: SlashCommandBuilder }>) {
	const errors: [string, string][] = [];
	const addError = (key: string, message: string) => errors.push([key, message]);
	const warnings: [string, string][] = [];
	const addWarning = (key: string, message: string) => warnings.push([key, message]);
	const seen = new Set<string>();

	const jsons: { key: string; j: JCmd }[] = Object.entries(commands).map(([key, c]) => {
		if (!c?.data || typeof (c.data as any)?.toJSON !== "function") {
			addError(key, "missing SlashCommandBuilder or toJSON()");
			return { key, j: {} };
		}
		return { key, j: (c.data as any).toJSON() as JCmd };
	});

	for (const { key, j } of jsons) {
		const n = j.name ?? "";
		if (!j.name) addError(key, "missing name");
		if (!j.description) addError(key, "missing description");
		if (n && n !== key) addError(key, `map key does not match builder name "${n}"`);
		if (n && !/^[\w-]{1,32}$/.test(n)) addError(key, `invalid name "${n}" (a-z0-9_- only, 1-32)`);
		if (seen.has(n)) addError(key, `duplicate command name "${n}"`);
		seen.add(n);
		if (j.description && j.description.length > 100) {
			addWarning(n, "description > 100 chars (limit 100)");
		}
		if (Array.isArray(j.options)) {
			for (const opt of j.options) {
				if (!opt.name || !/^[\w-]{1,32}$/.test(opt.name)) {
					addError(n, `invalid option name "${opt?.name}"`);
				}
				if (!opt.description || opt.description.length > 100) {
					addError(n, `invalid option description for "${opt?.name}"`);
				}
			}
		}
	}

	return { errors, warnings };
}
