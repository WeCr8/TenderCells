import { canImportSchoolRole, identityMatchesRoster } from "./schoolPolicy";

describe("school authorization policy", () => {
  it("prevents delegated administrators from creating equal or higher privileges", () => {
    expect(canImportSchoolRole("district-admin", "district-admin")).toBe(false);
    expect(canImportSchoolRole("school-admin", "district-admin")).toBe(false);
    expect(canImportSchoolRole("school-admin", "school-admin")).toBe(false);
    expect(canImportSchoolRole("district-admin", "school-admin")).toBe(true);
    expect(canImportSchoolRole("school-admin", "teacher")).toBe(true);
  });

  it("requires a verified email in an approved domain", () => {
    const identity = { authEmail: "student@dream.example", authSubject: "uid-1", rosterEmail: "student@dream.example", approvedDomains: ["dream.example"] };
    expect(identityMatchesRoster({ ...identity, emailVerified: true })).toBe(true);
    expect(identityMatchesRoster({ ...identity, emailVerified: false })).toBe(false);
    expect(identityMatchesRoster({ ...identity, emailVerified: true, approvedDomains: ["other.example"] })).toBe(false);
  });

  it("matches a pseudonymous roster only by provider subject", () => {
    const identity = { authSubject: "provider-user-42", emailVerified: false, approvedDomains: [] };
    expect(identityMatchesRoster({ ...identity, rosterProviderSubject: "provider-user-42" })).toBe(true);
    expect(identityMatchesRoster({ ...identity, rosterProviderSubject: "someone-else" })).toBe(false);
  });
});
