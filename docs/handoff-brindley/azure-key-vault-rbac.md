# Azure Key Vault and RBAC (Always Encrypted)

## Role of Key Vault

**Column Master Keys (CMK)** for Always Encrypted usually reference keys in Azure Key Vault. The **application** (not the browser end user) needs permissions for key operations compatible with the ODBC driver (read / unwrap depending on the flow).

## Service principal

In practice you register (or reuse) an **App registration** in Microsoft Entra ID and assign it to the **Key Vault** as the principal.

Useful identifiers:

- **Application (client) ID** — typically maps to `AZURE_CLIENT_ID` in the app.
- **Object ID** of the **enterprise application** (service principal) — sometimes this is the principal you must assign IAM roles to if the portal search does not find the client ID.

## Recommended RBAC roles

At **Key Vault scope** (resource `Microsoft.KeyVault/vaults/...`), assign to the service principal:

- **`Key Vault Crypto User`** (typical for Always Encrypted with this client), **or**
- **`Key Vault Crypto Service Encryption User`** if corporate policy requires it.

Do **not** confuse with:

- `Key Vault Crypto Service Release User` — different scenario (key release).
- `Key Vault Data Access Administrator` — manages data role assignments; it does not replace the app’s cryptographic role.

## Symptoms when permissions are missing

- `403` / `ForbiddenByRbac` from the Key Vault SDK.
- Messages such as: `Microsoft.KeyVault/vaults/keys/read`, `Assignment: (not found)`.

## Assignment via Azure CLI (Cloud Shell)

Useful when the portal limits which roles you can pick in the UI (e.g. ABAC conditions).

Typical parameters:

- `--assignee-object-id` = Object ID of the **service principal** (do not confuse with client ID if the command requires it this way).
- `--assignee-principal-type ServicePrincipal`
- `--role "Key Vault Crypto User"`
- `--scope` = full ARM resource ID of the vault.

After assignment: wait for **RBAC propagation** (minutes).

## Qualiux → Brindley handoff

1. Create (or transfer) Key Vault in Brindley subscription / tenant.
2. Reconfigure CMK / CEK in SQL for the new vault (or keep references if only access control changes).
3. Register app in Brindley tenant, create secret, assign role on the vault.
4. Update environment variables in the app runtime (do not commit secrets).
