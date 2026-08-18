import mixpanel from 'mixpanel-browser';

const TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '';
let initialized = false;

export function initMixpanel() {
  if (initialized || !TOKEN || typeof window === 'undefined') return;
  mixpanel.init(TOKEN, {
    debug: process.env.NODE_ENV === 'development',
    track_pageview: false, // we handle manually
    persistence: 'localStorage',
    ignore_dnt: false,
  });
  initialized = true;
}

export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (!initialized || typeof window === 'undefined') return;
  try {
    mixpanel.track(eventName, properties);
  } catch {
    // silently fail
  }
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (!initialized || typeof window === 'undefined') return;
  try {
    mixpanel.identify(userId);
    if (traits) {
      mixpanel.people.set(traits);
    }
  } catch {
    // silently fail
  }
}

export function resetUser() {
  if (!initialized || typeof window === 'undefined') return;
  try {
    mixpanel.reset();
  } catch {
    // silently fail
  }
}

export function trackPageView(pageName: string, properties?: Record<string, unknown>) {
  trackEvent('Page Viewed', { page: pageName, ...properties });
}

// Predefined event helpers
export const Analytics = {
  // Auth events
  signedUp: (method: string) => trackEvent('Signed Up', { method }),
  loggedIn: (method: string) => trackEvent('Logged In', { method }),
  loggedOut: () => trackEvent('Logged Out'),
  passwordResetRequested: () => trackEvent('Password Reset Requested'),

  // Navigation / page views
  pageViewed: (page: string, props?: Record<string, unknown>) => trackPageView(page, props),

  // Practice / exam events
  practiceStarted: (subject: string, chapter?: string) =>
    trackEvent('Practice Started', { subject, chapter }),
  practiceCompleted: (subject: string, score: number, total: number) =>
    trackEvent('Practice Completed', { subject, score, total, accuracy: total > 0 ? Math.round((score / total) * 100) : 0 }),
  mockTestStarted: (examName: string) => trackEvent('Mock Test Started', { exam_name: examName }),
  mockTestCompleted: (examName: string, score: number, total: number) =>
    trackEvent('Mock Test Completed', { exam_name: examName, score, total, accuracy: total > 0 ? Math.round((score / total) * 100) : 0 }),

  // Battle arena events
  battleJoined: (roomId: string) => trackEvent('Battle Joined', { room_id: roomId }),
  battleCompleted: (roomId: string, result: 'win' | 'loss' | 'draw') =>
    trackEvent('Battle Completed', { room_id: roomId, result }),

  // AI tools events
  aiTutorQueried: (subject?: string) => trackEvent('AI Tutor Queried', { subject }),
  mcqGenerated: (subject: string, count: number) =>
    trackEvent('MCQ Generated', { subject, count }),
  mistakeAnalysed: () => trackEvent('Mistake Analyser Used'),
  studyPlanGenerated: () => trackEvent('Study Plan Generated'),

  // Content events
  videoWatched: (videoTitle: string, subject?: string) =>
    trackEvent('Video Watched', { video_title: videoTitle, subject }),
  liveClassJoined: (className: string) => trackEvent('Live Class Joined', { class_name: className }),
  subjectOpened: (subject: string) => trackEvent('Subject Opened', { subject }),

  // Subscription / billing events
  planUpgradeClicked: (plan: string) => trackEvent('Plan Upgrade Clicked', { plan }),
  activationCodeUsed: () => trackEvent('Activation Code Used'),
};
