export type UserRole = "ANONYMOUS" | "FREE" | "PRO" | "BUSINESS" | "ADMIN";

export type Permission =
  | "run_basic_check"
  | "view_recommendations"
  | "share_results"
  | "save_computers"
  | "save_workload_profiles"
  | "advanced_simulation"
  | "export_pdf"
  | "export_csv"
  | "bulk_analysis"
  | "custom_workload_creation"
  | "api_access"
  | "manage_catalog"
  | "review_candidates";

export interface UserContext {
  id?: string;
  role: UserRole;
  customEntitlements?: Permission[];
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ANONYMOUS: [
    "run_basic_check",
    "view_recommendations",
    "share_results",
  ],
  FREE: [
    "run_basic_check",
    "view_recommendations",
    "share_results",
    "save_computers",
    "save_workload_profiles",
  ],
  PRO: [
    "run_basic_check",
    "view_recommendations",
    "share_results",
    "save_computers",
    "save_workload_profiles",
    "advanced_simulation",
    "export_pdf",
    "custom_workload_creation",
  ],
  BUSINESS: [
    "run_basic_check",
    "view_recommendations",
    "share_results",
    "save_computers",
    "save_workload_profiles",
    "advanced_simulation",
    "export_pdf",
    "export_csv",
    "bulk_analysis",
    "custom_workload_creation",
    "api_access",
  ],
  ADMIN: [
    "run_basic_check",
    "view_recommendations",
    "share_results",
    "save_computers",
    "save_workload_profiles",
    "advanced_simulation",
    "export_pdf",
    "export_csv",
    "bulk_analysis",
    "custom_workload_creation",
    "api_access",
    "manage_catalog",
    "review_candidates",
  ],
};

export function can(user: UserContext | null | undefined, permission: Permission): boolean {
  if (!user) {
    return ROLE_PERMISSIONS.ANONYMOUS.includes(permission);
  }

  // Explicit individual override check
  if (user.customEntitlements && user.customEntitlements.includes(permission)) {
    return true;
  }

  const rolePerms = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.ANONYMOUS;
  return rolePerms.includes(permission);
}
