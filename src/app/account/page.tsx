import React from 'react';
import type { Metadata } from 'next';
import AccountManagementClient from './components/AccountManagementClient';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountManagementClient />;
}
