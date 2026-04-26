# Application runtime (Node / Next.js / SQL)

## Relevant stack

- **Next.js** (App Router, Server Actions).
- **`mssql`** with **`mssql/msnodesqlv8`** (not the default `tedious` transport) for **Always Encrypted** writes via ODBC.
- Native module: **`msnodesqlv8`** (includes `.node` binary).

## Next.js and native modules

Turbopack / the server bundler must not try to bundle the native binary. `next.config.ts` must include:

```ts
serverExternalPackages: ["msnodesqlv8"];
```

Without this, errors like *could not resolve* `sqlserver.node` may appear.

## Node.js

Use a **supported** `msnodesqlv8` version for the deployment platform (Windows/Linux). After a major Node upgrade, revalidate `npm install` and SQL connectivity tests.

## Why `tedious` alone was not used for AE writes

In practice, **`tedious` (default `mssql` driver)** did not reliably complete parameter encryption for writes to AE columns in this scenario; the stack moved to **`msnodesqlv8`** after a real `UPDATE` against encrypted columns succeeded.

Any future attempt to “go back to tedious” must include **integration tests** against a database with AE enabled.

## Errors seen (quick reference)

| Symptom | Likely cause |
|---------|----------------|
| `ForbiddenByRbac` / `keys/read` | Missing Key Vault data RBAC for the service principal. |
| `Operand type clash` in `sp_describe_parameter_encryption` | Parameter size/type does not match column (e.g. `max` vs `500`). |
| `char(1)` vs `nvarchar(n)` in AE | `NULL` or ODBC binding on optional parameters; see `''` convention in profile repository. |
| `sqlserver.node` not resolving | Missing `serverExternalPackages` or broken `msnodesqlv8` install. |

## Logs and deprecations

Node warnings (e.g. `url.parse`) may appear; they are independent of the SQL flow; plan dependency upgrades separately.
