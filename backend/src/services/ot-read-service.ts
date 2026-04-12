import {
    AssetQuery,
    CompanyQuery,
    OtCountQuery,
    OtQuery
} from "../contracts/ot-contracts";
import { OtRepository } from "../repositories/ot-repository";

export class OtReadService {
    constructor(private readonly repository: OtRepository) {}

    async queryOts(query?: OtQuery) {
        return await this.repository.queryOts(query);
    }

    async queryCompanies(query?: CompanyQuery) {
        return await this.repository.queryCompanies(query);
    }

    async queryAssets(query?: AssetQuery) {
        return await this.repository.queryAssets(query);
    }

    async countOts(query?: OtCountQuery) {
        return await this.repository.countOts(query);
    }
}
