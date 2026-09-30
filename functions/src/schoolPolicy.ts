export type SchoolRole = "district-admin" | "school-admin" | "teacher" | "student";

const ROLE_IMPORTS: Record<SchoolRole, SchoolRole[]> = {
  "district-admin": ["school-admin", "teacher", "student"],
  "school-admin": ["teacher", "student"],
  teacher: [],
  student: [],
};

export function canImportSchoolRole(actorRole: SchoolRole, targetRole: SchoolRole): boolean {
  return ROLE_IMPORTS[actorRole].includes(targetRole);
}

export function emailDomain(email: string): string {
  const separator = email.lastIndexOf("@");
  return separator < 0 ? "" : email.slice(separator + 1).trim().toLowerCase();
}

export function identityMatchesRoster(input: {
  authEmail?: string;
  emailVerified: boolean;
  authSubject: string;
  rosterEmail?: string;
  rosterProviderSubject?: string;
  approvedDomains: string[];
}): boolean {
  const authEmail = input.authEmail?.trim().toLowerCase() || "";
  const rosterEmail = input.rosterEmail?.trim().toLowerCase() || "";
  const providerSubject = input.rosterProviderSubject?.trim() || "";
  if (providerSubject) return providerSubject === input.authSubject;
  if (!authEmail || !rosterEmail || !input.emailVerified || authEmail !== rosterEmail) return false;
  const approved = input.approvedDomains.map((domain) => domain.trim().toLowerCase()).filter(Boolean);
  return approved.length > 0 && approved.includes(emailDomain(authEmail));
}
