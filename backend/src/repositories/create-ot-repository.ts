import { readRepositoryConfig } from "../config/repository-config";
import { createPostgresPool } from "../db/postgres";
import { LocalJsonOtRepository } from "./local-json-ot-repository";
import { OtRepository } from "./ot-repository";
import { PostgresOtRepository } from "./postgres-ot-repository";

export async function createOtRepository(): Promise<OtRepository> {
    const config = readRepositoryConfig();
    if (config.driver === "local-json") {
        return new LocalJsonOtRepository();
    }

    try {
        const pool = createPostgresPool();
        const pgRepository = new PostgresOtRepository(pool);
        await pgRepository.ping();
        return pgRepository;
    } catch (error) {
        if (!config.fallbackToLocal) {
            throw error;
        }
        console.warn(
            "[createOtRepository] PostgreSQL no disponible, usando LocalJsonOtRepository.",
            error
        );
        return new LocalJsonOtRepository();
    }
}
