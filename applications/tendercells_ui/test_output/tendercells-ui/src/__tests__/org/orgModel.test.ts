// School tenancy: org-owned assets, class grants, plan limits, student safety.
import { describe, expect, it } from 'vitest';
import { canSee, orgForEmail, planLimitReason, resolveAccess, type ClassDoc } from '../../../../shared/org/orgModel';

const classes: ClassDoc[] = [
  { id: 'ag1', orgId: 'lincoln', name: 'Ag Science 1', teacherUids: ['t1'], studentUids: ['s1'], propertyIds: ['farm-lab'], productIds: ['ct_001'],
    capabilities: { viewCameras: true, weedAim: true, weedBurn: true } },
  { id: 'robotics', orgId: 'lincoln', name: 'Robotics', teacherUids: ['t2'], studentUids: [], propertyIds: ['garden'], productIds: ['garden_weeder'],
    capabilities: { runRoutines: true } },
  { id: 'other', orgId: 'other-school', name: 'Elsewhere', teacherUids: [], studentUids: ['s1'], propertyIds: ['x'], productIds: ['y'], capabilities: { editLayout: true } },
];

describe('resolveAccess', () => {
  it('students get only their classes\' assets, never their own property, never the laser', () => {
    const a = resolveAccess({ uid: 's1', orgId: 'lincoln', role: 'student', classIds: ['ag1'] }, classes);
    expect(a.propertyIds).toEqual(['farm-lab']);
    expect(a.productIds).toEqual(['ct_001']);
    expect(a.capabilities.viewCameras).toBe(true);
    expect(a.capabilities.weedAim).toBe(true);
    expect(a.capabilities.weedBurn).toBe(false); // class asked for it - safety says no
    expect(a.capabilities.editLayout).toBe(false); // other org's class does not leak in
    expect(a.canCreateProperty).toBe(false);
    expect(canSee(a.propertyIds, 'garden')).toBe(false);
  });

  it('teachers see the assets of every class they teach', () => {
    const a = resolveAccess({ uid: 't2', orgId: 'lincoln', role: 'teacher', classIds: [] }, classes);
    expect(a.propertyIds).toEqual(['garden']);
    expect(a.capabilities.runRoutines).toBe(true);
    expect(a.canCreateProperty).toBe(false);
  });

  it('org admins see everything and can add properties / products', () => {
    const a = resolveAccess({ uid: 'a', orgId: 'lincoln', role: 'admin', classIds: [] }, classes);
    expect(a.propertyIds).toBe('all');
    expect(canSee(a.productIds, 'anything')).toBe(true);
    expect(a.canCreateProperty && a.canCreateProduct).toBe(true);
  });
});

describe('plans and domains', () => {
  it('caps properties / seats by plan and names the next plan', () => {
    expect(planLimitReason('classroom', 'properties', 0)).toBeNull();
    expect(planLimitReason('classroom', 'properties', 1)).toMatch(/Upgrade to School/);
    expect(planLimitReason('district', 'seats', 20000)).not.toMatch(/Upgrade/);
  });

  it('maps school email domains (and sub-domains) to their org', () => {
    const orgs = [{ id: 'lincoln', domains: ['lincoln.k12.ca.us'] }];
    expect(orgForEmail('kid@students.lincoln.k12.ca.us', orgs)).toBe('lincoln');
    expect(orgForEmail('teacher@LINCOLN.k12.ca.us', orgs)).toBe('lincoln');
    expect(orgForEmail('someone@gmail.com', orgs)).toBeUndefined();
  });
});
