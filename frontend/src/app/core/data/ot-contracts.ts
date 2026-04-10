export interface OtDto {
    id: string;
    otNumber: string;
    companyId: string;
    companyName: string;
    assetId: string;
    assetName: string;
    workDate: string;
    workType: string;
    reason: string;
    workPerformed: string;
    materials: string[];
    responsible: string;
    location: string;
    observations: string | null;
}

export interface CompanyDto {
    id: string;
    name: string;
}

export interface AssetDto {
    id: string;
    companyId: string;
    name: string;
}

export interface OtCountBucketDto {
    bucket: string;
    count: number;
}

export interface OtCountDto {
    total: number;
    groupBy: 'day' | 'month' | 'year';
    buckets: OtCountBucketDto[];
}

export interface PagedResponse<T> {
    items: T[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}

export interface OtQuery {
    otNumber?: string;
    companyId?: string;
    assetId?: string;
    from?: string;
    to?: string;
    sort?: 'workDate' | '-workDate' | 'otNumber' | '-otNumber';
    limit?: number;
    offset?: number;
}

export interface CompanyQuery {
    search?: string;
    limit?: number;
    offset?: number;
}

export interface AssetQuery {
    companyId?: string;
    search?: string;
    limit?: number;
    offset?: number;
}

export interface OtCountQuery {
    companyId?: string;
    assetId?: string;
    from?: string;
    to?: string;
    groupBy?: 'day' | 'month' | 'year';
}
