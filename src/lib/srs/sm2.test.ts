import { describe, it, expect } from 'vitest';
import { reviewCard, initialSm2State, SM2_MIN_EASE_FACTOR } from './sm2';

const T0 = new Date('2026-01-01T00:00:00.000Z');
const daysBetween = (iso: string, from: Date) =>
  Math.round((new Date(iso).getTime() - from.getTime()) / 86_400_000);

describe('SM-2 reviewCard', () => {
  it('schedules 1 day, then 6 days on the first two successful recalls', () => {
    const r1 = reviewCard(initialSm2State(), 5, T0);
    expect(r1.repetitions).toBe(1);
    expect(r1.intervalDays).toBe(1);
    expect(r1.easeFactor).toBe(2.6);
    expect(daysBetween(r1.dueAt, T0)).toBe(1);

    const r2 = reviewCard(r1, 5, T0);
    expect(r2.repetitions).toBe(2);
    expect(r2.intervalDays).toBe(6);
    expect(r2.easeFactor).toBe(2.7);
  });

  it('grows the interval by the ease factor from the third recall on', () => {
    let s = reviewCard(initialSm2State(), 5, T0); // I=1, EF=2.6
    s = reviewCard(s, 5, T0);                     // I=6, EF=2.7
    const r3 = reviewCard(s, 5, T0);              // I=round(6*2.7)=16
    expect(r3.intervalDays).toBe(16);
    expect(r3.repetitions).toBe(3);
    expect(r3.easeFactor).toBe(2.8);
  });

  it('resets repetitions and interval to 1 on a lapse (q < 3)', () => {
    let s = reviewCard(initialSm2State(), 5, T0);
    s = reviewCard(s, 5, T0);
    s = reviewCard(s, 5, T0); // now well-learned
    const lapse = reviewCard(s, 1, T0);
    expect(lapse.repetitions).toBe(0);
    expect(lapse.intervalDays).toBe(1);
    // EF drops but is still recalculated: 2.8 + (0.1 - 4*(0.08+4*0.02)) = 2.8 - 0.54 = 2.26
    expect(lapse.easeFactor).toBeCloseTo(2.26, 2);
  });

  it('never lets the ease factor fall below 1.3', () => {
    let s = initialSm2State();
    for (let i = 0; i < 20; i++) s = reviewCard(s, 0, T0);
    expect(s.easeFactor).toBe(SM2_MIN_EASE_FACTOR);
  });

  it('clamps out-of-range quality grades', () => {
    const hi = reviewCard(initialSm2State(), 9 as unknown as number, T0);
    const lo = reviewCard(initialSm2State(), -3 as unknown as number, T0);
    expect(hi.lastGrade).toBe(5);
    expect(lo.lastGrade).toBe(0);
  });
});
