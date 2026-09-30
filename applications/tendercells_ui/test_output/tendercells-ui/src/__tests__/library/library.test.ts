// Shared animal / plant library stays consistent with the OS roster and itself.
import { describe, expect, it } from 'vitest';
import { ANIMALS, TOXIC_PLANT_IDS_BY_SPECIES } from '../../../../shared/library/animals';
import { PLANTS, plantById } from '../../../../shared/library/plants';
import { SPECIES_EMOJI, type Species } from '../../services/birdsService';

describe('library', () => {
  it('has a health entry for every species the flock roster supports', () => {
    for (const s of Object.keys(SPECIES_EMOJI) as Species[]) expect(ANIMALS.some((a) => a.id === s), s).toBe(true);
  });

  it('every condition says when to call a vet', () => {
    for (const a of ANIMALS) for (const c of a.conditions) expect(c.vetWhen.length, `${a.id}/${c.name}`).toBeGreaterThan(3);
  });

  it('toxic-plant links point at real toxic plants', () => {
    for (const ids of Object.values(TOXIC_PLANT_IDS_BY_SPECIES)) {
      for (const id of ids ?? []) expect(plantById(id)?.kind, id).toBe('toxic');
    }
  });

  it('plant ids are unique and weeds explain laser suitability', () => {
    expect(new Set(PLANTS.map((p) => p.id)).size).toBe(PLANTS.length);
    for (const w of PLANTS.filter((p) => p.kind === 'weed')) expect(w.laser, w.id).toBeTruthy();
  });
});
