'use client';

import React from 'react';

interface AnimatePresenceProviderProps {
  children: React.ReactNode;
}

export default function AnimatePresenceProvider({ children }: AnimatePresenceProviderProps) {
  return <>{children}</>;
}
