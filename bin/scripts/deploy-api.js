import { log } from "../utils/diags.js";
import { GetDiscordEnv } from "../utils/env.js";
import { REST, Routes } from "discord.js";
import VerifyCommands from "../utils/verify.js";
import { slashCommands } from "../commands/index.js";
// --- arg parsing (no deps)
const args = new Set(process.argv.slice(2));
const getArg = (key) => {
    const idx = process.argv.findIndex((a) => a === key);
    return idx >= 0 ? process.argv[idx + 1] : undefined;
};
const dryRun = args.has("--dry-run");
const clearGuild = args.has("--clear-guild");
const argGuildId = getArg("--guild-id");
// --- run
async function main() {
    const { token: discordToken, appId: appId, guildId: envGuildId } = GetDiscordEnv();
    const guildId = argGuildId ?? envGuildId;
    const rest = new REST({ version: "10" }).setToken(discordToken);
    // Handle clear guild commands case
    if (clearGuild) {
        if (!guildId) {
            log.error("Guild ID is required for clearing guild commands");
            log.info("Usage: npm run deploy -- --clear-guild --guild-id YOUR_GUILD_ID");
            process.exit(1);
        }
        log.info("Clearing all guild commands", { guildId });
        const res = await rest.put(Routes.applicationGuildCommands(appId, guildId), { body: [] });
        log.info("Successfully cleared all guild commands", { guildId, clearedCount: res.length });
        return;
    }
    // --- verify commands (only if we're deploying, not clearing)
    const { errors, warnings } = VerifyCommands(slashCommands);
    if (warnings.length) {
        log.warn("Command validation warnings", { warnings });
    }
    if (errors.length) {
        log.error("Command validation errors", { errors });
        throw new Error("Command validation failed");
    }
    // prepare body
    const body = Object.values(slashCommands).map((c) => c.data.toJSON());
    if (dryRun) {
        log.info("DRY RUN — these commands would be deployed", {
            commands: body.map((c) => ({ name: c.name, description: c.description })),
        });
    }
    else {
        try {
            if (guildId) {
                // instant updates when testing in your dev server
                log.info("Deploying commands to guild", { guildId });
                const res = await rest.put(Routes.applicationGuildCommands(appId, guildId), { body });
                log.info("Deployed public commands to guild", { count: res.length, guildId });
            }
            else {
                // global deploy (may take up to an hour to propagate)
                log.info("Deploying *GLOBAL* commands");
                const res = await rest.put(Routes.applicationCommands(appId), { body });
                log.info("Deployed *GLOBAL* commands", { count: res.length });
            }
        }
        catch (err) {
            log.error("Deployment failed", { err: String(err) });
        }
    }
}
main().catch((err) => {
    log.error("Failed to deploy commands", { err: String(err) });
    process.exit(1);
});
//# sourceMappingURL=deploy-api.js.map