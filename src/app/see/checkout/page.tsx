import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Enroll in SEE Class 10 Board Master Batch — Samyak Guru',
  description: 'Instant Fonepay payment checkout for SEE Class 10 Board Exam preparation.',
};

export default async function SeeCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const targetPlan =
    plan === '7day' || plan === 'see-opt-math-science-mastery'
      ? 'see-opt-math-science-mastery'
      : 'see-class-10-board-topper-batch';

  redirect(`/checkout?plan=${targetPlan}`);
}
