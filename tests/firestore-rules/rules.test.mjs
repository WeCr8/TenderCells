// Firestore security rules tests (schools/orgs, student limits, newsletter, inquiries, mail).
// Run: cd tests/firestore-rules && npm ci && npm test   (needs Java for the emulator)
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const env = await initializeTestEnvironment({ projectId: 'demo-tc', firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8085 } });
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'orgs/lincoln'), { name: 'Lincoln HS', type: 'school', plan: 'school', ownerUid: 'owner1' });
  await setDoc(doc(db, 'orgs/lincoln/members/admin1'), { role: 'admin', classIds: [] });
  await setDoc(doc(db, 'orgs/lincoln/members/stu1'), { role: 'student', classIds: ['ag1'], allowedPropertyIds: ['farm-lab'], allowedProductIds: ['ct_001'] });
  await setDoc(doc(db, 'properties/farm-lab'), { userId: 'admin1', orgId: 'lincoln', name: 'Farm lab' });
  await setDoc(doc(db, 'properties/garden'), { userId: 'admin1', orgId: 'lincoln', name: 'Garden' });
  await setDoc(doc(db, 'properties/home'), { userId: 'someone', name: 'Home' });
});
const stu = env.authenticatedContext('stu1').firestore();
const stuClaim = env.authenticatedContext('stu2', { accountType: 'student' }).firestore();
const admin = env.authenticatedContext('admin1').firestore();
const anon = env.unauthenticatedContext().firestore();
const results = [];
const t = async (name, p) => { try { await p; results.push(['ok', name]); } catch (e) { results.push(['FAIL', name, e.message]); } };
await t('student reads class property', assertSucceeds(getDoc(doc(stu, 'properties/farm-lab'))));
await t('student cannot read other org property', assertFails(getDoc(doc(stu, 'properties/garden'))));
await t('student cannot read someone else home', assertFails(getDoc(doc(stu, 'properties/home'))));
await t('admin reads all org properties', assertSucceeds(getDoc(doc(admin, 'properties/garden'))));
await t('student cannot create org property', assertFails(setDoc(doc(stu, 'properties/p1'), { userId: 'stu1', orgId: 'lincoln' })));
await t('student-claim account cannot create personal property', assertFails(setDoc(doc(stuClaim, 'properties/p2'), { userId: 'stu2' })));
await t('admin creates org property', assertSucceeds(setDoc(doc(admin, 'properties/p3'), { userId: 'admin1', orgId: 'lincoln' })));
await t('normal user creates personal property', assertSucceeds(setDoc(doc(env.authenticatedContext('u9').firestore(), 'properties/p4'), { userId: 'u9' })));
await t('student cannot change own role', assertFails(setDoc(doc(stu, 'orgs/lincoln/members/stu1'), { role: 'admin', classIds: [] })));
await t('student cannot upgrade plan', assertFails(setDoc(doc(admin, 'orgs/lincoln'), { name: 'x', type: 'school', plan: 'district', ownerUid: 'owner1' })));
await t('create free org', assertSucceeds(setDoc(doc(env.authenticatedContext('t5').firestore(), 'orgs/new1'), { name: 'New', type: 'school', plan: 'free', ownerUid: 't5' })));
await t('owner adds self', assertSucceeds(setDoc(doc(env.authenticatedContext('t5').firestore(), 'orgs/new1/members/t5'), { role: 'owner', classIds: [] })));
await t('newsletter signup (anon)', assertSucceeds(setDoc(doc(anon, 'newsletterSignups/a'), { email: 'a@b.co', topics: ['news'], source: 'footer', status: 'pending', createdAt: serverTimestamp() })));
await t('newsletter rejects bad email', assertFails(setDoc(doc(anon, 'newsletterSignups/b'), { email: 'nope', topics: [], source: 'x', status: 'pending', createdAt: serverTimestamp() })));
await t('newsletter no read', assertFails(getDoc(doc(anon, 'newsletterSignups/a'))));
await t('school inquiry (anon)', assertSucceeds(setDoc(doc(anon, 'schoolInquiries/a'), { school: 'Lincoln HS', email: 'it@lincoln.org', contactName: 'Pat', sso: 'google', createdAt: serverTimestamp() })));
await t('mail queue denied', assertFails(setDoc(doc(admin, 'mail/x'), { to: 'a@b.co' })));
for (const r of results) console.log(r.join(' | '));
await env.cleanup();
process.exit(results.some((r) => r[0] === 'FAIL') ? 1 : 0);
