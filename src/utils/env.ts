// Load dotenv only in development
if (process.env["NODE_ENV"] !== "production") {
	await import("dotenv/config");
}

export function GetEnv(name: string, defaultValue?: string): string | undefined {
	const v = process.env[name];
	return v !== undefined ? v : defaultValue;
}

export function GetEnvBool(name: string, defaultValue: boolean): boolean {
	const v = process.env[name];
	if (v === undefined) return defaultValue;
	return /^(1|true|yes|on)$/i.test(v);
}

export function GetRequiredEnv(name: string): string {
	const v = process.env[name];
	if (!v) throw new Error(`Missing required env: ${name}`);
	return v;
}

export function GetDiscordEnv(): { token: string; appId: string; guildId?: string } {
	const token = GetRequiredEnv("DISCORD_TOKEN");
	const appId = GetRequiredEnv("APPLICATION_ID");
	const guildId = GetEnv("GUILD_ID");
	if (guildId === undefined) {
		return { token, appId };
	}
	return { token, appId, guildId };
}
