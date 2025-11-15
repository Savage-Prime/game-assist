// Load dotenv only in development
const rawNodeEnv = process.env["NODE_ENV"];
const nodeEnv = typeof rawNodeEnv === "string" ? rawNodeEnv.trim().toLowerCase() : undefined;
// If NODE_ENV === 'production' then we're in production; any other value (or undefined) => inDevelopment.
export const inDevelopment = nodeEnv !== "production";
// Safety check: warn if NODE_ENV is set to an unexpected value (neither 'production' nor 'development').
if (nodeEnv && nodeEnv !== "production" && nodeEnv !== "development") {
    console.warn(`[env] Unrecognized NODE_ENV="${rawNodeEnv}". Treating as development for safety.`);
}
if (inDevelopment) {
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
export function IsProduction() {
    return process.env["NODE_ENV"] === "production";
}
export function GetDiscordEnv() {
    const isProduction = IsProduction();
    // Use production variables in production, dev variables otherwise
    const tokenVar = isProduction ? "DISCORD_TOKEN" : "DEV-DISCORD_TOKEN";
    const appIdVar = isProduction ? "APPLICATION_ID" : "DEV-APPLICATION_ID";
    const token = GetRequiredEnv(tokenVar);
    const appId = GetRequiredEnv(appIdVar);
    const guildId = GetEnv("GUILD_ID");
    if (guildId === undefined) {
        return { token, appId };
    }
    return { token, appId, guildId };
}
//# sourceMappingURL=env.js.map