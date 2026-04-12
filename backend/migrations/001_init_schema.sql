BEGIN;

CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS ots (
    id TEXT PRIMARY KEY,
    ot_number TEXT NOT NULL UNIQUE,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    work_date DATE NOT NULL,
    work_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    work_performed TEXT NOT NULL,
    materials TEXT[] NOT NULL DEFAULT '{}',
    responsible TEXT NOT NULL,
    location TEXT NOT NULL,
    observations TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_ots_work_date ON ots (work_date DESC);
CREATE INDEX IF NOT EXISTS idx_ots_company_date ON ots (company_id, work_date DESC);
CREATE INDEX IF NOT EXISTS idx_ots_asset_date ON ots (asset_id, work_date DESC);
CREATE INDEX IF NOT EXISTS idx_ots_ot_number_lower ON ots (LOWER(ot_number));
CREATE INDEX IF NOT EXISTS idx_companies_name_lower ON companies (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_assets_name_lower ON assets (LOWER(name));

COMMIT;
