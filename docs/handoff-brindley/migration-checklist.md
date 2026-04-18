# Checklist — migration / delivery to Brindley

Use before closing infrastructure handoff.

**Expanded guide:** [azure-platform-guide.md](./azure-platform-guide.md) · App Registration: [entra-app-registration.md](./entra-app-registration.md) · SQL/DBA: [sql-deployment-dba.md](./sql-deployment-dba.md)

## Microsoft Entra ID — App Registration (Key Vault / AE)

- [ ] App registration created in the **correct tenant** (single-tenant if applicable).
- [ ] **Application (client) ID** and **Directory (tenant) ID** recorded.
- [ ] **Object ID** of **Enterprise application** (service principal) recorded for IAM.
- [ ] Client secret (or certificate) created; value in secret store; **expiration** on calendar.
- [ ] **Secret rotation** process defined (owner, change window).

## Azure — identity and secrets (runtime)

- [ ] Brindley tenant and subscription confirmed.
- [ ] Variables `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID` set in hosting (not in repo).
- [ ] If **Managed Identity** is adopted later: plan refactor of `lib/db.ts` and removal of client secret (not in current documented state).

## Key Vault

- [ ] Target Key Vault exists in the correct subscription.
- [ ] Permission model: **RBAC** (this project assumes classic Access Policies are not the primary path).
- [ ] **`Key Vault Crypto User`** (or approved equivalent) assigned to the app **service principal**, scope = the vault.
- [ ] Verified with a real operation (key read / AE flow) after IAM propagation.

## Azure SQL

- [ ] Firewall / Private Endpoint / VNet per Brindley design.
- [ ] **Microsoft Entra admin** on SQL Server configured if using Entra auth to the database.
- [ ] SQL login **or** `CREATE USER ... FROM EXTERNAL PROVIDER` per chosen mode (`AZURE_SQL_AUTH_MODE`).
- [ ] DB roles: at least `db_datareader` + `db_datawriter` (adjust to Brindley policy).
- [ ] **Schema deployment** executed (scripts, DACPAC, or corporate tool) — see [sql-deployment-dba.md](./sql-deployment-dba.md).
- [ ] Always Encrypted: CMK/CEK and columns match environment; write test from app.
- [ ] `INFORMATION_SCHEMA.COLUMNS` reviewed against `lib/repositories/*.ts`.
- [ ] Test: **save profile** and at least one other write touching encrypted columns (if applicable).

## Application runtime

- [ ] **ODBC Driver 17 or 18** installed on host (VM, App Service with extension, container base, etc.).
- [ ] Node.js version compatible with `msnodesqlv8`.
- [ ] `npm ci` / `npm install` in Brindley pipeline; deployed artifact consistent with lockfile.
- [ ] `next.config.ts` includes `serverExternalPackages: ["msnodesqlv8"]`.

## Minimum functional validation

- [ ] Login / session.
- [ ] Load `/dashboard/resume`.
- [ ] Save personal data (profile).
- [ ] Logs: no routine `EREQUEST` 8180/206/33514 related to AE on normal operations.

## Recommended business deliverables

- [ ] List of URLs and environments (dev / staging / prod).
- [ ] Secret owner and rotation procedure.
- [ ] Support contact for Azure SQL / Key Vault at Brindley.
