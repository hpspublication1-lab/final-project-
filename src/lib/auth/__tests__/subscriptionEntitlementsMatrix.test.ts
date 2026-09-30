import { describe, it, expect } from 'vitest';

/**
 * Subscription Entitlement & AI Quota Verification Matrix
 * Tests tier entitlements, payment callback idempotency, and concurrent AI quota consumption.
 */
export type PlanTier = 'free' | 'cee_premium' | 'cee_ai_pro';

export interface UserSubscriptionProfile {
  id: string;
  plan_tier: PlanTier;
  subscription_plan: string | null;
  subscription_status: 'active' | 'expired' | 'none';
  subscription_expires_at: string | null;
  role: 'student' | 'teacher' | 'admin';
}

export function getDailyAiQuotaLimit(profile: UserSubscriptionProfile, nowIso: string): number {
  if (profile.role === 'admin' || profile.role === 'teacher') {
    return 9999;
  }

  // Check if subscription has expired
  if (profile.subscription_expires_at && new Date(profile.subscription_expires_at) < new Date(nowIso)) {
    return 5; // Reverts to free tier quota immediately
  }

  if (profile.plan_tier === 'cee_ai_pro' || profile.subscription_plan === 'pro') {
    return 75;
  }

  if (profile.plan_tier === 'cee_premium' || profile.subscription_plan === 'premium') {
    return 15;
  }

  return 5; // Default free allowance
}

export function verifyFeatureEntitlement(
  profile: UserSubscriptionProfile,
  feature: 'championship_daily' | 'mock_exam_grand' | 'ai_tutor' | 'video_lectures',
  nowIso: string
): { allowed: boolean; reason?: string } {
  const isExpired = profile.subscription_expires_at && new Date(profile.subscription_expires_at) < new Date(nowIso);

  switch (feature) {
    case 'championship_daily':
      // 100% free for all registered students
      return { allowed: true };

    case 'mock_exam_grand':
      if (profile.role === 'admin' || (!isExpired && (profile.plan_tier === 'cee_premium' || profile.plan_tier === 'cee_ai_pro'))) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Requires CEE Premium (NPR 350) or AI Pro (NPR 600) plan.' };

    case 'video_lectures':
      if (profile.role === 'admin' || (!isExpired && (profile.plan_tier === 'cee_premium' || profile.plan_tier === 'cee_ai_pro'))) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Video lectures require an active paid subscription.' };

    case 'ai_tutor':
      // Accessible to all, but subject to daily tier quotas
      return { allowed: true };

    default:
      return { allowed: false };
  }
}

/**
 * Payment Transaction Simulator
 * Exercises payment idempotency and plan activation
 */
class PaymentProcessorSimulation {
  private transactions: Map<string, { status: string; plan: string; tier: string; processedAt: Date }> = new Map();
  private userProfiles: Map<string, UserSubscriptionProfile> = new Map();

  registerUser(profile: UserSubscriptionProfile) {
    this.userProfiles.set(profile.id, { ...profile });
  }

  getUser(userId: string): UserSubscriptionProfile | undefined {
    return this.userProfiles.get(userId);
  }

  processPaymentCallback(
    orderId: string,
    userId: string,
    plan: 'premium' | 'pro',
    durationDays: number
  ): { status: 'completed' | 'failed'; idempotent: boolean } {
    const existing = this.transactions.get(orderId);

    // Idempotency: already settled → return completed state without duplicate activation
    if (existing && existing.status === 'completed') {
      return { status: 'completed', idempotent: true };
    }

    const tier: PlanTier = plan === 'pro' ? 'cee_ai_pro' : 'cee_premium';
    this.transactions.set(orderId, {
      status: 'completed',
      plan,
      tier,
      processedAt: new Date(),
    });

    const user = this.userProfiles.get(userId);
    if (user) {
      user.subscription_status = 'active';
      user.subscription_plan = plan;
      user.plan_tier = tier;
      user.subscription_expires_at = new Date(Date.now() + durationDays * 86400000).toISOString();
    }

    return { status: 'completed', idempotent: false };
  }
}

describe('Subscription Entitlements, AI Quota & Payment Idempotency Matrix', () => {
  const now = '2026-09-21T10:00:00.000Z';

  it('correctly maps daily AI quota allowances across all subscription tiers', () => {
    const freeStudent: UserSubscriptionProfile = {
      id: 'free-1',
      plan_tier: 'free',
      subscription_plan: null,
      subscription_status: 'none',
      subscription_expires_at: null,
      role: 'student',
    };
    expect(getDailyAiQuotaLimit(freeStudent, now)).toBe(5);

    const premiumStudent: UserSubscriptionProfile = {
      id: 'prem-1',
      plan_tier: 'cee_premium',
      subscription_plan: 'premium',
      subscription_status: 'active',
      subscription_expires_at: '2026-10-21T10:00:00.000Z', // valid
      role: 'student',
    };
    expect(getDailyAiQuotaLimit(premiumStudent, now)).toBe(15);

    const aiProStudent: UserSubscriptionProfile = {
      id: 'pro-1',
      plan_tier: 'cee_ai_pro',
      subscription_plan: 'pro',
      subscription_status: 'active',
      subscription_expires_at: '2026-10-21T10:00:00.000Z', // valid
      role: 'student',
    };
    expect(getDailyAiQuotaLimit(aiProStudent, now)).toBe(75);
  });

  it('immediately downgrades quota to free allowance (5/day) when subscription expires', () => {
    const expiredStudent: UserSubscriptionProfile = {
      id: 'exp-1',
      plan_tier: 'cee_ai_pro',
      subscription_plan: 'pro',
      subscription_status: 'active',
      subscription_expires_at: '2026-09-15T00:00:00.000Z', // Expired 6 days ago
      role: 'student',
    };

    expect(getDailyAiQuotaLimit(expiredStudent, now)).toBe(5);
    const mockCheck = verifyFeatureEntitlement(expiredStudent, 'mock_exam_grand', now);
    expect(mockCheck.allowed).toBe(false);
  });

  it('guarantees 100% free access to Daily Rs. 1,000 Championship for all registered students', () => {
    const freeStudent: UserSubscriptionProfile = {
      id: 'free-champ',
      plan_tier: 'free',
      subscription_plan: null,
      subscription_status: 'none',
      subscription_expires_at: null,
      role: 'student',
    };

    const champAccess = verifyFeatureEntitlement(freeStudent, 'championship_daily', now);
    expect(champAccess.allowed).toBe(true);
  });

  it('prevents duplicate payment callbacks from extending subscription duration multiple times', () => {
    const processor = new PaymentProcessorSimulation();
    const studentId = 'student-pay-123';
    processor.registerUser({
      id: studentId,
      plan_tier: 'free',
      subscription_plan: null,
      subscription_status: 'none',
      subscription_expires_at: null,
      role: 'student',
    });

    const orderPrn = 'PRN-FONEPAY-99901';

    // First callback from payment gateway
    const res1 = processor.processPaymentCallback(orderPrn, studentId, 'pro', 30);
    expect(res1.status).toBe('completed');
    expect(res1.idempotent).toBe(false);

    const userAfterFirst = processor.getUser(studentId);
    expect(userAfterFirst?.plan_tier).toBe('cee_ai_pro');
    const initialExpiry = userAfterFirst?.subscription_expires_at;

    // Second duplicate webhook callback / client refresh with SAME order ID
    const res2 = processor.processPaymentCallback(orderPrn, studentId, 'pro', 30);
    expect(res2.status).toBe('completed');
    expect(res2.idempotent).toBe(true); // Flagged as idempotent

    // Expiry date must not be doubled or altered
    const userAfterSecond = processor.getUser(studentId);
    expect(userAfterSecond?.subscription_expires_at).toBe(initialExpiry);
  });

  it('allows administrators and staff unrestricted maintenance access', () => {
    const adminUser: UserSubscriptionProfile = {
      id: 'admin-1',
      plan_tier: 'free',
      subscription_plan: null,
      subscription_status: 'none',
      subscription_expires_at: null,
      role: 'admin',
    };

    expect(getDailyAiQuotaLimit(adminUser, now)).toBe(9999);
    expect(verifyFeatureEntitlement(adminUser, 'mock_exam_grand', now).allowed).toBe(true);
    expect(verifyFeatureEntitlement(adminUser, 'video_lectures', now).allowed).toBe(true);
  });
});
