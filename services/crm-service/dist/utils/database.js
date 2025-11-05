"use strict";
/**
 * Database connection pool
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPool = getPool;
exports.query = query;
exports.closePool = closePool;
const pg_1 = require("pg");
const config_1 = __importDefault(require("./config"));
const logger_1 = __importDefault(require("./logger"));
let pool = null;
function getPool() {
    if (!pool) {
        pool = new pg_1.Pool({
            host: config_1.default.database.host,
            port: config_1.default.database.port,
            database: config_1.default.database.database,
            user: config_1.default.database.user,
            password: config_1.default.database.password,
            max: config_1.default.database.max,
            idleTimeoutMillis: config_1.default.database.idleTimeoutMillis,
            connectionTimeoutMillis: config_1.default.database.connectionTimeoutMillis,
        });
        pool.on('error', (err) => {
            logger_1.default.error('Unexpected error on idle database client', { error: err.message });
        });
        pool.on('connect', () => {
            logger_1.default.debug('New database client connected');
        });
    }
    return pool;
}
async function query(text, params) {
    const client = getPool();
    const start = Date.now();
    try {
        const res = await client.query(text, params);
        const duration = Date.now() - start;
        logger_1.default.debug('Executed query', { text, duration, rows: res.rowCount });
        return res;
    }
    catch (error) {
        logger_1.default.error('Database query error', { text, error });
        throw error;
    }
}
async function closePool() {
    if (pool) {
        await pool.end();
        pool = null;
        logger_1.default.info('Database pool closed');
    }
}
exports.default = { getPool, query, closePool };
//# sourceMappingURL=database.js.map