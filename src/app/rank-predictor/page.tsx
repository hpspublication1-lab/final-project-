import React from 'react';
import type { Metadata } from 'next';
import RankPredictorClient from './components/RankPredictorClient';

export const metadata: Metadata = {
  title: 'CEE All-Nepal Rank Predictor 2083 | Medical College Seat Cutoff Calculator',
  description:
    'Calculate your estimated Nepal CEE merit rank, percentile, and admission probability at Maharajgunj (IOM), BPKIHS Dharan, Patan Academy (PAHS), and private medical colleges with reservation quotas.',
  alternates: {
    canonical: '/rank-predictor',
  },
  openGraph: {
    title: 'CEE All-Nepal Rank Predictor & College Cutoff Calculator',
    description:
      'Enter your CEE score to calculate your projected merit rank, percentile, and government scholarship seat chances at IOM, BPKIHS, and PAHS.',
    url: '/rank-predictor',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'Samyak CEE All-Nepal Rank Predictor',
      },
    ],
  },
};

export default function RankPredictorPage() {
  return <RankPredictorClient />;
}
