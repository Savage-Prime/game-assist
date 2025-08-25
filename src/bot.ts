import { log } from "./utils/diags.js";
import { GetDiscordEnv } from "./utils/env.js";
import { Client, Events, GatewayIntentBits } from "discord.js";
import type { Interaction } from "discord.js";
import { slashCommands } from "./commands/index.js";

const { token: discordToken, appId: appId } = GetDiscordEnv();

// gateway listens for slash commands
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Register event when bot comes online
client.once(Events.ClientReady, (c) => {
	log.info("Gateway connected", { user: c.user.tag, appId: appId });
});

// Handle interactions (slash commands)
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const cmd = slashCommands[interaction.commandName];
	if (!cmd) {
		// Can happen if your deployed commands are out of sync with the running image
		await interaction.reply({ content: "Unknown command.", ephemeral: true }).catch(() => {});
		log.warn("[slash] unknown", { commandName: interaction.commandName });
		return;
	}

	try {
		await cmd.execute(interaction);
	} catch (err) {
		log.error("[slash] failed", { commandName: interaction.commandName, err: String(err) });
		if (interaction.deferred || interaction.replied) {
			await interaction.followUp({ content: "Error executing command.", ephemeral: true }).catch(() => {});
		} else {
			await interaction.reply({ content: "Error executing command.", ephemeral: true }).catch(() => {});
		}
	}
});

// Optional lightweight health probe
const healthPort = process.env["HEALTH_PORT"];
if (healthPort) {
	// Use Node’s built-in http, keep it tiny and dependency-free
	const http = await import("node:http");
	http.createServer((_req, res) => {
		res.writeHead(200, { "Content-Type": "text/plain" });
		res.end("OK");
	}).listen(Number(healthPort), () => {
		log.info("Health check server listening", { port: healthPort });
	});
}

// Hardening: surface unhandled errors in logs (don’t crash the process if avoidable)
process.on("unhandledRejection", (reason) => {
	const msg = reason instanceof Error ? reason.stack || reason.message : String(reason);
	log.error("unhandledRejection", { reason: msg });
});
process.on("uncaughtException", (err) => {
	log.error("uncaughtException", { err: err.stack || err.message || String(err) });
});

// Graceful shutdown for containers / orchestrators
let shuttingDown = false;
async function shutdown(signal: string) {
	if (shuttingDown) return;
	shuttingDown = true;
	log.info("Shutting down", { signal });

	try {
		// Destroy the gateway connection
		client.destroy();
	} catch (err) {
		log.warn("client.destroy error", { err: String(err) });
	} finally {
		setTimeout(() => process.exit(0), 100); // let logs flush
	}
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));

// Go
client.login(discordToken).catch((err) => {
	log.error("Login failed", { err: err.stack || String(err) });
	// Fail fast if we can’t log in—container will restart
	process.exit(1);
});
