import { Pool } from "pg";
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

type OtRow = {
    id: string;
    ot_number: string;
    company_id: string;
    company_name: string;
    asset_id: string;
    asset_name: string;
    work_date: string;
    work_type: string;
    reason: string;
    work_performed: string;
    materials: string[] | null;
    responsible: string;
    location: string;
    observations: string | null;
};

type CompanyRow = {
    id: string;
    name: string;
};

type AssetRow = {
    id: string;
    company_id: string;
    name: string;
};

export class PostgresOtRepository implements OtRepository {
    constructor(private readonly pool: Pool) {}

    async queryOts(query?: OtQuery): Promise<PagedResponse<OtDto>> {
        const where: string[] = [];
        const values: unknown[] = [];

        if (query?.otNumber) {
            values.push(query.otNumber);
            where.push(`LOWER(o.ot_number) = LOWER($${values.length})`);
        }
        if (query?.companyId) {
            values.push(query.companyId);
            where.push(`o.company_id = $${values.length}`);
        }
        if (query?.assetId) {
            values.push(query.assetId);
            where.push(`o.asset_id = $${values.length}`);
        }
        if (query?.from) {
            values.push(query.from);
            where.push(`o.work_date >= $${values.length}`);
        }
        if (query?.to) {
            values.push(query.to);
            where.push(`o.work_date <= $${values.length}`);
        }

        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
        const sortSql = this.toOtOrderBy(query?.sort);
        const limit = this.safeLimit(query?.limit);
        const offset = this.safeOffset(query?.offset);

        const countSql = `
            SELECT COUNT(*)::int AS total
            FROM ots o
            ${whereSql}
        `;

        const totalResult = await this.pool.query<{ total: number }>(countSql, values);
        const total = totalResult.rows[0]?.total ?? 0;

        values.push(limit);
        values.push(offset);
        const rowsSql = `
            SELECT
                o.id,
                o.ot_number,
                o.company_id,
                c.name AS company_name,
                o.asset_id,
                a.name AS asset_name,
                o.work_date::text AS work_date,
                o.work_type,
                o.reason,
                o.work_performed,
                o.materials,
                o.responsible,
                o.location,
                o.observations
            FROM ots o
            JOIN companies c ON c.id = o.company_id
            JOIN assets a ON a.id = o.asset_id
            ${whereSql}
            ORDER BY ${sortSql}
            LIMIT $${values.length - 1}
            OFFSET $${values.length}
        `;
        const rowsResult = await this.pool.query<OtRow>(rowsSql, values);
        const items = rowsResult.rows.map((row) => this.mapOtRow(row));

        return {
            items,
            total,
            limit,
            offset,
            hasMore: offset + limit < total
        };
    }

    async getOtByNumber(otNumber: string): Promise<OtDto | null> {
        const result = await this.queryOts({
            otNumber,
            limit: 1,
            offset: 0
        });
        return result.items[0] ?? null;
    }

    async queryCompanies(query?: CompanyQuery): Promise<PagedResponse<CompanyDto>> {
        const where: string[] = [];
        const values: unknown[] = [];
        if (query?.search) {
            values.push(`%${query.search.toLowerCase()}%`);
            where.push(`LOWER(name) LIKE $${values.length}`);
        }

        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
        const limit = this.safeLimit(query?.limit);
        const offset = this.safeOffset(query?.offset);

        const totalSql = `SELECT COUNT(*)::int AS total FROM companies ${whereSql}`;
        const totalResult = await this.pool.query<{ total: number }>(totalSql, values);
        const total = totalResult.rows[0]?.total ?? 0;

        values.push(limit);
        values.push(offset);
        const rowsSql = `
            SELECT id, name
            FROM companies
            ${whereSql}
            ORDER BY name ASC
            LIMIT $${values.length - 1}
            OFFSET $${values.length}
        `;
        const rowsResult = await this.pool.query<CompanyRow>(rowsSql, values);
        const items = rowsResult.rows.map((row) => ({ id: row.id, name: row.name }));

        return {
            items,
            total,
            limit,
            offset,
            hasMore: offset + limit < total
        };
    }

    async queryAssets(query?: AssetQuery): Promise<PagedResponse<AssetDto>> {
        const where: string[] = [];
        const values: unknown[] = [];

        if (query?.companyId) {
            values.push(query.companyId);
            where.push(`company_id = $${values.length}`);
        }
        if (query?.search) {
            values.push(`%${query.search.toLowerCase()}%`);
            where.push(`LOWER(name) LIKE $${values.length}`);
        }

        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
        const limit = this.safeLimit(query?.limit);
        const offset = this.safeOffset(query?.offset);

        const totalSql = `SELECT COUNT(*)::int AS total FROM assets ${whereSql}`;
        const totalResult = await this.pool.query<{ total: number }>(totalSql, values);
        const total = totalResult.rows[0]?.total ?? 0;

        values.push(limit);
        values.push(offset);
        const rowsSql = `
            SELECT id, company_id, name
            FROM assets
            ${whereSql}
            ORDER BY name ASC
            LIMIT $${values.length - 1}
            OFFSET $${values.length}
        `;
        const rowsResult = await this.pool.query<AssetRow>(rowsSql, values);
        const items = rowsResult.rows.map((row) => ({
            id: row.id,
            companyId: row.company_id,
            name: row.name
        }));

        return {
            items,
            total,
            limit,
            offset,
            hasMore: offset + limit < total
        };
    }

    async countOts(query?: OtCountQuery): Promise<OtCountDto> {
        const groupBy = query?.groupBy ?? "month";
        const bucketFormat =
            groupBy === "year"
                ? "YYYY"
                : groupBy === "month"
                    ? "YYYY-MM"
                    : "YYYY-MM-DD";

        const where: string[] = [];
        const values: unknown[] = [];

        if (query?.companyId) {
            values.push(query.companyId);
            where.push(`o.company_id = $${values.length}`);
        }
        if (query?.assetId) {
            values.push(query.assetId);
            where.push(`o.asset_id = $${values.length}`);
        }
        if (query?.from) {
            values.push(query.from);
            where.push(`o.work_date >= $${values.length}`);
        }
        if (query?.to) {
            values.push(query.to);
            where.push(`o.work_date <= $${values.length}`);
        }

        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
        const totalSql = `SELECT COUNT(*)::int AS total FROM ots o ${whereSql}`;
        const totalResult = await this.pool.query<{ total: number }>(totalSql, values);
        const total = totalResult.rows[0]?.total ?? 0;

        const bucketsSql = `
            SELECT
                TO_CHAR(DATE_TRUNC('${groupBy}', o.work_date), '${bucketFormat}') AS bucket,
                COUNT(*)::int AS count
            FROM ots o
            ${whereSql}
            GROUP BY 1
            ORDER BY 1 ASC
        `;
        const bucketsResult = await this.pool.query<{ bucket: string; count: number }>(bucketsSql, values);

        return {
            total,
            groupBy,
            buckets: bucketsResult.rows.map((row) => ({ bucket: row.bucket, count: row.count }))
        };
    }

    async ping(): Promise<void> {
        await this.pool.query("SELECT 1");
    }

    private mapOtRow(row: OtRow): OtDto {
        return {
            id: row.id,
            otNumber: row.ot_number,
            companyId: row.company_id,
            companyName: row.company_name,
            assetId: row.asset_id,
            assetName: row.asset_name,
            workDate: row.work_date,
            workType: row.work_type,
            reason: row.reason,
            workPerformed: row.work_performed,
            materials: row.materials ?? [],
            responsible: row.responsible,
            location: row.location,
            observations: row.observations
        };
    }

    private toOtOrderBy(sort: OtQuery["sort"] | undefined): string {
        if (sort === "workDate") return "o.work_date ASC";
        if (sort === "-workDate" || !sort) return "o.work_date DESC";
        if (sort === "otNumber") return "o.ot_number ASC";
        return "o.ot_number DESC";
    }

    private safeLimit(limit: number | undefined): number {
        return Math.max(1, Math.min(limit ?? 20, 200));
    }

    private safeOffset(offset: number | undefined): number {
        return Math.max(0, offset ?? 0);
    }
}
