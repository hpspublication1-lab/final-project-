import { redirect } from 'next/navigation';

export default function LearnPage({
  searchParams,
}: {
  searchParams?: Promise<{ program?: string; subject?: string }>;
}) {
  // Gracefully preserve program or subject query params when redirecting to curriculum
  redirect('/subjects');
}
