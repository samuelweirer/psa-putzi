/**
 * Database connection pool
 */
import { Pool } from 'pg';
export declare function getPool(): Pool;
export declare function query(text: string, params?: any[]): Promise<import("pg").QueryResult<any>>;
export declare function closePool(): Promise<void>;
declare const _default: {
    getPool: typeof getPool;
    query: typeof query;
    closePool: typeof closePool;
};
export default _default;
//# sourceMappingURL=database.d.ts.map