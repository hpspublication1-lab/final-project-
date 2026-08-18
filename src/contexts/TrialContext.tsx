'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const TRIAL_DURATION_SECONDS = 15 * 60; // 15 minutes = 900 seconds
const STORAGE_KEY = 'samyak_vip_trial_start_v1';
const WELCOME_SEEN_KEY = 'samyak_vip_trial_welcome_seen_v1';
const EXPIRED_SEEN_KEY = 'samyak_vip_trial_expired_seen_v1';

interface TrialContextType {
  isTrialActive: boolean;
  timeLeftSeconds: number;
  formattedTime: string;
  showWelcomeModal: boolean;
  showExpiredModal: boolean;
  dismissWelcomeModal: () => void;
  dismissExpiredModal: () => void;
  resetTrial: () => void;
}

const TrialContext = createContext<TrialContextType>({
  isTrialActive: true,
  timeLeftSeconds: TRIAL_DURATION_SECONDS,
  formattedTime: '15:00',
  showWelcomeModal: false,
  showExpiredModal: false,
  dismissWelcomeModal: () => {},
  dismissExpiredModal: () => {},
  resetTrial: () => {},
});

export const useTrial = () => useContext(TrialContext);

export const TrialProvider = ({ children }: { children: React.ReactNode }) => {
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(TRIAL_DURATION_SECONDS);
  const [isTrialActive, setIsTrialActive] = useState<boolean>(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);
  const [showExpiredModal, setShowExpiredModal] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let startTimeStr = localStorage.getItem(STORAGE_KEY);
    let startTime = startTimeStr ? parseInt(startTimeStr, 10) : 0;

    // First time visitor
    if (!startTime || isNaN(startTime)) {
      startTime = Date.now();
      localStorage.setItem(STORAGE_KEY, String(startTime));
      const welcomeSeen = localStorage.getItem(WELCOME_SEEN_KEY);
      if (!welcomeSeen) {
        setShowWelcomeModal(true);
      }
    }

    const calculateTimeLeft = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, TRIAL_DURATION_SECONDS - elapsed);
      setTimeLeftSeconds(remaining);
      const active = remaining > 0;
      setIsTrialActive(active);

      if (!active && remaining === 0) {
        const expiredSeen = localStorage.getItem(EXPIRED_SEEN_KEY);
        if (!expiredSeen) {
          setShowExpiredModal(true);
        }
      }
    };

    calculateTimeLeft();
    setInitialized(true);

    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  const dismissWelcomeModal = () => {
    setShowWelcomeModal(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(WELCOME_SEEN_KEY, 'true');
    }
  };

  const dismissExpiredModal = () => {
    setShowExpiredModal(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(EXPIRED_SEEN_KEY, 'true');
    }
  };

  const resetTrial = () => {
    if (typeof window !== 'undefined') {
      const now = Date.now();
      localStorage.setItem(STORAGE_KEY, String(now));
      localStorage.removeItem(WELCOME_SEEN_KEY);
      localStorage.removeItem(EXPIRED_SEEN_KEY);
      setTimeLeftSeconds(TRIAL_DURATION_SECONDS);
      setIsTrialActive(true);
      setShowWelcomeModal(true);
      setShowExpiredModal(false);
    }
  };

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <TrialContext.Provider
      value={{
        isTrialActive: initialized ? isTrialActive : true,
        timeLeftSeconds,
        formattedTime,
        showWelcomeModal,
        showExpiredModal,
        dismissWelcomeModal,
        dismissExpiredModal,
        resetTrial,
      }}
    >
      {children}
    </TrialContext.Provider>
  );
};
