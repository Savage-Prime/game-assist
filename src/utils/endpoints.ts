/*
When this file will be useful

Deploying commands
That InstallGlobalCommands wrapper is exactly what deploy-api.ts does: bulk-overwrite slash commands for your bot. You could wire it up to replace your existing deploy script, or keep it as a reusable utility so you don’t duplicate the fetch logic.

Bot behavior that uses REST
Some bot actions aren’t delivered over the Gateway but require REST calls:

Sending a proactive DM to a user

Editing or deleting a message after it’s posted

Adding/removing guild roles

Pinning/unpinning messages

Bulk overwriting commands (guild or global)

Cleaner abstraction
Instead of scattering fetch calls all over, you centralize them here with consistent headers, logging, and error handling.
*/
import "dotenv/config";
import { log } from "./diags.js";

interface DiscordRequestOptions {
	method: string;
	body?: any;
}

export async function DiscordRequest(endpoint: string, options: DiscordRequestOptions): Promise<Response> {
	// append endpoint to root API URL
	const url = "https://discord.com/api/v10/" + endpoint;

	// Stringify payloads
	if (options.body) options.body = JSON.stringify(options.body);

	// Use fetch to make requests
	// original User-Agent: DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)
	const res = await fetch(url, {
		headers: {
			Authorization: `Bot ${process.env["DISCORD_TOKEN"]}`,
			"Content-Type": "application/json; charset=UTF-8",
			"User-Agent": "DiscordBot (SPGA)",
		},
		...options,
	});

	// throw API errors
	if (!res.ok) {
		const data = await res.json();
		log.warn("API returned non-OK status", { status: res.status, body: data });
		throw new Error(JSON.stringify(data));
	}

	// return original response
	return res;
}

interface InstallGlobalCommandsOptions {
	appId: string;
	commands: any[];
}

export async function InstallGlobalCommands(
	appId: InstallGlobalCommandsOptions["appId"],
	commands: InstallGlobalCommandsOptions["commands"],
): Promise<void> {
	// API endpoint to overwrite global commands
	const endpoint = `applications/${appId}/commands`;

	try {
		// This is calling the bulk overwrite endpoint:
		// https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
		await DiscordRequest(endpoint, { method: "PUT", body: commands });
	} catch (err) {
		log.error("Failed installing global commands", { err: String(err) });
	}
}
