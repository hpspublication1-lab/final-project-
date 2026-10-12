import { describe, it, expect } from 'vitest';
import {
  COURSES,
  PREBOOK_OFFER,
  getCourseBySlug,
  getOfferBreakdown,
} from '@/lib/courses/catalog';
import { PLAN_PRICES } from '@/lib/payments/gateways';
import { COURSE_LANDING_DATA } from '@/lib/courses/landingData';
import { SUPPORT_CONFIG } from '@/lib/config/support';
import {
  getFeaturedCoursesSchema,
  getProductPricingSchema,
  getTestimonialsReviewsSchema,
} from '@/lib/seo/structuredData';

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

describe('Trust Claims, Support Details & Policy Integrity (Prompt 3 Verification)', () => {
  it('validates canonical support configuration contains real contact endpoints and no dummy placeholders', () => {
    expect(SUPPORT_CONFIG.phone).toBe('+977 9709066151');
    expect(SUPPORT_CONFIG.whatsappNumber).toBe('9779709066151');
    expect(SUPPORT_CONFIG.whatsappLink).toContain('9779709066151');
    expect(SUPPORT_CONFIG.whatsappLink).not.toContain('9800000000');
    expect(SUPPORT_CONFIG.location).toContain('Old Baneshwor, Kathmandu');
    expect(SUPPORT_CONFIG.email).toBe('support@samyakcee.com.np');
  });

  it('verifies structured data schemas do not contain unverified aggregate ratings or fake review counts', () => {
    const coursesSchema = getFeaturedCoursesSchema();
    for (const listItem of coursesSchema.itemListElement) {
      expect((listItem.item as Record<string, unknown>).aggregateRating).toBeUndefined();
    }

    const productSchema = getProductPricingSchema() as Record<string, unknown>;
    expect(productSchema.aggregateRating).toBeUndefined();

    const reviewsSchema = getTestimonialsReviewsSchema() as Record<string, unknown>;
    expect(reviewsSchema.aggregateRating).toBeUndefined();
  });

  it('reconciles instructors across course landing data with verified faculty and AI personas', () => {
    // CEE Medical instructors
    const ceeInstructors = COURSE_LANDING_DATA['cee-medical-entrance'].instructors;
    expect(ceeInstructors.some((i) => i.name === 'Dr. Samyak Shrestha')).toBe(true);
    expect(ceeInstructors.some((i) => i.name === 'Er. Bishal Adhikari')).toBe(true);

    // SEE Class 10 instructors
    const seeInstructors = COURSE_LANDING_DATA['see-class-10'].instructors;
    expect(seeInstructors.some((i) => i.name === 'Pradeep Poudel Sir')).toBe(true);
    expect(seeInstructors.some((i) => i.name === 'Er. Ramesh Karki')).toBe(true);

    // IELTS separates human faculty from AI persona
    const ieltsInstructors = COURSE_LANDING_DATA['ielts-preparation'].instructors;
    expect(ieltsInstructors.some((i) => i.name === 'Subash Bhattarai')).toBe(true);
    expect(ieltsInstructors.some((i) => i.name.includes('Coach Aria') && i.name.includes('AI'))).toBe(true);
  });

  it('ensures course access duration in landing metadata matches validityDays without contradiction', () => {
    const pythonCourse = COURSE_LANDING_DATA['ai-python-course'];
    expect(pythonCourse.validityDays).toBe(60);

    const accessStat = pythonCourse.stats.find((s) => s.label === 'Course Access');
    expect(accessStat).toBeDefined();
    expect(accessStat!.value).toBe('60 Days');
  });
});

import { resolveCheckoutPlanSku } from '@/lib/courses/catalog';
import { PLAN_DETAILS } from '@/app/checkout/components/FonepayCheckout';
import { inferTrackFromRedirect } from '@/app/onboarding/components/OnboardingClient';

describe('Complete Course Catalog & Enrollment Experience (Prompt 7)', () => {
  it('covers all 4 delivery formats (live_batch, crash_course, subject_course, self_paced_pass) across the 8 approved courses', () => {
    expect(COURSES.length).toBe(8);

    const formats = new Set(COURSES.map((c) => c.courseFormat));
    expect(formats.has('live_batch')).toBe(true);
    expect(formats.has('crash_course')).toBe(true);
    expect(formats.has('subject_course')).toBe(true);
    expect(formats.has('self_paced_pass')).toBe(true);
  });

  it('includes prerequisites, featureLimits, teachingAssetStatus, and interactive sampleQuestion on every canonical course', () => {
    for (const course of COURSES) {
      expect(course.formatLabel).toBeTruthy();
      expect(course.prerequisites.length).toBeGreaterThan(0);
      expect(course.featureLimits.length).toBeGreaterThan(0);
      expect(course.teachingAssetStatus).toBeDefined();
      expect(['ready', 'partial_blocker']).toContain(course.teachingAssetStatus.status);
      expect(course.teachingAssetStatus.summary).toBeTruthy();

      // Sample lesson & question preview
      expect(course.demoLesson.sampleQuestion).toBeDefined();
      expect(course.demoLesson.sampleQuestion!.options.length).toBe(4);
      expect(course.demoLesson.sampleQuestion!.explanation).toBeTruthy();
    }
  });

  it('resolves legacy course slugs and aliases cleanly via getCourseBySlug and resolveCheckoutPlanSku', () => {
    expect(getCourseBySlug('cee-medical-entrance')?.slug).toBe('cee-mbbs-mastery-2026');
    expect(getCourseBySlug('see-class-10')?.slug).toBe('see-class-10-board-topper-batch');
    expect(getCourseBySlug('ielts-preparation')?.slug).toBe('english-ielts-target-8-mastery');
    expect(getCourseBySlug('digital-marketing')?.slug).toBe('digital-marketing-canva-freelancing');
    expect(getCourseBySlug('ai-python-course')?.slug).toBe('digital-python-programming-zero-to-hero');
    expect(getCourseBySlug('crash-course')?.slug).toBe('cee-45-day-crash-course');

    expect(resolveCheckoutPlanSku('cee-medical-entrance')).toBe('cee-mbbs-mastery-2026');
    expect(resolveCheckoutPlanSku('see-class-10')).toBe('see-class-10-board-topper-batch');
    expect(resolveCheckoutPlanSku('ielts-preparation')).toBe('english-ielts-target-8-mastery');
    expect(resolveCheckoutPlanSku('cee-crash-course-deposit')).toBe('cee-crash-course-deposit');
    expect(resolveCheckoutPlanSku(null)).toBe('cee-mbbs-mastery-2026');
  });

  it('enforces 100% SKU and price parity between server PLAN_PRICES and client checkout PLAN_DETAILS', () => {
    for (const [sku, serverPlan] of Object.entries(PLAN_PRICES)) {
      const clientDetail = PLAN_DETAILS[sku];
      expect(clientDetail, `Missing PLAN_DETAILS entry for server SKU: ${sku}`).toBeDefined();
      expect(clientDetail.price).toBe(serverPlan.npr);
    }

    for (const [sku, clientDetail] of Object.entries(PLAN_DETAILS)) {
      const serverPlan = PLAN_PRICES[sku];
      expect(serverPlan, `Missing PLAN_PRICES entry for client SKU: ${sku}`).toBeDefined();
      expect(serverPlan.npr).toBe(clientDetail.price);
    }
  });

  it('infers the matching onboarding track when a user signs up from a checkout redirect URL', () => {
    expect(inferTrackFromRedirect('/checkout?plan=see-class-10-board-topper-batch')).toBe('see_class_10');
    expect(inferTrackFromRedirect('/checkout?plan=english-ielts-target-8-mastery')).toBe('ielts');
    expect(inferTrackFromRedirect('/checkout?plan=digital-python-programming-zero-to-hero')).toBe('artificial_intelligence');
    expect(inferTrackFromRedirect('/checkout?plan=digital-marketing-canva-freelancing')).toBe('digital_marketing');
    expect(inferTrackFromRedirect('/checkout?plan=cee-mbbs-mastery-2026')).toBe('cee_medical');
    expect(inferTrackFromRedirect('/student-dashboard')).toBeNull();
  });
});


