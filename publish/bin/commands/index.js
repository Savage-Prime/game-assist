// For help with commands, interactions, and response/request payloads:
// https://discord.com/developers/docs/interactions/receiving-and-responding
import ping from "./ping.js";
import roll from "./roll.js";
// keep a list for deployment
export const slashCommandList = [ping, roll];
// build the name→command map safely
export const slashCommands = Object.fromEntries(slashCommandList.map((c, i) => {
    if (!c?.data || typeof c.data?.toJSON !== "function") {
        throw new Error(`Invalid command at index ${i}: missing data SlashCommandBuilder`);
    }
    const j = c.data.toJSON();
    if (!j.name || !j.description) {
        throw new Error(`Invalid command at index ${i}: name/description missing`);
    }
    return [j.name, c];
}));
//# sourceMappingURL=index.js.map