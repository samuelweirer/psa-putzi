/**
 * Configuration management
 */
declare const config: {
    env: string;
    port: number;
    database: {
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
        max: number;
        idleTimeoutMillis: number;
        connectionTimeoutMillis: number;
    };
    redis: {
        host: string;
        port: number;
        password: string | undefined;
    };
    rabbitmq: {
        url: string;
    };
    jwt: {
        secret: string;
    };
    cors: {
        origin: string | string[];
    };
    logging: {
        level: string;
    };
};
export default config;
//# sourceMappingURL=config.d.ts.map