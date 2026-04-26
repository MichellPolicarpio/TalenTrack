# Detail: App Registration and Entra ID (operational checklist)

Step-by-step checklist for the application that accesses **Key Vault** in the **Always Encrypted** flow (server credentials, not the end user).

## Before you start

- [ ] Know the **tenant** where the app will live (Brindley).
- [ ] Have permission to create **App registrations** (e.g. *Application Administrator* or tenant delegation).
- [ ] Decide **standard name** and **environments** (dev/staging/prod) — ideally **one app per environment** or distinct secrets per environment.

## Create App Registration

- [ ] **Entra ID** → **App registrations** → **New registration**.
- [ ] Name: e.g. `resume-builder-ae-kv-prod`.
- [ ] **Accounts in this organizational directory only** (typical single-tenant).
- [ ] Redirect URI: omit if there is no interactive OAuth login for this app.

## Credentials

### Option A — Client secret

- [ ] **Certificates & secrets** → **New client secret** → description + expiration per policy (6/12/24 months).
- [ ] Copy secret **Value** **once** → store in a secret manager (not email or chat).
- [ ] Record **Secret ID** and expiration on the operations calendar.

### Option B — Certificate

- [ ] Generate key pair (internal Brindley PKI or security request).
- [ ] Upload **public certificate** (.cer) under **Certificates & secrets**.
- [ ] Runtime must read the **private key** (secure path, Key Vault, etc.).
- [ ] Update code/connection string if you later stop using secret in ODBC (today the project uses *client secret* in environment variables; certificate would imply changes to `lib/db.ts` or Azure auth middleware).

## Record identifiers

After creating the app, on **Overview**:

| Field | Copy to |
|-------|---------|
| Application (client) ID | `AZURE_CLIENT_ID`, ODBC `KeyStorePrincipalId` |
| Directory (tenant) ID | `AZURE_TENANT_ID` |

Under **Enterprise applications** → find the same name → **Properties**:

| Field | Use |
|-------|-----|
| Object ID | Key Vault RBAC assignments, `az role assignment --assignee-object-id` |

## Enterprise application vs App registration

- **App registration:** application “design” (client ID, secret, redirect URIs).
- **Enterprise application:** instance in the tenant; holds the **service principal** Azure Resource Manager uses for **IAM**.

If **Key Vault → IAM → Add role assignment** search does not find the client ID:

- [ ] Search by **app name**.
- [ ] Or paste **Object ID** from the enterprise application.

## Admin permissions (when needed)

| Need | Typical role on tenant or subscription |
|------|----------------------------------------|
| Create app registrations | Application Administrator / Global Administrator (per policy) |
| Assign roles on Key Vault / RG | Owner, User Access Administrator, or Key Vault Data Access Administrator on the correct scope |

## Secret rotation (operations)

1. Create a **new** client secret on the same app registration.
2. Update variable/vault in **all** environments using the old secret.
3. Restart / redeploy if the app caches env.
4. After validation window, **revoke** the old secret.

## What this app usually does **not** need

- **Redirect URI** for user flow if it only acts as a daemon to Key Vault via ODBC.
- Extra **Graph** permissions for minimal AE + Key Vault RBAC (revalidate if Microsoft changes requirements).

## Common mistakes

| Issue | Cause |
|-------|--------|
| “No results” when searching principal in IAM | Search by client ID; use Object ID or name. |
| Expired secret | `invalid_client` / intermittent Key Vault auth failures. |
| App created in **another tenant** than Key Vault | 403 on all key operations. |
