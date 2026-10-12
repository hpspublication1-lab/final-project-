import { Metadata } from 'next';
import FonepayCheckout from './components/FonepayCheckout';
import { PLAN_PRICES } from '@/lib/payments/gateways';
import { resolveCheckoutPlanSku } from '@/lib/courses/catalog';

export const metadata: Metadata = {
  title: 'Secure Checkout — Samyak Guru',
  description: 'Complete your enrollment with instant Fonepay QR or verified bank transfer.',
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const normalizedPlan = resolveCheckoutPlanSku(plan);
  const selected = PLAN_PRICES[normalizedPlan] ? normalizedPlan : 'cee-mbbs-mastery-2026';
  return <FonepayCheckout plan={selected} />;
}
