import { CommandInteraction } from 'discord.js';

export default {
    name: 'ping',
    description: 'Verifies status of Game Assist.',
    execute: async (interaction: CommandInteraction) => {
        await interaction.reply(`Pong!`);
    },
};