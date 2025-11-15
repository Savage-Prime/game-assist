export declare const inDevelopment: boolean;
export declare function GetEnv(name: string, defaultValue?: string): string | undefined;
export declare function GetEnvBool(name: string, defaultValue: boolean): boolean;
export declare function GetRequiredEnv(name: string): string;
export declare function IsProduction(): boolean;
export declare function GetDiscordEnv(): {
    token: string;
    appId: string;
    guildId?: string;
};
//# sourceMappingURL=env.d.ts.map