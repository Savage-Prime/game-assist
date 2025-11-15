import { GetEnvBool } from "./env.js";
const jsonReplacer = (_, val) => {
    if (val instanceof Error) {
        return { name: val.name, message: val.message, stack: val.stack };
    }
    return val;
};
export class Diags {
    traceEnabled;
    constructor() {
        this.traceEnabled = GetEnvBool("TRACE_LOG", false);
    }
    formatTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const milliseconds = String(now.getMilliseconds()).padStart(3, "0");
        // Get UTC offset in minutes and format as (+/-)HHMM
        const offsetMinutes = -now.getTimezoneOffset();
        const offsetSign = offsetMinutes >= 0 ? "+" : "-";
        const offsetHours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, "0");
        const offsetMins = String(Math.abs(offsetMinutes) % 60).padStart(2, "0");
        const offset = `${offsetSign}${offsetHours}${offsetMins}`;
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds} (${offset})`;
    }
    emit(level, msg, extra = {}) {
        const base = { ts: this.formatTimestamp(), level, msg, pid: process.pid };
        if (extra && Object.keys(extra).length)
            base.data = extra; // prevent clobbering msg/level
        const line = JSON.stringify(base, jsonReplacer);
        if (level === "error")
            return console.error(line);
        if (level === "warn")
            return console.warn(line);
        return console.log(line);
    }
    trace(msg, extra = {}) {
        if (!this.traceEnabled)
            return;
        this.emit("trace", msg, extra);
    }
    info(msg, extra = {}) {
        this.emit("info", msg, extra);
    }
    warn(msg, extra = {}) {
        this.emit("warn", msg, extra);
    }
    error(msg, extra = {}) {
        this.emit("error", msg, extra);
    }
    traceInteraction(command, interaction) {
        if (!this.traceEnabled)
            return;
        try {
            const options = interaction?.options?.data?.map((d) => ({ name: d.name, value: d.value })) ?? [];
            const user = interaction.user
                ? {
                    id: interaction.user.id,
                    username: interaction.user.username,
                    discriminator: interaction.user.discriminator ?? null,
                    globalName: interaction.user.globalName ?? null,
                }
                : undefined;
            this.emit("trace", "interaction", {
                type: "interaction",
                command,
                user,
                guildId: interaction.guildId ?? null,
                channelId: interaction.channelId ?? null,
                options,
            });
        }
        catch (err) {
            this.emit("trace", "interaction_error", { command, error: err?.message ?? String(err) });
        }
    }
}
export const log = new Diags();
//# sourceMappingURL=diags.js.map