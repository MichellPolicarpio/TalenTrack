import type { UserRole } from "@/types/user-role";

/**
 * Maps Entra ID app roles (token `roles` claim) to the app's UserRole.
 * Configure matching role names in the App Registration.
 */
export function mapAzureRolesToUserRole(
  roles: string[] | undefined,
): UserRole {
  if (!roles?.length) {
    return "Employee";
  }
  if (roles.includes("Admin")) {
    return "Admin";
  }
  if (roles.includes("HR_Revisor")) {
    return "HR_Revisor";
  }
  if (roles.includes("Employee")) {
    return "Employee";
  }
  return "Employee";
}
