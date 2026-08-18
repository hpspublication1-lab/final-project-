import React from 'react';
import type { Metadata } from 'next';
import MatchLobbyClient from './components/MatchLobbyClient';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function MatchLobbyPage() {
  return <MatchLobbyClient />;
}
