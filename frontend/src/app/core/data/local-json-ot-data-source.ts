import { Injectable } from '@angular/core';
import otsData from '../../../assets/ots-demo.json';
import companiesAssetsData from '../../../data/empresas-activos.json';
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
} from './ot-contracts';
import { OtDataSource } from './ot-data-source';

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

@Injectable({
    providedIn: 'root'
})
export class LocalJsonOtDataSource implements OtDataSource {
    private readonly companies: CompanyDto[];
    private readonly assets: AssetDto[];
    private readonly ots: OtDto[];

    constructor() {
        const demoOts = (otsData as DemoOt[]) ?? [];
        const demoCatalog = (companiesAssetsData as DemoCompanyAssets[]) ?? [];

        const companyIdByName = new Map<string, string>();
        const companies: CompanyDto[] = [];

        const registerCompany = (name: string): string => {
            const normalized = this.normalize(name);
            const existing = companyIdByName.get(normalized);
            if (existing) return existing;

            const id = this.buildId('company', normalized);
            companyIdByName.set(normalized, id);
            companies.push({ id, name });
            return id;
        };

        for (const item of demoCatalog) {
            registerCompany(item.empresa);
        }
        for (const ot of demoOts) {
            registerCompany(ot.empresa);
        }

        const assetIdByCompound = new Map<string, string>();
        const assets: AssetDto[] = [];

        const registerAsset = (companyName: string, assetName: string): string => {
            const companyId = registerCompany(companyName);
            const compound = `${this.normalize(companyName)}::${this.normalize(assetName)}`;
            const existing = assetIdByCompound.get(compound);
            if (existing) return existing;

            const id = this.buildId('asset', `${this.normalize(companyName)}-${this.normalize(assetName)}`);
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

        const ots: OtDto[] = demoOts.map((ot) => {
            const companyId = registerCompany(ot.empresa);
            const assetId = registerAsset(ot.empresa, ot.activo);
            return {
                id: this.buildId('ot', this.normalize(ot.ot_numero)),
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
            };
        });

        this.companies = companies.sort((a, b) => a.name.localeCompare(b.name));
        this.assets = assets.sort((a, b) => a.name.localeCompare(b.name));
        this.ots = ots;
    }

    queryOts(query?: OtQuery): PagedResponse<OtDto> {
        const normalizedOtNumber = query?.otNumber ? this.normalize(query.otNumber) : null;
        let items = this.ots.filter((item) => {
            if (normalizedOtNumber && this.normalize(item.otNumber) !== normalizedOtNumber) return false;
            if (query?.companyId && item.companyId !== query.companyId) return false;
            if (query?.assetId && item.assetId !== query.assetId) return false;
            if (query?.from && item.workDate < query.from) return false;
            if (query?.to && item.workDate > query.to) return false;
            return true;
        });

        const sort = query?.sort ?? '-workDate';
        items = this.sortOts(items, sort);

        return this.paginate(items, query?.limit, query?.offset);
    }

    getOtByNumber(otNumber: string): OtDto | null {
        const normalized = this.normalize(otNumber);
        return this.ots.find((item) => this.normalize(item.otNumber) === normalized) ?? null;
    }

    queryCompanies(query?: CompanyQuery): PagedResponse<CompanyDto> {
        const search = query?.search ? this.normalize(query.search) : null;
        const items = this.companies.filter((item) => {
            if (!search) return true;
            return this.normalize(item.name).includes(search);
        });
        return this.paginate(items, query?.limit, query?.offset);
    }

    queryAssets(query?: AssetQuery): PagedResponse<AssetDto> {
        const search = query?.search ? this.normalize(query.search) : null;
        const items = this.assets.filter((item) => {
            if (query?.companyId && item.companyId !== query.companyId) return false;
            if (search && !this.normalize(item.name).includes(search)) return false;
            return true;
        });
        return this.paginate(items, query?.limit, query?.offset);
    }

    countOts(query?: OtCountQuery): OtCountDto {
        const groupBy = query?.groupBy ?? 'month';
        const filtered = this.queryOts({
            companyId: query?.companyId,
            assetId: query?.assetId,
            from: query?.from,
            to: query?.to,
            sort: '-workDate',
            limit: this.ots.length,
            offset: 0
        }).items;

        const buckets = new Map<string, number>();
        for (const ot of filtered) {
            const bucket = groupBy === 'year'
                ? ot.workDate.slice(0, 4)
                : groupBy === 'month'
                    ? ot.workDate.slice(0, 7)
                    : ot.workDate;
            buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
        }

        const bucketItems = Array.from(buckets.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([bucket, count]) => ({ bucket, count }));

        return {
            total: filtered.length,
            groupBy,
            buckets: bucketItems
        };
    }

    getChatSnapshot(): { ots: OtDto[]; companies: CompanyDto[]; assets: AssetDto[] } {
        return {
            ots: [...this.ots],
            companies: [...this.companies],
            assets: [...this.assets]
        };
    }

    private sortOts(items: OtDto[], sort: NonNullable<OtQuery['sort']>): OtDto[] {
        const cloned = [...items];
        if (sort === 'workDate') {
            return cloned.sort((a, b) => a.workDate.localeCompare(b.workDate));
        }
        if (sort === '-workDate') {
            return cloned.sort((a, b) => b.workDate.localeCompare(a.workDate));
        }
        if (sort === 'otNumber') {
            return cloned.sort((a, b) => a.otNumber.localeCompare(b.otNumber));
        }
        return cloned.sort((a, b) => b.otNumber.localeCompare(a.otNumber));
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

    private normalize(value: string): string {
        return value
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    private buildId(prefix: string, value: string): string {
        const slug = value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        return `${prefix}-${slug}`;
    }
}
