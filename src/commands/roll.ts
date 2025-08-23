import { CommandInteraction } from 'discord.js';
import { randomInt } from '../utils/rng.js';

export default {
    name: 'roll',
    description: 'Rolls a die and returns a number between 1 and 6.',
    execute: async (interaction: CommandInteraction) => {
        const result = randomInt(1, 6);
        await interaction.reply(`You rolled a ${result}!`);
    },
};