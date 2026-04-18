export const USER_ROLES = ["Employee", "HR_Revisor", "Admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];
