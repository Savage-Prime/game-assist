export function GetEnv(name: string, defaultValue?: string): string | undefined {
	const v = process.env[name];
	return v !== undefined ? v : defaultValue;
}

export function GetRequiredEnv(name: string): string {
	const v = process.env[name];
	if (!v) throw new Error(`Missing required env: ${name}`);
	return v;
}

export function GetDiscordEnv(): { token: string; appId: string; guildId: string } {
	const token = GetRequiredEnv("DISCORD_TOKEN");
	const appId = GetRequiredEnv("CLIENT_ID");
	const guildId = GetRequiredEnv("DISCORD_GUILD_ID");
	return { token, appId, guildId };
}
