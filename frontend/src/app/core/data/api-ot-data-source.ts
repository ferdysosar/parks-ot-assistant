import { Inject, Injectable } from '@angular/core';
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
import { DATA_SOURCE_CONFIG, DataSourceConfig } from './data-source-config';
import { LocalJsonOtDataSource } from './local-json-ot-data-source';

@Injectable({
    providedIn: 'root'
})
export class ApiOtDataSource implements OtDataSource {
    private companies: CompanyDto[];
    private assets: AssetDto[];
    private ots: OtDto[];
    private initialized = false;
    private initializePromise: Promise<void> | null = null;

    constructor(
        @Inject(DATA_SOURCE_CONFIG) private readonly config: DataSourceConfig,
        private readonly localDataSource: LocalJsonOtDataSource
    ) {
        const fallbackSnapshot = this.localDataSource.getChatSnapshot();
        this.companies = fallbackSnapshot.companies;
        this.assets = fallbackSnapshot.assets;
        this.ots = fallbackSnapshot.ots;
    }

    initialize(): Promise<void> {
        if (this.initialized) return Promise.resolve();
        if (this.initializePromise) return this.initializePromise;

        this.initializePromise = this.hydrateFromApi()
            .then(() => {
                this.initialized = true;
            })
            .catch((error) => {
                if (!this.config.fallbackToLocalOnApiError) {
                    throw error;
                }
                console.warn('[ApiOtDataSource] API no disponible. Se mantiene fallback local.', error);
                this.initialized = true;
            });

        return this.initializePromise;
    }

    queryOts(query?: OtQuery): PagedResponse<OtDto> {
        this.ensureInitializationStarted();
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
        this.ensureInitializationStarted();
        const normalized = this.normalize(otNumber);
        return this.ots.find((item) => this.normalize(item.otNumber) === normalized) ?? null;
    }

    queryCompanies(query?: CompanyQuery): PagedResponse<CompanyDto> {
        this.ensureInitializationStarted();
        const search = query?.search ? this.normalize(query.search) : null;
        const items = this.companies.filter((item) => {
            if (!search) return true;
            return this.normalize(item.name).includes(search);
        });
        return this.paginate(items, query?.limit, query?.offset);
    }

    queryAssets(query?: AssetQuery): PagedResponse<AssetDto> {
        this.ensureInitializationStarted();
        const search = query?.search ? this.normalize(query.search) : null;
        const items = this.assets.filter((item) => {
            if (query?.companyId && item.companyId !== query.companyId) return false;
            if (search && !this.normalize(item.name).includes(search)) return false;
            return true;
        });
        return this.paginate(items, query?.limit, query?.offset);
    }

    countOts(query?: OtCountQuery): OtCountDto {
        this.ensureInitializationStarted();
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

        return {
            total: filtered.length,
            groupBy,
            buckets: Array.from(buckets.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([bucket, count]) => ({ bucket, count }))
        };
    }

    getChatSnapshot(): { ots: OtDto[]; companies: CompanyDto[]; assets: AssetDto[] } {
        this.ensureInitializationStarted();
        return {
            ots: [...this.ots],
            companies: [...this.companies],
            assets: [...this.assets]
        };
    }

    private async hydrateFromApi(): Promise<void> {
        const [companies, assets, ots] = await Promise.all([
            this.fetchAllPaged<CompanyDto>('companies'),
            this.fetchAllPaged<AssetDto>('assets'),
            this.fetchAllPaged<OtDto>('ots')
        ]);

        if (companies.length) this.companies = companies;
        if (assets.length) this.assets = assets;
        if (ots.length) this.ots = ots;
    }

    private async fetchAllPaged<T>(resource: string): Promise<T[]> {
        const pageSize = 200;
        let offset = 0;
        const all: T[] = [];

        while (true) {
            const params = new URLSearchParams({
                limit: String(pageSize),
                offset: String(offset)
            });
            const response = await this.fetchJson<PagedResponse<T>>(`${resource}?${params.toString()}`);
            all.push(...response.items);
            if (!response.hasMore) break;
            offset += response.limit;
        }

        return all;
    }

    private async fetchJson<T>(path: string): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

        try {
            const response = await fetch(`${this.config.apiBaseUrl.replace(/\/$/, '')}/${path}`, {
                method: 'GET',
                signal: controller.signal
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} al consultar ${path}`);
            }
            return (await response.json()) as T;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private ensureInitializationStarted(): void {
        if (!this.initialized && !this.initializePromise) {
            void this.initialize();
        }
    }

    private sortOts(items: OtDto[], sort: NonNullable<OtQuery['sort']>): OtDto[] {
        const cloned = [...items];
        if (sort === 'workDate') return cloned.sort((a, b) => a.workDate.localeCompare(b.workDate));
        if (sort === '-workDate') return cloned.sort((a, b) => b.workDate.localeCompare(a.workDate));
        if (sort === 'otNumber') return cloned.sort((a, b) => a.otNumber.localeCompare(b.otNumber));
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
}
