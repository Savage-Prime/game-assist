import type { ChatInputCommandInteraction } from "discord.js";
export declare class Diags {
    private readonly traceEnabled;
    constructor();
    private formatTimestamp;
    private emit;
    trace(msg: string, extra?: Record<string, unknown>): void;
    info(msg: string, extra?: Record<string, unknown>): void;
    warn(msg: string, extra?: Record<string, unknown>): void;
    error(msg: string, extra?: Record<string, unknown>): void;
    traceInteraction(command: string, interaction: ChatInputCommandInteraction): void;
}
export declare const log: Diags;
//# sourceMappingURL=diags.d.ts.map