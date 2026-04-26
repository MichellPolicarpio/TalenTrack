# Infrastructure handoff — Resume Builder

Documentation for **migrating or delivering** this application from the current environment (Qualiux) to **Brindley Engineering Corporation** infrastructure (or another Azure tenant/subscription).

## Master document (start here)

| Document | Purpose |
|----------|---------|
| **[azure-platform-guide.md](./azure-platform-guide.md)** | **Single reference:** Entra ID, App Registration, RBAC, Key Vault, SQL, schema deployment, and alignment with the app. |

## Detail and annexes

| Document | Purpose |
|----------|---------|
| [entra-app-registration.md](./entra-app-registration.md) | Operational checklist: create app, secret/cert, Object ID vs Client ID, rotation. |
| [sql-deployment-dba.md](./sql-deployment-dba.md) | Deploy SQL: scripts, DACPAC, order, validation, DBA role with AE. |
| [environment-variables.md](./environment-variables.md) | Required environment variables (no secret values). |
| [azure-sql-always-encrypted.md](./azure-sql-always-encrypted.md) | Always Encrypted, ODBC, column types, `NULL` vs `''`. |
| [azure-key-vault-rbac.md](./azure-key-vault-rbac.md) | Key Vault, CMK, RBAC roles, CLI. |
| [application-runtime.md](./application-runtime.md) | Node.js, Next.js, `msnodesqlv8`, Turbopack. |
| [migration-checklist.md](./migration-checklist.md) | Verification list before cutover or sign-off. |

## Scope

These documents cover **Azure and code-related aspects** encountered during integration with encrypted databases and Key Vault. They do not replace legal agreements, asset inventory, or Brindley internal runbooks; they are a **technical annex** for platform and development teams.

## Maintenance

Update this folder when any of the following change:

- SQL authentication model (SQL login vs Entra ID),
- ODBC Driver version on servers or deployment images,
- Secrets policy (Key Vault, client secret rotation),
- Table schema with Always Encrypted columns.
