import { describe, it, expect } from 'vitest';
import {
  calculateRankPrediction,
  type CeeCategory,
  type CeeProgramType,
} from '../rankPredictorEngine';

describe('CEE Rank Predictor & College Cutoff Engine', () => {
  it('should correctly predict top national rank for high scores (175/200)', () => {
    const res = calculateRankPrediction(175, 'open', 'mbbs');
    expect(res.isQualified).toBe(true);
    expect(res.percentage).toBe(87.5);
    expect(res.percentile).toBeGreaterThanOrEqual(99.7);
    expect(res.predictedRankMin).toBeLessThan(150);
    expect(res.predictedRankMax).toBeLessThan(200);
    expect(res.scholarshipEligible).toBe(true);

    // IOM Maharajgunj should have high probability for 175 score
    const iom = res.colleges.find((c) => c.collegeId === 'iom-maharajgunj');
    expect(iom).toBeDefined();
    expect(iom?.chanceLevel).toBe('High Probability');
  });

  it('should apply category cutoff relief for government school quota', () => {
    const openRes = calculateRankPrediction(152, 'open', 'mbbs');
    const quotaRes = calculateRankPrediction(152, 'gov_school', 'mbbs');

    const iomOpen = openRes.colleges.find((c) => c.collegeId === 'iom-maharajgunj');
    const iomQuota = quotaRes.colleges.find((c) => c.collegeId === 'iom-maharajgunj');

    // With 152 in Open, IOM is Reach / Borderline, but with Gov School quota cutoff drops by 14
    expect(iomQuota?.quotaAdjustedCutoff).toBeLessThan(iomOpen?.quotaAdjustedCutoff || 0);
    expect(iomQuota?.chanceScorePct).toBeGreaterThan(iomOpen?.chanceScorePct || 0);
  });

  it('should handle Karnali/Remote reservation quota with significant relief', () => {
    const res = calculateRankPrediction(132, 'karnali_remote', 'mbbs');
    const kahs = res.colleges.find((c) => c.collegeId === 'kahs-jumla');
    expect(kahs).toBeDefined();
    expect(kahs?.quotaAdjustedCutoff).toBe(128);
    expect(kahs?.chanceLevel).toBe('High Probability');
  });

  it('should correctly mark non-qualified when score is below 100 passing threshold', () => {
    const res = calculateRankPrediction(85, 'open', 'mbbs');
    expect(res.isQualified).toBe(false);
    expect(res.scholarshipEligible).toBe(false);
    expect(res.colleges.every((c) => c.chanceLevel === 'Reach / Difficult')).toBe(true);
  });

  it('should scale candidate pool correctly for BDS and Nursing', () => {
    const mbbsRes = calculateRankPrediction(140, 'open', 'mbbs');
    const bdsRes = calculateRankPrediction(140, 'open', 'bds');

    // BDS has fewer overall applicants than MBBS, so rank number is more concentrated
    expect(bdsRes.predictedRankMax).toBeLessThan(mbbsRes.predictedRankMax);
  });
});
