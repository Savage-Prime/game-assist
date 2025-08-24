import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { calculateDiceRolls } from "../utils/game.js";

export default {
	data: new SlashCommandBuilder().setName("roll").setDescription("Rolls a die and returns a number between 1 and 6."),
	async execute(interaction: ChatInputCommandInteraction) {
		const quantity = 1;
		const min = 1;
		const max = 6;
		const modifier = 0;
		const exploding = false;
		const explodingNumber = max;
		const infinite = true;
		const rolls: number[] = [];
		const sum = calculateDiceRolls(quantity, min, max, modifier, exploding, explodingNumber, infinite, rolls);
		const modifierPart = modifier === 0 ? "" : modifier > 0 ? `+${modifier}` : `${modifier}`;
		await interaction.reply(`${quantity}d${max}${modifierPart}: **${sum}** [${rolls.join(", ")}]`);
	},
};
