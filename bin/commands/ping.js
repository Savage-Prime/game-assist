import { log } from "../utils/diags.js";
import { SlashCommandBuilder } from "discord.js";
export default {
    data: new SlashCommandBuilder().setName("ping").setDescription("ACK ping"),
    async execute(interaction) {
        const started = performance.now();
        log.traceInteraction("ping", interaction);
        await interaction.reply("pong");
        const durationMs = Math.round(performance.now() - started);
        log.info("Command executed", { command: "ping", durationMs: durationMs });
    },
};
//# sourceMappingURL=ping.js.map