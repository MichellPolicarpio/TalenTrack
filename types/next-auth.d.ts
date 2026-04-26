import type { DefaultSession } from "next-auth";

import type { UserRole } from "@/types/user-role";

declare module "next-auth" {
  interface Session {
    user: {
      role: UserRole;
      /** Entra ID object id (OIDC `sub`) */
      entraObjectId?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    name?: string;
  }
}
