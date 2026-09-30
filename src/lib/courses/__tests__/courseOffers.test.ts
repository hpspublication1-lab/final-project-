import { describe, it, expect } from 'vitest';
import {
  COURSES,
  PREBOOK_OFFER,
  getCourseBySlug,
  getOfferBreakdown,
} from '@/lib/courses/catalog';
import { PLAN_PRICES } from '@/lib/payments/gateways';
import { COURSE_LANDING_DATA } from '@/lib/courses/landingData';

describe('Authoritative Course & Offer Catalog (Prompt 2 Source of Truth)', () => {
  it('enforces mathematical consistency on the crash-course prebooking offer', () => {
    expect(PREBOOK_OFFER.currency).toBe('NPR');
    expect(PREBOOK_OFFER.totalCourseFeeNpr).toBe(2299);
    expect(PREBOOK_OFFER.depositAmountNpr).toBe(300);
    expect(PREBOOK_OFFER.remainingBalanceNpr).toBe(1999);
    expect(PREBOOK_OFFER.comparisonPriceNpr).toBe(4990);
    expect(PREBOOK_OFFER.totalSavingsNpr).toBe(2691);

    // Core invariant: deposit + balance = total fee
    expect(PREBOOK_OFFER.depositAmountNpr + PREBOOK_OFFER.remainingBalanceNpr).toBe(
      PREBOOK_OFFER.totalCourseFeeNpr
    );

    // Savings invariant: regular price - total fee = savings
    expect(PREBOOK_OFFER.comparisonPriceNpr - PREBOOK_OFFER.totalCourseFeeNpr).toBe(
      PREBOOK_OFFER.totalSavingsNpr
    );
  });

  it('validates every canonical catalog course has NPR currency and consistent pricing', () => {
    expect(COURSES.length).toBeGreaterThanOrEqual(5);

    for (const course of COURSES) {
      expect(course.currency).toBe('NPR');
      expect(course.priceNpr).toBeGreaterThan(0);
      expect(course.payableNowNpr).toBeGreaterThan(0);
      expect(course.payableLaterNpr).toBeGreaterThanOrEqual(0);

      // Invariant: payableNow + payableLater === priceNpr
      expect(course.payableNowNpr + course.payableLaterNpr).toBe(course.priceNpr);

      // Invariant: original comparison price >= discounted price
      if (course.originalPriceNpr) {
        expect(course.originalPriceNpr).toBeGreaterThanOrEqual(course.priceNpr);
      }

      // Metadata completeness
      expect(course.slug).toBeTruthy();
      expect(course.title).toBeTruthy();
      expect(course.planSku).toBeTruthy();
      expect(course.validityText).toBeTruthy();
      expect(course.includedFeatures.length).toBeGreaterThan(0);
    }
  });

  it('reconciles payment gateway PLAN_PRICES with course catalog and prebooking SKUs', () => {
    // Prebooking deposit and balance SKUs must exist on server
    expect(PLAN_PRICES['cee-crash-course-deposit']).toBeDefined();
    expect(PLAN_PRICES['cee-crash-course-deposit'].npr).toBe(300);

    expect(PLAN_PRICES['cee-crash-course-balance']).toBeDefined();
    expect(PLAN_PRICES['cee-crash-course-balance'].npr).toBe(1999);

    // Every course planSku must match the gateway pricing table
    for (const course of COURSES) {
      const gatewayPlan = PLAN_PRICES[course.planSku];
      expect(gatewayPlan, `Missing gateway SKU for course: ${course.slug}`).toBeDefined();
      expect(gatewayPlan.npr).toBe(course.payableNowNpr);
    }
  });

  it('reconciles landing page comparison prices with canonical catalog', () => {
    const ceeLanding = COURSE_LANDING_DATA['cee-medical-entrance'];
    expect(ceeLanding).toBeDefined();
    expect(ceeLanding.price).toBe(7990);
    expect(ceeLanding.originalPrice).toBe(14990);

    const seeLanding = COURSE_LANDING_DATA['see-class-10'];
    expect(seeLanding).toBeDefined();
    expect(seeLanding.price).toBe(4990);
    expect(seeLanding.originalPrice).toBe(7990);

    const ieltsLanding = COURSE_LANDING_DATA['ielts-preparation'];
    expect(ieltsLanding).toBeDefined();
    expect(ieltsLanding.price).toBe(3490);
    expect(ieltsLanding.originalPrice).toBe(5990);
  });

  it('correctly provides offer breakdown for prebook and standard courses via helper', () => {
    const prebookBreakdown = getOfferBreakdown('prebook');
    expect(prebookBreakdown).not.toBeNull();
    expect(prebookBreakdown!.payableNowNpr).toBe(300);
    expect(prebookBreakdown!.payableLaterNpr).toBe(1999);
    expect(prebookBreakdown!.fullPriceNpr).toBe(2299);
    expect(prebookBreakdown!.originalPriceNpr).toBe(4990);
    expect(prebookBreakdown!.isPrebookable).toBe(true);

    const ceeBreakdown = getOfferBreakdown('cee-mbbs-mastery-2026');
    expect(ceeBreakdown).not.toBeNull();
    expect(ceeBreakdown!.payableNowNpr).toBe(7990);
    expect(ceeBreakdown!.payableLaterNpr).toBe(0);
    expect(ceeBreakdown!.savingsNpr).toBe(14990 - 7990);

    const unknownBreakdown = getOfferBreakdown('non-existent-course');
    expect(unknownBreakdown).toBeNull();
  });
});
