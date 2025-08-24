import "dotenv/config";

interface DiscordRequestOptions {
    method: string;
    body?: any;
}

export async function DiscordRequest(endpoint: string, options: DiscordRequestOptions): Promise<Response> {
    // append endpoint to root API URL
    const url = 'https://discord.com/api/v10/' + endpoint;

    // Stringify payloads
    if (options.body) options.body = JSON.stringify(options.body);

    // Use fetch to make requests
    // original User-Agent: DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)
    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env["DISCORD_TOKEN"]}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'User-Agent': 'DiscordBot (SPGA)',
        },
        ...options
    });

    // throw API errors
    if (!res.ok) {
        const data = await res.json();
        console.log(res.status);
        throw new Error(JSON.stringify(data));
    }
    
    // return original response
    return res;
}

interface InstallGlobalCommandsOptions {
    appId: string;
    commands: any[];
}

export async function InstallGlobalCommands(appId: InstallGlobalCommandsOptions['appId'], commands: InstallGlobalCommandsOptions['commands']): Promise<void> {
    // API endpoint to overwrite global commands
    const endpoint = `applications/${appId}/commands`;

    try {
        // This is calling the bulk overwrite endpoint:
        // https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
        await DiscordRequest(endpoint, { method: 'PUT', body: commands });
    } catch (err) {
        console.error(err);
    }
}
