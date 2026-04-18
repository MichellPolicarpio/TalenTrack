# SQL Server: schema deployment, DBA, and Always Encrypted

Guide for teams that **apply** or **migrate** the database without relying only on Node code.

## 1. What “building” SQL means here

There is no single “build” like TypeScript. In practice it is:

1. **Materialize schema** (tables, indexes, views, etc.) on the target server.
2. **Configure security** (logins, users, roles).
3. If applicable: **Always Encrypted** (CMK in Key Vault, CEK in database, encrypted columns).
4. **Validate** that the application can read/write with the same types the code expects.

## 2. Typical deliverables

| Artifact | Use |
|----------|-----|
| Versioned `.sql` scripts | Manual or CI; Flyway/Liquibase. |
| **SSDT** project + **DACPAC** | Publish with SqlPackage / Azure DevOps. |
| Post-deploy **INFORMATION_SCHEMA** report | Audit and alignment with repositories. |

**Important:** do not version **production PII dumps** in git.

## 3. Recommended execution order (scripts)

1. Create **database** (if missing) and agreed collation.
2. **Schema** (`CREATE TABLE`, etc.).
3. **Dependent objects** (FKs, indexes).
4. Minimum **reference** data (catalogs).
5. **Application users** and **roles** (sometimes a DBA-only separate script).
6. Connectivity tests from the app network.

## 4. Always Encrypted — responsibilities

| Role | Typical task |
|------|--------------|
| **DBA / security** | Define CMK (Key Vault), CEK, algorithm, which columns are AE. |
| **Development** | Align `sql.NVarChar(n)` and conventions (`''` vs `null`) in code. |
| **Platform** | ODBC installed, environment variables, Key Vault RBAC on service principal. |

**Creating encrypted columns** or **rotating CEK** is usually done with:

- **SSMS** wizard, or  
- **PowerShell** SqlServer module, or  
- Brindley internal procedures.

Do not copy destructive scripts here; follow the client standard.

## 5. Validation after deployment

### 5.1 Schema aligned with code

```sql
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dbo'
  AND TABLE_NAME IN ('ResumeProfiles', 'Resumes' /* extend per repo */)
ORDER BY TABLE_NAME, ORDINAL_POSITION;
```

Compare with:

- `lib/repositories/resume.repository.ts` (profile),
- other files under `lib/repositories/`.

### 5.2 AE write test

- From the **app:** save profile.
- Optional: ODBC/SQL script in a controlled environment (avoid unnecessary real data).

### 5.3 Minimum permissions

- The app account should not be `db_owner` in production unless justified.
- Check whether `db_datareader` + `db_datawriter` + `EXECUTE` on specific procedures is enough.

## 6. Qualiux → Brindley migration

1. Export **schema only** (or use repo as source of truth).
2. Recreate **CMK/CEK** on Brindley vault and server (do not reuse secrets across tenants without a plan).
3. **Re-encrypt** or **migrate data** per approved method (secure export, DMS, etc.).
4. Point the app at the **new** `AZURE_SQL_SERVER` and ODBC/Key Vault settings.
5. Full smoke test (login, resume, save).

## 7. Cross-references

- Types and `NULL` vs `''`: [azure-sql-always-encrypted.md](./azure-sql-always-encrypted.md)  
- Variables: [environment-variables.md](./environment-variables.md)  
- Master guide: [azure-platform-guide.md](./azure-platform-guide.md)  
