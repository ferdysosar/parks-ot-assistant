import { Pool, PoolConfig } from "pg";

export function createPostgresPool(): Pool {
    const connectionString = process.env.DATABASE_URL;
    const sslMode = (process.env.DATABASE_SSL ?? "").trim().toLowerCase();

    const config: PoolConfig = {
        connectionString: connectionString || undefined,
        host: process.env.PGHOST,
        port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
        database: process.env.PGDATABASE,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        ssl: sslMode === "require" ? { rejectUnauthorized: false } : undefined,
        max: process.env.PGPOOL_MAX ? Number(process.env.PGPOOL_MAX) : 10
    };

    return new Pool(config);
}
