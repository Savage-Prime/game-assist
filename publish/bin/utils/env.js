// Load dotenv only in development
if (process.env["NODE_ENV"] !== "production") {
    await import("dotenv/config");
}
export function GetEnv(name, defaultValue) {
    const v = process.env[name];
    return v !== undefined ? v : defaultValue;
}
export function GetEnvBool(name, defaultValue) {
    const v = process.env[name];
    if (v === undefined)
        return defaultValue;
    return /^(1|true|yes|on)$/i.test(v);
}
export function GetRequiredEnv(name) {
    const v = process.env[name];
    if (!v)
        throw new Error(`Missing required env: ${name}`);
    return v;
}
export function GetDiscordEnv() {
    const token = GetRequiredEnv("DISCORD_TOKEN");
    const appId = GetRequiredEnv("APPLICATION_ID");
    const guildId = GetEnv("GUILD_ID");
    if (guildId === undefined) {
        return { token, appId };
    }
    return { token, appId, guildId };
}
//# sourceMappingURL=env.js.map