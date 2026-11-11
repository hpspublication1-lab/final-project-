import React from 'react';
import type { Metadata } from 'next';
import FormulaVaultClient from './components/FormulaVaultClient';

export const metadata: Metadata = {
  title: 'Samyak Khazana — Formula & Cheat Sheet Vault',
  description: '1-page condensed formulas, reaction mechanisms, and mnemonics for CEE & SEE rapid revision.',
  alternates: {
    canonical: '/revision',
  },
  openGraph: {
    title: 'Formula & Cheat Sheet Vault — Samyak CEE',
    description: 'Instant 1-page formula cheat sheets for zero panic revision',
    url: '/revision',
  },
};

export default function RevisionPage() {
  return <FormulaVaultClient />;
}
