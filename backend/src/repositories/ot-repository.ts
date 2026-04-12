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

export interface OtRepository {
    queryOts(query?: OtQuery): Promise<PagedResponse<OtDto>>;
    getOtByNumber(otNumber: string): Promise<OtDto | null>;
    queryCompanies(query?: CompanyQuery): Promise<PagedResponse<CompanyDto>>;
    queryAssets(query?: AssetQuery): Promise<PagedResponse<AssetDto>>;
    countOts(query?: OtCountQuery): Promise<OtCountDto>;
}
