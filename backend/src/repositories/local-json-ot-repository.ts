import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import {
    AssetDto,
    AssetQuery,
    CompanyDto,
    CompanyQuery,
    OtCountDto,
    OtCountQuery,
    OtDto,
    OtQuery,
    PagedResponse
} from "../contracts/ot-contracts";
import { OtRepository } from "./ot-repository";

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

export class LocalJsonOtRepository implements OtRepository {
    private readonly companies: CompanyDto[];
    private readonly assets: AssetDto[];
    private readonly ots: OtDto[];

    constructor() {
        const otsPath = this.resolveDataPath(
            process.env.OTS_DATA_PATH,
            ["frontend", "src", "assets", "ots-demo.json"]
        );
        const companiesPath = this.resolveDataPath(
            process.env.COMPANIES_DATA_PATH,
            ["frontend", "src", "data", "empresas-activos.json"]
        );

        const demoOts = this.parseJson<DemoOt[]>(otsPath);
        const demoCatalog = this.parseJson<DemoCompanyAssets[]>(companiesPath);

        const companyIdByName = new Map<string, string>();
        const companies: CompanyDto[] = [];
        const registerCompany = (name: string): string => {
            const normalized = this.normalize(name);
            const existing = companyIdByName.get(normalized);
            if (existing) return existing;
            const id = this.buildId("company", normalized);
            companyIdByName.set(normalized, id);
            companies.push({ id, name });
            return id;
        };

        for (const item of demoCatalog) registerCompany(item.empresa);
        for (const ot of demoOts) registerCompany(ot.empresa);

        const assetIdByCompound = new Map<string, string>();
        const assets: AssetDto[] = [];
        const registerAsset = (companyName: string, assetName: string): string => {
            const companyId = registerCompany(companyName);
            const compound = `${this.normalize(companyName)}::${this.normalize(assetName)}`;
            const existing = assetIdByCompound.get(compound);
            if (existing) return existing;
            const id = this.buildId("asset", `${this.normalize(companyName)}-${this.normalize(assetName)}`);
            assetIdByCompound.set(compound, id);
            assets.push({
                id,
                companyId,
                name: assetName
            });
            return id;
        };

        for (const item of demoCatalog) {
            for (const asset of item.activos) {
                registerAsset(item.empresa, asset);
            }
        }
        for (const ot of demoOts) {
            registerAsset(ot.empresa, ot.activo);
        }

        const ots = demoOts.map((ot) => {
            const companyId = registerCompany(ot.empresa);
            const assetId = registerAsset(ot.empresa, ot.activo);
            return {
                id: this.buildId("ot", this.normalize(ot.ot_numero)),
                otNumber: ot.ot_numero,
                companyId,
                companyName: ot.empresa,
                assetId,
                assetName: ot.activo,
                workDate: ot.fecha,
                workType: ot.tipo,
                reason: ot.motivo,
                workPerformed: ot.trabajo_realizado,
                materials: ot.materiales ?? [],
                responsible: ot.responsable,
                location: ot.ubicacion,
                observations: ot.observaciones ?? null
            } satisfies OtDto;
        });

        this.companies = companies.sort((a, b) => a.name.localeCompare(b.name));
        this.assets = assets.sort((a, b) => a.name.localeCompare(b.name));
        this.ots = ots;
    }

    async queryOts(query?: OtQuery): Promise<PagedResponse<OtDto>> {
        const normalizedOtNumber = query?.otNumber ? this.normalize(query.otNumber) : null;
        let items = this.ots.filter((item) => {
            if (normalizedOtNumber && this.normalize(item.otNumber) !== normalizedOtNumber) return false;
            if (query?.companyId && item.companyId !== query.companyId) return false;
            if (query?.assetId && item.assetId !== query.assetId) return false;
            if (query?.from && item.workDate < query.from) return false;
            if (query?.to && item.workDate > query.to) return false;
            return true;
        });

        const sort = query?.sort ?? "-workDate";
        items = this.sortOts(items, sort);

        return this.paginate(items, query?.limit, query?.offset);
    }

    async getOtByNumber(otNumber: string): Promise<OtDto | null> {
        const normalized = this.normalize(otNumber);
        return this.ots.find((item) => this.normalize(item.otNumber) === normalized) ?? null;
    }

    async queryCompanies(query?: CompanyQuery): Promise<PagedResponse<CompanyDto>> {
        const search = query?.search ? this.normalize(query.search) : null;
        const items = this.companies.filter((item) => {
            if (!search) return true;
            return this.normalize(item.name).includes(search);
        });
        return this.paginate(items, query?.limit, query?.offset);
    }

    async queryAssets(query?: AssetQuery): Promise<PagedResponse<AssetDto>> {
        const search = query?.search ? this.normalize(query.search) : null;
        const items = this.assets.filter((item) => {
            if (query?.companyId && item.companyId !== query.companyId) return false;
            if (search && !this.normalize(item.name).includes(search)) return false;
            return true;
        });
        return this.paginate(items, query?.limit, query?.offset);
    }

    async countOts(query?: OtCountQuery): Promise<OtCountDto> {
        const groupBy = query?.groupBy ?? "month";
        const filtered = (await this.queryOts({
            companyId: query?.companyId,
            assetId: query?.assetId,
            from: query?.from,
            to: query?.to,
            sort: "-workDate",
            limit: this.ots.length,
            offset: 0
        })).items;

        const buckets = new Map<string, number>();
        for (const ot of filtered) {
            const bucket = groupBy === "year"
                ? ot.workDate.slice(0, 4)
                : groupBy === "month"
                    ? ot.workDate.slice(0, 7)
                    : ot.workDate;
            buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
        }

        return {
            total: filtered.length,
            groupBy,
            buckets: Array.from(buckets.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([bucket, count]) => ({ bucket, count }))
        };
    }

    private paginate<T>(items: T[], limit?: number, offset?: number): PagedResponse<T> {
        const safeLimit = Math.max(1, Math.min(limit ?? 20, 200));
        const safeOffset = Math.max(0, offset ?? 0);
        const paged = items.slice(safeOffset, safeOffset + safeLimit);
        return {
            items: paged,
            total: items.length,
            limit: safeLimit,
            offset: safeOffset,
            hasMore: safeOffset + safeLimit < items.length
        };
    }

    private sortOts(items: OtDto[], sort: NonNullable<OtQuery["sort"]>): OtDto[] {
        const cloned = [...items];
        if (sort === "workDate") return cloned.sort((a, b) => a.workDate.localeCompare(b.workDate));
        if (sort === "-workDate") return cloned.sort((a, b) => b.workDate.localeCompare(a.workDate));
        if (sort === "otNumber") return cloned.sort((a, b) => a.otNumber.localeCompare(b.otNumber));
        return cloned.sort((a, b) => b.otNumber.localeCompare(a.otNumber));
    }

    private normalize(value: string): string {
        return value
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }

    private buildId(prefix: string, value: string): string {
        const slug = value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        return `${prefix}-${slug}`;
    }

    private parseJson<T>(filePath: string): T {
        const raw = readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
        return JSON.parse(raw) as T;
    }

    private resolveDataPath(envPath: string | undefined, defaultSegments: string[]): string {
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
}
