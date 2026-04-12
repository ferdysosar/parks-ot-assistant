export type RepositoryDriver = "local-json" | "postgres";

export interface RepositoryConfig {
    driver: RepositoryDriver;
    fallbackToLocal: boolean;
}

export function readRepositoryConfig(): RepositoryConfig {
    const rawDriver = (process.env.REPOSITORY_DRIVER ?? "local-json").trim().toLowerCase();
    const driver: RepositoryDriver = rawDriver === "postgres" ? "postgres" : "local-json";

    const fallbackRaw = (process.env.REPOSITORY_FALLBACK_LOCAL ?? "true").trim().toLowerCase();
    const fallbackToLocal = fallbackRaw !== "false";

    return {
        driver,
        fallbackToLocal
    };
}
