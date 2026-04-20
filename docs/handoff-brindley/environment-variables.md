# Environment variables

**Do not** commit real values. Use Azure Key Vault, hosting provider variables, or local `.env` for development only.

## SQL Server (Azure)

| Variable | Description |
|----------|-------------|
| `AZURE_SQL_SERVER` | Server FQDN (e.g. `my-server.database.windows.net`). |
| `AZURE_SQL_DATABASE` | Database name. |
| `AZURE_SQL_PORT` | Optional; default is typically `1433`. |
| `AZURE_SQL_TRUST_SERVER_CERTIFICATE` | `true` / `false` per certificate policy (dev vs production). |

## SQL authentication mode

| Variable | Typical values | Notes |
|----------|----------------|--------|
| `AZURE_SQL_AUTH_MODE` | `sql` or (omit / other) for Entra SP | This project has used `sql` with SQL username/password. |

If `AZURE_SQL_AUTH_MODE=sql` (or equivalent in code):

| Variable | Description |
|----------|-------------|
| `AZURE_SQL_USER` / `SQL_USER` | SQL login. |
| `AZURE_SQL_PASSWORD` / `SQL_PASSWORD` | Password (secret). |

If using **Entra ID (service principal)** to connect to SQL:

| Variable | Description |
|----------|-------------|
| `AZURE_SQL_AAD_CLIENT_ID` | Optional; otherwise `AZURE_CLIENT_ID` may be used. |
| `AZURE_SQL_AAD_CLIENT_SECRET` | Optional; otherwise `AZURE_CLIENT_SECRET`. |
| `AZURE_SQL_AAD_TENANT_ID` | Optional; otherwise `AZURE_TENANT_ID`. |

## Key Vault (Always Encrypted — CMK access)

The application needs credentials for a **Microsoft Entra ID application** (client credentials) with data permissions on the Key Vault that hosts column master keys (CMK).

| Variable | Description |
|----------|-------------|
| `AZURE_CLIENT_ID` | Application (client) ID. |
| `AZURE_CLIENT_SECRET` | Client secret (rotate per policy). |
| `AZURE_TENANT_ID` | Directory (tenant) ID. |

These are typically used so the **ODBC Driver** can resolve `ColumnEncryption=Enabled` against Key Vault (`KeyStoreAuthentication=KeyVaultClientSecret`, etc., per `lib/db.ts`).

## Other

Check the repository `.env.example` (if present) or `lib/db.ts` for any additional variables.
