import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createPostgresPool } from "../db/postgres";

type DemoOt = {
    ot_numero: string;
    empresa: string;
    activo: string;
    fecha: string;
    tipo: string;
    motivo: string;
    trabajo_realizado: string;
    materiales: string[];
    responsable: string;
    ubicacion: string;
    observaciones?: string;
};

type DemoCompanyAssets = {
    empresa: string;
    activos: string[];
};

async function main(): Promise<void> {
    const pool = createPostgresPool();
    const otsPath = resolveDataPath(process.env.OTS_DATA_PATH, ["frontend", "src", "assets", "ots-demo.json"]);
    const companiesPath = resolveDataPath(
        process.env.COMPANIES_DATA_PATH,
        ["frontend", "src", "data", "empresas-activos.json"]
    );

    const demoOts = parseJson<DemoOt[]>(otsPath);
    const demoCatalog = parseJson<DemoCompanyAssets[]>(companiesPath);

    const companyIdByName = new Map<string, string>();
    const registerCompany = (name: string): string => {
        const key = normalize(name);
        const existing = companyIdByName.get(key);
        if (existing) return existing;
        const id = buildId("company", key);
        companyIdByName.set(key, id);
        return id;
    };

    for (const item of demoCatalog) registerCompany(item.empresa);
    for (const item of demoOts) registerCompany(item.empresa);

    const assetIdByCompound = new Map<string, string>();
    const registerAsset = (companyName: string, assetName: string): string => {
        const compound = `${normalize(companyName)}::${normalize(assetName)}`;
        const existing = assetIdByCompound.get(compound);
        if (existing) return existing;
        const id = buildId("asset", `${normalize(companyName)}-${normalize(assetName)}`);
        assetIdByCompound.set(compound, id);
        return id;
    };

    for (const item of demoCatalog) {
        for (const asset of item.activos) registerAsset(item.empresa, asset);
    }
    for (const item of demoOts) registerAsset(item.empresa, item.activo);

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        for (const [nameKey, id] of companyIdByName.entries()) {
            const name = [...demoCatalog.map((i) => i.empresa), ...demoOts.map((i) => i.empresa)]
                .find((n) => normalize(n) === nameKey) ?? nameKey;
            await client.query(
                `
                INSERT INTO companies (id, name)
                VALUES ($1, $2)
                ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
                `,
                [id, name]
            );
        }

        for (const [compound, assetId] of assetIdByCompound.entries()) {
            const [companyNorm, assetNorm] = compound.split("::");
            const companyName = [...demoCatalog.map((i) => i.empresa), ...demoOts.map((i) => i.empresa)]
                .find((n) => normalize(n) === companyNorm);
            const assetName = [
                ...demoCatalog.flatMap((i) => i.activos),
                ...demoOts.map((i) => i.activo)
            ].find((n) => normalize(n) === assetNorm);
            if (!companyName || !assetName) continue;

            const companyId = registerCompany(companyName);
            await client.query(
                `
                INSERT INTO assets (id, company_id, name)
                VALUES ($1, $2, $3)
                ON CONFLICT (id) DO UPDATE
                SET company_id = EXCLUDED.company_id,
                    name = EXCLUDED.name
                `,
                [assetId, companyId, assetName]
            );
        }

        for (const item of demoOts) {
            const companyId = registerCompany(item.empresa);
            const assetId = registerAsset(item.empresa, item.activo);
            await client.query(
                `
                INSERT INTO ots (
                    id, ot_number, company_id, asset_id, work_date, work_type,
                    reason, work_performed, materials, responsible, location, observations
                )
                VALUES (
                    $1, $2, $3, $4, $5::date, $6,
                    $7, $8, $9::text[], $10, $11, $12
                )
                ON CONFLICT (id) DO UPDATE
                SET ot_number = EXCLUDED.ot_number,
                    company_id = EXCLUDED.company_id,
                    asset_id = EXCLUDED.asset_id,
                    work_date = EXCLUDED.work_date,
                    work_type = EXCLUDED.work_type,
                    reason = EXCLUDED.reason,
                    work_performed = EXCLUDED.work_performed,
                    materials = EXCLUDED.materials,
                    responsible = EXCLUDED.responsible,
                    location = EXCLUDED.location,
                    observations = EXCLUDED.observations
                `,
                [
                    buildId("ot", normalize(item.ot_numero)),
                    item.ot_numero,
                    companyId,
                    assetId,
                    item.fecha,
                    item.tipo,
                    item.motivo,
                    item.trabajo_realizado,
                    item.materiales ?? [],
                    item.responsable,
                    item.ubicacion,
                    item.observaciones ?? null
                ]
            );
        }

        await client.query("COMMIT");
        console.log("Seed demo PostgreSQL completado.");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

function parseJson<T>(filePath: string): T {
    const raw = readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
    return JSON.parse(raw) as T;
}

function resolveDataPath(envPath: string | undefined, defaultSegments: string[]): string {
    const candidates: string[] = [];
    if (envPath) candidates.push(path.resolve(envPath));
    candidates.push(path.resolve(process.cwd(), ...defaultSegments));
    candidates.push(path.resolve(process.cwd(), "..", ...defaultSegments));
    const match = candidates.find((candidate) => existsSync(candidate));
    if (!match) {
        throw new Error(`No se encontró dataset para: ${defaultSegments.join("/")}`);
    }
    return match;
}

function normalize(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function buildId(prefix: string, value: string): string {
    const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return `${prefix}-${slug}`;
}

void main().catch((error) => {
    console.error("Error ejecutando seed demo:", error);
    process.exit(1);
});
