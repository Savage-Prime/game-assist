import type { ChatInputCommandInteraction } from "discord.js";
import { GetEnvBool } from "./env.js";

const jsonReplacer = (_: string, val: any) => {
	if (val instanceof Error) {
		return { name: val.name, message: val.message, stack: val.stack };
	}
	return val;
};

export class Diags {
	private readonly traceEnabled: boolean;

	constructor() {
		this.traceEnabled = GetEnvBool("TRACE_LOG", false);
	}

	private formatTimestamp(): string {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, "0");
		const day = String(now.getDate()).padStart(2, "0");
		const hours = String(now.getHours()).padStart(2, "0");
		const minutes = String(now.getMinutes()).padStart(2, "0");
		const seconds = String(now.getSeconds()).padStart(2, "0");
		const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

		// Get UTC offset in minutes and format as (+/-)HHMM
		const offsetMinutes = -now.getTimezoneOffset();
		const offsetSign = offsetMinutes >= 0 ? "+" : "-";
		const offsetHours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, "0");
		const offsetMins = String(Math.abs(offsetMinutes) % 60).padStart(2, "0");
		const offset = `${offsetSign}${offsetHours}${offsetMins}`;

		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds} (${offset})`;
	}

	private emit(level: "trace" | "info" | "warn" | "error", msg: string, extra: Record<string, unknown> = {}) {
		const base: any = { ts: this.formatTimestamp(), level, msg, pid: process.pid };
		if (extra && Object.keys(extra).length) base.data = extra; // prevent clobbering msg/level
		const line = JSON.stringify(base, jsonReplacer);
		if (level === "error") return console.error(line);
		if (level === "warn") return console.warn(line);
		return console.log(line);
	}

	trace(msg: string, extra: Record<string, unknown> = {}) {
		if (!this.traceEnabled) return;
		this.emit("trace", msg, extra);
	}

	info(msg: string, extra: Record<string, unknown> = {}) {
		this.emit("info", msg, extra);
	}

	warn(msg: string, extra: Record<string, unknown> = {}) {
		this.emit("warn", msg, extra);
	}

	error(msg: string, extra: Record<string, unknown> = {}) {
		this.emit("error", msg, extra);
	}

	traceInteraction(command: string, interaction: ChatInputCommandInteraction) {
		if (!this.traceEnabled) return;
		try {
			const options = interaction?.options?.data?.map((d) => ({ name: d.name, value: d.value })) ?? [];
			const user = interaction.user
				? {
						id: interaction.user.id,
						username: interaction.user.username,
						discriminator: (interaction.user as any).discriminator ?? null,
						globalName: (interaction.user as any).globalName ?? null,
					}
				: undefined;

			this.emit("trace", "interaction", {
				type: "interaction",
				command,
				user,
				guildId: interaction.guildId ?? null,
				channelId: interaction.channelId ?? null,
				options,
			});
		} catch (err) {
			this.emit("trace", "interaction_error", { command, error: (err as Error)?.message ?? String(err) });
		}
	}
}

export const log = new Diags();
