import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hasProgramTypeColumn, withProgramType, programTypeField, __resetProgramTypeCache } from '../programColumn';

function fakeClient(result: { error: any }) {
  const calls: string[] = [];
  return {
    calls,
    from(table: string) {
      calls.push(table);
      return { select: () => ({ limit: async () => ({ data: [], ...result }) }) };
    },
  };
}

describe('program_type column detection', () => {
  beforeEach(() => {
    __resetProgramTypeCache();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('uses the column when it exists', async () => {
    const c = fakeClient({ error: null });
    expect(await withProgramType(c, 'subjects', 'id, name')).toBe('id, name, program_type');
    expect(await programTypeField(c, 'subjects', 'ielts')).toEqual({ program_type: 'ielts' });
    expect(c.calls).toEqual(['subjects']); // probed once, then cached
  });

  it('leaves it out when Postgres says it does not exist', async () => {
    const c = fakeClient({ error: { code: '42703', message: 'column subjects.program_type does not exist' } });
    expect(await withProgramType(c, 'subjects', 'id, name')).toBe('id, name');
    expect(await programTypeField(c, 'subjects', 'ielts')).toEqual({});
    expect(c.calls).toEqual(['subjects']);
  });

  it('does not cache an unrelated error', async () => {
    const c = fakeClient({ error: { code: '08006', message: 'connection failure' } });
    expect(await hasProgramTypeColumn(c, 'notes')).toBe(false);
    expect(await hasProgramTypeColumn(c, 'notes')).toBe(false);
    expect(c.calls).toEqual(['notes', 'notes']);
  });

  it('writes nothing without a value', async () => {
    const c = fakeClient({ error: null });
    expect(await programTypeField(c, 'notes', undefined)).toEqual({});
    expect(c.calls).toEqual([]);
  });
});
