import { Metadata } from 'next';
import AdminFlashcardsClient from './components/AdminFlashcardsClient';

export const metadata: Metadata = {
  title: 'Flashcards | Admin',
  description: 'Create and manage spaced-repetition flashcards.',
};

export default function AdminFlashcardsPage() {
  return <AdminFlashcardsClient />;
}
