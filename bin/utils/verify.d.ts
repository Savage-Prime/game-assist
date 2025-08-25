import type { SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from "discord.js";
export default function VerifyCommands(commands: Record<string, {
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
}>): {
    errors: [string, string][];
    warnings: [string, string][];
};
//# sourceMappingURL=verify.d.ts.map