import { Metadata } from 'next';
import FonepayCheckout from './components/FonepayCheckout';
import { PLAN_PRICES } from '@/lib/payments/gateways';

export const metadata: Metadata = {
  title: 'Secure Checkout — Samyak Guru',
  description: 'Complete your enrollment with instant Fonepay QR payment.',
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const selected = plan && PLAN_PRICES[plan] ? plan : 'pro-monthly';
  return <FonepayCheckout plan={selected} />;
}
