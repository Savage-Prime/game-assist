console.log('Deployment starting...');

import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import type { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';
import commands from '../commands/index.js';

try{
    if (!Array.isArray(commands) || commands.some(c => !c.name || !c.description)) {
        throw new Error('Invalid commands: Each command must have a name and description.');
    }

    const rest = new REST({ version: '10' }).setToken(process.env['DISCORD_TOKEN']!);
    const appId = process.env['DISCORD_CLIENT_ID']!;
    const guildId = process.env['DISCORD_GUILD_ID']!;
    const dryRun = process.argv.includes('--dry');

    (async () => {
        // convert each command’s builder to JSON
        const body: RESTPostAPIChatInputApplicationCommandsJSONBody[] =
        commands.map(c => ({ name: c.name, description: c.description }));

        if (dryRun) {
            console.log('DRY RUN — these commands would be deployed:');
            console.table(body.map(c => ({ name: c.name, description: c.description })));
        } else {
            try {
                if (guildId) {
                    // instant updates when testing in your dev server
                    console.log(`Deploying commands to ${guildId}...`);
                    const res = await rest.put(Routes.applicationGuildCommands(appId, guildId), { body });
                    console.log(`✅ Deployed ${(res as any[]).length} public command(s) to ${guildId}`);
                } else {
                    // global deploy (may take up to an hour to propagate)
                    console.log('Deploying global commands...');
                    const res = await rest.put(Routes.applicationCommands(appId), { body });
                    console.log(`✅ Deployed ${(res as any[]).length} global command(s)`);
                }
            } catch (err) {
                console.error('❌ Deployment failed:', err);
            }
        }
    })();
} catch (err) {
    console.error('❌ Fatal error:', err);
}
