# Azure platform guide — App Registration, Entra ID, RBAC, SQL, and operations

Single reference for **standing up or moving** Resume Builder to a new tenant/subscription (e.g. Brindley Engineering Corporation). It complements the other files in this folder.

---

## 1. Microsoft Entra ID (Azure AD) — overview

| Concept | What it is |
|---------|------------|
| **Tenant** | Entra ID instance (`*.onmicrosoft.com` + custom domains). All identities and permissions live **inside a tenant**. |
| **App registration** | Definition of an application (your API or a “daemon” using client credentials). Produces an **Application (client) ID**. |
| **Enterprise application** | The app’s service instance **in the tenant**; hosts the **service principal** with an **Object ID** different from the client ID. |
| **Service principal** | Identity that receives **RBAC role assignments** on Azure resources (Key Vault, etc.). |

**Practical rule:** Key Vault IAM is usually assigned to the principal by **Object ID** of the enterprise application, not the client ID alone.

---

## 2. App Registration (application for Key Vault / Always Encrypted)

This app is **not** necessarily the user signing in to the browser with B2C/NextAuth (unless you reuse it; the usual pattern is a **dedicated** server secrets app: “Resume Builder — SQL AE Key Vault”).

### 2.1 Create the registration

1. **Entra ID** → **App registrations** → **New registration**.
2. **Name:** a clear name (e.g. `resume-builder-kv-ae-prod`).
3. **Supported account types:** per Brindley policy (often *Single tenant*).
4. **Redirect URI:** leave empty if you **only** use *client credentials* to Key Vault (no interactive login for this app).

### 2.2 Credentials — Client secret or certificate

| Option | Pros | Notes |
|--------|------|--------|
| **Client secret** | Fast to set up | Expires; document rotation and who renews it. |
| **Certificate** | Often preferred in enterprises | Upload public cert to the app; app signs with private key (Key Vault, HSM, etc.). |

Typical steps (secret):

1. **Certificates & secrets** → **New client secret**.
2. Copy the **Value** once → store in **Key Vault** / secret pipeline / secure hosting variable.
3. Map to app variables: `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID` (see `environment-variables.md`).

### 2.3 API permissions (Microsoft Graph)

For **only** accessing Key Vault with the flow the **ODBC Driver** uses (`KeyVaultClientSecret`), you **usually** do not need to add delegated Graph permissions in the portal for “Key Vault” (vault data access is often **RBAC on the ARM resource**, not a Graph scope).

If the app later uses the **Azure SDK** with other flows, review current Microsoft documentation. Keep this guide aligned with `lib/db.ts`.

### 2.4 Identifiers to record

| Field | Where | Typical use |
|-------|--------|-------------|
| Application (client) ID | App registration Overview | `AZURE_CLIENT_ID`, ODBC `KeyStorePrincipalId` |
| Directory (tenant) ID | Tenant Overview | `AZURE_TENANT_ID` |
| **Enterprise application** Object ID | Enterprise applications → the app → Properties | RBAC assignments, `az role assignment` with `--assignee-object-id` |
| Client secret | Certificates & secrets | `AZURE_CLIENT_SECRET`, ODBC `KeyStoreSecret` |

---

## 3. RBAC in Azure (resources)

### 3.1 Scope levels

From **broadest** to **narrowest**:

- Subscription  
- Resource group  
- Individual resource (e.g. `Microsoft.KeyVault/vaults/name`)

**Least privilege:** assign **Key Vault Crypto User** (or security-approved role) **only** on the Key Vault used for Always Encrypted, not the whole subscription.

### 3.2 Key Vault (RBAC model)

1. Key Vault → **Access control (IAM)** → **Add role assignment**.
2. Role: **`Key Vault Crypto User`** (recommended for this project) or as defined by security.
3. Members: the **service principal** (Object ID or search by app name).
4. Wait for **propagation** (several minutes).

If the portal **does not list** the role or member search fails:

- Use **Azure Cloud Shell** and `az role assignment create` (see `azure-key-vault-rbac.md`).
- Confirm the assigner has `Owner`, `User Access Administrator`, or `Key Vault Data Access Administrator` on that scope.

### 3.3 Typical errors

| Message | Action |
|---------|--------|
| `ForbiddenByRbac`, `keys/read`, `Assignment: (not found)` | Missing **data** role on the correct **service principal** (Object ID). |
| You only see roles like “Release User” | Your account has an **ABAC condition** limiting assignable roles; use an admin or CLI. |

### 3.4 Other assignments (optional)

- If the app reads **secrets** from the same vault (not the minimal AE+CMK-on-keys case), consider **`Key Vault Secrets User`** on that vault.
- **Do not** mix with classic **Access policies** if the vault is purely **“Azure role-based access control”**.

---

## 4. Azure SQL — identity, firewall, and users

### 4.1 Authentication to SQL (two patterns)

| Pattern | In this codebase | Requirements |
|---------|------------------|----------------|
| **SQL authentication** | Supported (`AZURE_SQL_AUTH_MODE=sql`, username/password) | SQL login on server; database user with roles. |
| **Entra ID (service principal)** | Supported in `lib/db.ts` (ODBC `ActiveDirectoryServicePrincipal`) | Entra admin on SQL Server; `CREATE USER ... FROM EXTERNAL PROVIDER`; DB roles. |

Pick **one** per environment and document it; accidental mixing causes incidents.

### 4.2 Firewall / connectivity

- Firewall rules on **SQL Server** (hosting egress IPs, VPN, etc.).
- Alternatives: **Private Endpoint**, **VNet integration** (App Service), etc.
- Test from the **same network class** production will use.

### 4.3 Database user for the application

**If SQL auth:**

1. Create **login** on server (`CREATE LOGIN ... WITH PASSWORD = ...`).
2. In database: `CREATE USER ... FOR LOGIN ...`.
3. Reasonable minimum roles: `db_datareader`, `db_datawriter` (adjust for `EXECUTE AS` or restricted schemas).

**If Entra ID (app registration):**

1. In Azure: **SQL Server** → **Microsoft Entra admin** configured.
2. In database (connected as admin):

```sql
CREATE USER [<app-name>] FROM EXTERNAL PROVIDER;
-- or by client id, per team convention:
-- CREATE USER [resume-builder-kv-ae-prod] FROM EXTERNAL PROVIDER;

ALTER ROLE db_datareader ADD MEMBER [<user>];
ALTER ROLE db_datawriter ADD MEMBER [<user>];
```

Exact names: see Microsoft docs for the identifier your server uses (display name vs application ID).

### 4.4 Always Encrypted (reminder)

- **CMK/CEK** are managed in the database; the **client** needs Key Vault + ODBC with `ColumnEncryption=Enabled`.
- Any schema change on encrypted columns should include **write tests** from the app.

---

## 5. Deploying SQL (schema and data)

“Applying SQL” at Brindley can be done several ways; pick **one** and document the pipeline.

### 5.1 `.sql` scripts (suggested order)

1. Create database (if needed) and agreed **collation**.
2. Tables **without** AE or with AE planned (sometimes AE columns are added with specific tooling).
3. Indexes, FKs, constraints.
4. Seed / lookup data.
5. Users/roles (or separate DBA-only script).

**Always Encrypted:** creating/modifying encrypted columns often requires **SSMS wizard**, **PowerShell SqlServer**, or DBA-approved processes; do not assume a plain `CREATE TABLE` leaves AE fully configured without keys.

### 5.2 SSDT / DACPAC

- Database project in Visual Studio → **DACPAC**.
- Publish with **SqlPackage** or Azure DevOps task.
- Validate **options** affecting sensitive data and AE (incremental vs full).

### 5.3 Migration tools (Flyway, Liquibase, etc.)

- Version scripts in repo.
- Environments: dev → staging → prod with the same order.
- Do not commit **real PII**; use synthetic data.

### 5.4 Post-deployment validation

```sql
-- Types and lengths (example ResumeProfiles)
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'ResumeProfiles'
ORDER BY ORDINAL_POSITION;
```

Cross-check with `lib/repositories/*.ts` (`sql.NVarChar(n)`).

---

## 6. Application ↔ infrastructure alignment

| Area | Verify |
|------|--------|
| `lib/db.ts` | ODBC string: driver, `ColumnEncryption=Enabled`, Key Vault auth, SQL vs Entra. |
| `next.config.ts` | `serverExternalPackages: ["msnodesqlv8"]`. |
| Repositories | `NVarChar` lengths match real columns; optional AE → `''` where applicable (see `azure-sql-always-encrypted.md`). |
| Hosting | ODBC Driver 17/18 installed; Node compatible with `msnodesqlv8`. |
| Secrets | Never in git; Key Vault / hosting provider variables. |

---

## 7. Quick checklist “from zero to production”

1. Brindley tenant and subscription defined.  
2. Resource group and naming convention.  
3. Key Vault created; CMK/CEK aligned with SQL (DBA flow).  
4. App registration + secret/cert; secret in secure store.  
5. RBAC: **Key Vault Crypto User** on the service principal (correct Object ID).  
6. SQL Server: firewall/connectivity; SQL login or Entra user; DB roles.  
7. Schema deployed and validated (`INFORMATION_SCHEMA`).  
8. Runtime environment variables.  
9. Deploy app; test **save profile** and critical flows.  
10. Runbook: secret rotation, DBA contact, logs and alerts.

---

## 8. Internal references

- [environment-variables.md](./environment-variables.md)  
- [azure-key-vault-rbac.md](./azure-key-vault-rbac.md)  
- [azure-sql-always-encrypted.md](./azure-sql-always-encrypted.md)  
- [application-runtime.md](./application-runtime.md)  
- [migration-checklist.md](./migration-checklist.md)  

Microsoft documentation (always use current version): *Microsoft Entra app registration*, *Azure RBAC*, *Azure Key Vault*, *Always Encrypted*, *ODBC Driver for SQL Server*.
