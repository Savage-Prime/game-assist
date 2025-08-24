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

	private emit(level: "trace" | "info" | "warn" | "error", msg: string, extra: Record<string, unknown> = {}) {
		const base: any = { ts: new Date().toISOString(), level, msg, pid: process.pid };
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
