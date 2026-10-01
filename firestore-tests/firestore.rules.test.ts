// Firestore Security Rules emulator tests.
//
// Proves the actual deployed behavior of firestore.rules against synthetic
// custom-claim identities (organizationId/schoolRole/classIds - the same
// shape Cloud Functions write via admin.auth().setCustomUserClaims). This is
// the "real emulator proof" the codex school-SSO security review asked for:
// tenant isolation, role boundaries, and the student-write restriction on
// devices, none of which the existing schoolPolicy.test.ts (pure-function
// unit tests) can demonstrate on its own.
//
// Run: firebase emulators:exec --only firestore "vitest run --config vitest.config.ts"
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { addDoc, collection, deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const PROJECT_ID = "tender-cells-rules-test";
const ORG_A = "org-a";
const ORG_B = "org-b";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

/** Seed with rules disabled - mirrors how the Admin SDK (Cloud Functions) writes in production. */
async function seed(fn: (db: import("firebase/firestore").Firestore) => Promise<void>) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await fn(context.firestore());
  });
}

const ownerCtx = () => testEnv.authenticatedContext("owner-uid");
const strangerCtx = () => testEnv.authenticatedContext("stranger-uid");
const anonCtx = () => testEnv.unauthenticatedContext();

const studentCtx = (orgId: string, classIds: string[]) =>
  testEnv.authenticatedContext("student-uid", { organizationId: orgId, schoolRole: "student", classIds });
const teacherCtx = (orgId: string) =>
  testEnv.authenticatedContext("teacher-uid", { organizationId: orgId, schoolRole: "teacher", classIds: [] });
const schoolAdminCtx = (orgId: string) =>
  testEnv.authenticatedContext("school-admin-uid", { organizationId: orgId, schoolRole: "school-admin", classIds: [] });
const districtAdminCtx = (orgId: string) =>
  testEnv.authenticatedContext("district-admin-uid", { organizationId: orgId, schoolRole: "district-admin", classIds: [] });

describe("devices/{deviceId}", () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "devices/dev-1"), {
        userId: "owner-uid",
        organizationId: ORG_A,
        classIds: ["class-1"],
        nickname: "Coop A",
      });
    });
  });

  it("lets the owner read and write their own device", async () => {
    const db = ownerCtx().firestore();
    await assertSucceeds(getDoc(doc(db, "devices/dev-1")));
    await assertSucceeds(updateDoc(doc(db, "devices/dev-1"), { nickname: "Renamed" }));
  });

  it("denies a stranger with no relationship to the device", async () => {
    const db = strangerCtx().firestore();
    await assertFails(getDoc(doc(db, "devices/dev-1")));
    await assertFails(updateDoc(doc(db, "devices/dev-1"), { nickname: "Hijacked" }));
  });

  it("denies an unauthenticated caller", async () => {
    const db = anonCtx().firestore();
    await assertFails(getDoc(doc(db, "devices/dev-1")));
  });

  it("lets a same-org student with an overlapping class READ the device", async () => {
    const db = studentCtx(ORG_A, ["class-1"]).firestore();
    await assertSucceeds(getDoc(doc(db, "devices/dev-1")));
  });

  it("denies that same student WRITE access to the device (the fixed vulnerability)", async () => {
    // Before the fix, any classIds-overlap (student or staff) could write nearly
    // the whole device doc. It's now isSchoolAdmin-only - a student must never
    // be able to rewrite device fields directly through Firestore.
    const db = studentCtx(ORG_A, ["class-1"]).firestore();
    await assertFails(updateDoc(doc(db, "devices/dev-1"), { nickname: "Student edit" }));
  });

  it("denies a teacher WRITE access too - device writes are admin-only, not staff-wide", async () => {
    // Deliberately narrower than isSchoolStaff: control-plane writes to a device
    // doc are reserved for admins; a teacher's device *operation* goes through
    // the authenticated API/MQTT path (canAccessDevice in schoolPlatform.ts),
    // never direct Firestore writes.
    const db = teacherCtx(ORG_A).firestore();
    await assertSucceeds(getDoc(doc(db, "devices/dev-1")));
    await assertFails(updateDoc(doc(db, "devices/dev-1"), { nickname: "Teacher edit" }));
  });

  it("lets a same-org school-admin update the device (org/owner unchanged)", async () => {
    const db = schoolAdminCtx(ORG_A).firestore();
    await assertSucceeds(updateDoc(doc(db, "devices/dev-1"), { nickname: "Admin edit" }));
  });

  it("denies a school-admin from a DIFFERENT org - tenant isolation", async () => {
    const db = schoolAdminCtx(ORG_B).firestore();
    await assertFails(getDoc(doc(db, "devices/dev-1")));
    await assertFails(updateDoc(doc(db, "devices/dev-1"), { nickname: "Cross-tenant edit" }));
  });

  it("denies a student from a different org even with the SAME classId string - tenant isolation, not just class matching", async () => {
    const db = studentCtx(ORG_B, ["class-1"]).firestore();
    await assertFails(getDoc(doc(db, "devices/dev-1")));
  });

  it("never lets anyone but the owner delete a device, staff included", async () => {
    await assertFails(deleteDoc(doc(schoolAdminCtx(ORG_A).firestore(), "devices/dev-1")));
    await assertFails(deleteDoc(doc(districtAdminCtx(ORG_A).firestore(), "devices/dev-1")));
    await assertSucceeds(deleteDoc(doc(ownerCtx().firestore(), "devices/dev-1")));
  });

  it("blocks changing organizationId or userId even for an admin update", async () => {
    const db = schoolAdminCtx(ORG_A).firestore();
    await assertFails(updateDoc(doc(db, "devices/dev-1"), { organizationId: ORG_B }));
    await assertFails(updateDoc(doc(db, "devices/dev-1"), { userId: "attacker-uid" }));
  });
});

describe("organizations/{organizationId}", () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, `organizations/${ORG_A}`), { displayName: "Org A", status: "active" });
    });
  });

  it("lets a member of the org read the org doc", async () => {
    await assertSucceeds(getDoc(doc(studentCtx(ORG_A, []).firestore(), `organizations/${ORG_A}`)));
  });

  it("denies a member of a different org", async () => {
    await assertFails(getDoc(doc(studentCtx(ORG_B, []).firestore(), `organizations/${ORG_A}`)));
  });

  it("never allows a client write, even for a district-admin", async () => {
    await assertFails(setDoc(doc(districtAdminCtx(ORG_A).firestore(), `organizations/${ORG_A}`), { displayName: "Hijacked" }, { merge: true }));
  });
});

describe("organizations/{organizationId}/members/{userId}", () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, `organizations/${ORG_A}/members/student-uid`), { role: "student", schoolId: "school-1" });
    });
  });

  it("lets a user read their own membership doc", async () => {
    await assertSucceeds(getDoc(doc(studentCtx(ORG_A, []).firestore(), `organizations/${ORG_A}/members/student-uid`)));
  });

  it("denies another same-org student reading someone else's membership", async () => {
    const otherStudent = testEnv.authenticatedContext("other-student-uid", { organizationId: ORG_A, schoolRole: "student", classIds: [] });
    await assertFails(getDoc(doc(otherStudent.firestore(), `organizations/${ORG_A}/members/student-uid`)));
  });

  it("lets a school-admin in the same org read any member", async () => {
    await assertSucceeds(getDoc(doc(schoolAdminCtx(ORG_A).firestore(), `organizations/${ORG_A}/members/student-uid`)));
  });

  it("never allows a client write, even the member's own", async () => {
    await assertFails(setDoc(doc(studentCtx(ORG_A, []).firestore(), `organizations/${ORG_A}/members/student-uid`), { role: "school-admin" }, { merge: true }));
  });
});

describe("organizations/{organizationId}/roster/{externalId} - pseudonymous student data", () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, `organizations/${ORG_A}/roster/student-042`), { role: "student", schoolId: "school-1" });
    });
  });

  it("lets staff (teacher+) in the same org read a roster entry", async () => {
    await assertSucceeds(getDoc(doc(teacherCtx(ORG_A).firestore(), `organizations/${ORG_A}/roster/student-042`)));
  });

  it("denies a student reading roster entries - even their own org's roster collection isn't student-readable", async () => {
    await assertFails(getDoc(doc(studentCtx(ORG_A, []).firestore(), `organizations/${ORG_A}/roster/student-042`)));
  });

  it("denies staff from a different org - no cross-tenant roster browsing", async () => {
    await assertFails(getDoc(doc(teacherCtx(ORG_B).firestore(), `organizations/${ORG_A}/roster/student-042`)));
  });

  it("never allows a client write - roster only changes via syncSchoolRoster (Admin SDK)", async () => {
    await assertFails(setDoc(doc(districtAdminCtx(ORG_A).firestore(), `organizations/${ORG_A}/roster/student-042`), { role: "district-admin" }, { merge: true }));
  });
});

describe("organizations/{organizationId}/classes/{classId}", () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, `organizations/${ORG_A}/classes/class-1`), { name: "Period 1" });
    });
  });

  it("lets staff read any class in their org", async () => {
    await assertSucceeds(getDoc(doc(teacherCtx(ORG_A).firestore(), `organizations/${ORG_A}/classes/class-1`)));
  });

  it("lets a student read a class they're enrolled in", async () => {
    await assertSucceeds(getDoc(doc(studentCtx(ORG_A, ["class-1"]).firestore(), `organizations/${ORG_A}/classes/class-1`)));
  });

  it("denies a student NOT enrolled in that class", async () => {
    await assertFails(getDoc(doc(studentCtx(ORG_A, ["class-9"]).firestore(), `organizations/${ORG_A}/classes/class-1`)));
  });

  it("denies cross-tenant access even with a matching classId string", async () => {
    await assertFails(getDoc(doc(studentCtx(ORG_B, ["class-1"]).firestore(), `organizations/${ORG_A}/classes/class-1`)));
  });
});

describe("properties / products - school-owned, shared with classes", () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "properties/farm-lab"), { userId: "school-admin-uid", organizationId: ORG_A, classIds: ["class-1"], name: "Farm lab" });
      await setDoc(doc(db, "products/coop-1"), { userId: "school-admin-uid", organizationId: ORG_A, classIds: ["class-1"], product_name: "Lab coop" });
    });
  });

  it("lets a student in a shared class read the school's property and product, but not write", async () => {
    const db = studentCtx(ORG_A, ["class-1"]).firestore();
    await assertSucceeds(getDoc(doc(db, "properties/farm-lab")));
    await assertSucceeds(getDoc(doc(db, "products/coop-1")));
    await assertFails(updateDoc(doc(db, "properties/farm-lab"), { name: "Mine now" }));
    await assertFails(updateDoc(doc(db, "products/coop-1"), { product_name: "Mine now" }));
  });

  it("denies a student in another class, another school, or a stranger", async () => {
    await assertFails(getDoc(doc(studentCtx(ORG_A, ["class-2"]).firestore(), "properties/farm-lab")));
    await assertFails(getDoc(doc(studentCtx(ORG_B, ["class-1"]).firestore(), "properties/farm-lab")));
    await assertFails(getDoc(doc(strangerCtx().firestore(), "products/coop-1")));
  });
});

describe("newsletterSignups / schoolInquiries - create-only public forms", () => {
  it("accepts a well-formed pending newsletter signup from anyone and hides the list", async () => {
    const db = anonCtx().firestore();
    await assertSucceeds(addDoc(collection(db, "newsletterSignups"), { email: "a@b.co", topics: ["news"], source: "footer", status: "pending", createdAt: serverTimestamp() }));
    await assertFails(addDoc(collection(db, "newsletterSignups"), { email: "not-an-email", topics: [], source: "footer", status: "pending", createdAt: serverTimestamp() }));
    await assertFails(addDoc(collection(db, "newsletterSignups"), { email: "a@b.co", topics: [], source: "footer", status: "confirmed", createdAt: serverTimestamp() }));
    await assertFails(getDoc(doc(db, "newsletterSubscribers/a@b.co")));
  });

  it("accepts a school pilot inquiry, anonymous or as yourself, never as someone else", async () => {
    const base = { school: "Dream Academy", email: "t@school.org", createdAt: serverTimestamp() };
    await assertSucceeds(addDoc(collection(anonCtx().firestore(), "schoolInquiries"), base));
    await assertSucceeds(addDoc(collection(ownerCtx().firestore(), "schoolInquiries"), { ...base, uid: "owner-uid" }));
    await assertFails(addDoc(collection(ownerCtx().firestore(), "schoolInquiries"), { ...base, uid: "stranger-uid" }));
    await assertFails(addDoc(collection(anonCtx().firestore(), "schoolInquiries"), { ...base, isAdmin: true }));
  });
});

describe("AI assistant connector OAuth collections - server-only", () => {
  it("denies every client read and write, even to the signed-in owner", async () => {
    for (const ctx of [ownerCtx(), anonCtx()]) {
      const db = ctx.firestore();
      for (const path of ["oauthClients/c1", "oauthRequests/r1", "oauthGrants/abc"]) {
        await assertFails(getDoc(doc(db, path)));
        await assertFails(setDoc(doc(db, path), { uid: "owner-uid" }));
      }
    }
  });
});
