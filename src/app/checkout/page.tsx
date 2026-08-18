import { Metadata } from 'next';
import FonepayCheckout from './components/FonepayCheckout';

export const metadata: Metadata = {
  title: 'Checkout · Samyak CEE',
  description: 'Complete your Samyak CEE subscription with Fonepay.',
};

// Known SKUs (see PLAN_PRICES). The server re-validates, so an unknown value
// here just falls back to the crash course.
const KNOWN_PLANS = new Set([
  'student-monthly',
  'student-yearly',
  'pro-monthly',
  'pro-yearly',
  'crash-course',
]);

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const selected = plan && KNOWN_PLANS.has(plan) ? plan : 'crash-course';
  return <FonepayCheckout plan={selected} />;
}
