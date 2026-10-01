import { redirect } from 'next/navigation';

export default function MockRedirectPage() {
  redirect('/mock-tests');
}
