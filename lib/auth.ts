import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

import { mapAzureRolesToUserRole } from "@/lib/map-azure-role";
import type { UserRole } from "@/types/user-role";

/** Microsoft OIDC discovery returns issuer without a trailing slash; a mismatch causes OperationProcessingError. */
function normalizeEntraIssuer(raw: string): string {
  return raw.replace(/\/+$/, "");
}

const tenantId = process.env.AZURE_TENANT_ID?.trim();
const issuerFromEnv =
  process.env.AZURE_AD_ISSUER?.trim() ??
  process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER?.trim();
const issuer =
  issuerFromEnv != null && issuerFromEnv.length > 0
    ? normalizeEntraIssuer(issuerFromEnv)
    : tenantId
      ? normalizeEntraIssuer(
          `https://login.microsoftonline.com/${tenantId}/v2.0`,
        )
      : undefined;

const microsoftEntraProvider = MicrosoftEntraID({
  clientId: process.env.AZURE_CLIENT_ID!,
  clientSecret: process.env.AZURE_CLIENT_SECRET!,
  ...(issuer ? { issuer } : {}),
  authorization: {
    params: { scope: "openid profile email User.Read" },
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    {
      ...microsoftEntraProvider,
      /** Matches typical v4 Azure AD callback: /api/auth/callback/azure-ad */
      id: "azure-ad",
    },
  ],
  callbacks: {
    async jwt({ token, profile, account }) {
      if (profile) {
        const roles =
          "roles" in profile && Array.isArray(profile.roles)
            ? (profile.roles as string[])
            : undefined;
        token.role = mapAzureRolesToUserRole(roles);
        if (typeof profile.name === "string") {
          token.name = profile.name;
        }
        // Ensure we always store the plain-text email from the identity provider
        const profileEmail =
          (typeof profile.email === "string" && profile.email) ||
          (typeof profile.preferred_username === "string" && profile.preferred_username) ||
          (typeof profile.upn === "string" && profile.upn) ||
          undefined;
        if (profileEmail) {
          token.email = profileEmail;
        }
        if (typeof profile.sub === "string") {
          token.sub = profile.sub;
        }
      }
      if (!token.sub && account?.providerAccountId) {
        token.sub = account.providerAccountId;
      }
      if (!token.role) {
        token.role = "Employee" satisfies UserRole;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name =
          (token.name as string | undefined) ?? session.user.name;
        session.user.role = (token.role as UserRole | undefined) ?? "Employee";
        if (typeof token.sub === "string") {
          session.user.entraObjectId = token.sub;
        }
      }
      return session;
    },
  },
});
