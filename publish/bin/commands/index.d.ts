import type { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from "discord.js";
export type SlashCommand = {
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};
export declare const slashCommandList: SlashCommand[];
export declare const slashCommands: Record<string, SlashCommand>;
//# sourceMappingURL=index.d.ts.map