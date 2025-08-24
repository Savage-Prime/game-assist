import "dotenv/config";
import { log } from "../utils/diags.js";
import { GetDiscordEnv } from "../utils/env.js";
import { REST, Routes, type RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import { slashCommands } from "../commands/index.js";

try {
	if (!Array.isArray(slashCommands) || slashCommands.some((c) => !c.name || !c.description)) {
		throw new Error("Invalid commands: Each command must have a name and description.");
	}

	const { token: discordToken, appId: appId, guildId: guildId } = GetDiscordEnv();

	const rest = new REST({ version: "10" }).setToken(discordToken);
	const dryRun = process.argv.includes("--dry");

	(async () => {
		// build the JSON bodies from SlashCommandBuilder instances
		const body: RESTPostAPIChatInputApplicationCommandsJSONBody[] = Object.values(slashCommands).map((c) =>
			c.data.toJSON(),
		);

		if (dryRun) {
			log.info("DRY RUN — these commands would be deployed", {
				commands: body.map((c) => ({ name: c.name, description: c.description })),
			});
		} else {
			try {
				if (guildId) {
					// instant updates when testing in your dev server
					log.info("Deploying commands to guild", { guildId });
					const res = await rest.put(Routes.applicationGuildCommands(appId, guildId), { body });
					log.info("Deployed public commands to guild", { count: (res as any[]).length, guildId });
				} else {
					// global deploy (may take up to an hour to propagate)
					log.info("Deploying global commands");
					const res = await rest.put(Routes.applicationCommands(appId), { body });
					log.info("Deployed global commands", { count: (res as any[]).length });
				}
			} catch (err) {
				log.error("Deployment failed", { err: String(err) });
			}
		}
	})();
} catch (err) {
	log.error("Fatal error", { err: String(err) });
}
