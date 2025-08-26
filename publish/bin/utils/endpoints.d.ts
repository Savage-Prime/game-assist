interface DiscordRequestOptions {
    method: string;
    body?: any;
}
export declare function DiscordRequest(endpoint: string, options: DiscordRequestOptions): Promise<Response>;
interface InstallGlobalCommandsOptions {
    appId: string;
    commands: any[];
}
export declare function InstallGlobalCommands(appId: InstallGlobalCommandsOptions["appId"], commands: InstallGlobalCommandsOptions["commands"]): Promise<void>;
export {};
//# sourceMappingURL=endpoints.d.ts.map