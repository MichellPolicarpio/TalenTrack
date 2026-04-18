# Azure SQL and Always Encrypted

## Context

If sensitive columns use **Always Encrypted** (e.g. `RANDOMIZED` with `AEAD_AES_256_CBC_HMAC_SHA_256`), the **client** must:

1. Obtain encryption parameter metadata (e.g. via `sp_describe_parameter_encryption`).
2. Access **Key Vault** for key operations (unwrap) per the CMK configured in the database.
3. Send values with the type and flow the driver expects.

This project uses **`mssql` with `mssql/msnodesqlv8`**, which uses **ODBC Driver for SQL Server** with `ColumnEncryption=Enabled` in the connection string (see `lib/db.ts`).

## Type alignment (parameter ↔ column)

Declared types in code (`sql.NVarChar(n)`, `sql.NVarChar(sql.MAX)`, etc.) must **match** the real schema. One issue fixed in this project:

- `HomeAddress` in DB: encrypted `nvarchar(500)`.
- Previous error: parameter as `nvarchar(max)` → failure in `sp_describe_parameter_encryption` (*operand type clash*).

**For Brindley:** after any schema migration, validate `INFORMATION_SCHEMA.COLUMNS` (length and type) and align `lib/repositories/resume.repository.ts` (and any other repository writing encrypted columns).

## Optional values: `NULL` vs empty string (`''`)

With **msnodesqlv8 + ODBC**, binding `NULL` on optional `nvarchar` parameters in queries wrapped by the driver (`DECLARE` / `SET @p = ?`) can cause the engine to describe the parameter as **`char(1)`** in the Always Encrypted flow, conflicting with encrypted **`nvarchar(n)`** columns.

**Convention in this project** (resume profile): for optional encrypted text columns, send **`''`** instead of **`null`** when there is “no value”, keeping Unicode string type.

- Impact: reads may show `''` instead of SQL `NULL`; the presentation layer can normalize to empty display.
- Document this decision so it is not “fixed” later by sending `null` without retesting AE.

## ODBC Driver

The current connection string assumes a driver installed on the host, for example:

`Driver={ODBC Driver 17 for SQL Server}`

**Brindley** should:

- Install the same driver family (17 or 18) on **all** machines or containers running the app.
- Validate that the version supports Always Encrypted + Key Vault per Microsoft documentation for that version.

## SQL auth vs Entra ID

`sql` mode avoids `Authentication=ActiveDirectoryServicePrincipal` dependencies on ODBC in environments with older drivers. If Brindley standardizes on **Entra-only** to SQL, you will need to:

- Test connection and AE writes with the target driver.
- Adjust `lib/db.ts` (`buildConnectionString`) and SQL permissions (`CREATE USER ... FROM EXTERNAL PROVIDER`, roles).
