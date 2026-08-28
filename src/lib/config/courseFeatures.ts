import { CanonicalCourseId } from '@/contexts/ProgramContext';

export type CourseFeatureKey =
  | 'continue_learning'
  | 'videos'
  | 'notes'
  | 'pdfs'
  | 'mcq'
  | 'mock_tests'
  | 'model_questions'
  | 'subjective_practice'
  | 'progress'
  | 'performance'
  | 'analytics'
  | 'leaderboard'
  | 'exam_countdown'
  | 'weak_topics'
  | 'listening'
  | 'reading'
  | 'writing'
  | 'speaking'
  | 'band_score'
  | 'vocab_grammar'
  | 'marketing_modules'
  | 'projects'
  | 'assignments'
  | 'templates'
  | 'resources'
  | 'certification'
  | 'ai_tools'
  | 'prompt_studio'
  | 'automations'
  | 'announcements';

export interface CoursePortalConfig {
  id: CanonicalCourseId;
  brandName: string;
  courseTitle: string;
  portalSubtitle: string;
  targetBadge: string;
  themeColor: string;
  accentGradient: string;
  borderAccent: string;
  features: CourseFeatureKey[];
  defaultSubjects: {
    id: string;
    name: string;
    icon: string;
    chaptersCount: number;
    weightage?: string;
    color: string;
  }[];
  quickActions: {
    key: string;
    label: string;
    desc: string;
    href: string;
    iconName: string;
    badge?: string;
  }[];
  announcements: {
    id: string;
    title: string;
    date: string;
    tag: string;
    important?: boolean;
  }[];
}

export const COURSE_PORTAL_CONFIGS: Record<CanonicalCourseId, CoursePortalConfig> = {
  see_class_10: {
    id: 'see_class_10',
    brandName: 'Samyak SEE',
    courseTitle: 'SAMYAK SEE BOARD MASTERY',
    portalSubtitle: 'Comprehensive Class 10 Secondary Education Exam Preparation & GPA 4.0 Tracker',
    targetBadge: 'Target: GPA 4.0 · NEB Board',
    themeColor: 'emerald',
    accentGradient: 'from-emerald-600 via-teal-600 to-emerald-700',
    borderAccent: 'border-emerald-500/30',
    features: [
      'continue_learning',
      'videos',
      'notes',
      'pdfs',
      'mcq',
      'mock_tests',
      'model_questions',
      'subjective_practice',
      'progress',
      'performance',
      'announcements',
    ],
    defaultSubjects: [
      { id: 'sci_phy', name: 'Physics (Science)', icon: '⚡', chaptersCount: 8, weightage: '25 Marks', color: 'text-emerald-500' },
      { id: 'sci_chem', name: 'Chemistry (Science)', icon: '🧪', chaptersCount: 6, weightage: '25 Marks', color: 'text-teal-500' },
      { id: 'sci_bio', name: 'Biology & Astronomy', icon: '🔬', chaptersCount: 10, weightage: '50 Marks', color: 'text-cyan-500' },
      { id: 'math_comp', name: 'Compulsory Mathematics', icon: '📐', chaptersCount: 20, weightage: '100 Marks', color: 'text-blue-500' },
      { id: 'math_opt', name: 'Optional Mathematics', icon: '📊', chaptersCount: 16, weightage: '100 Marks', color: 'text-purple-500' },
      { id: 'english', name: 'English (Reading & Writing)', icon: '📚', chaptersCount: 15, weightage: '100 Marks', color: 'text-amber-500' },
      { id: 'nepali', name: 'Compulsory Nepali (व्याकरण र रचना)', icon: '🇳🇵', chaptersCount: 16, weightage: '100 Marks', color: 'text-red-500' },
      { id: 'social', name: 'Social Studies & Life Skills', icon: '🌍', chaptersCount: 18, weightage: '100 Marks', color: 'text-orange-500' },
    ],
    quickActions: [
      { key: 'qa-subjective', label: 'AI Handwritten Grading', desc: 'Instant photo check with step marks', href: '/practice/subjective', iconName: 'Sparkles', badge: 'AI RUBRIC' },
      { key: 'qa-model-papers', label: '10-Year Model Sets', desc: 'NEB past question solutions', href: '/mock-tests', iconName: 'FileText', badge: 'SOLVED' },
      { key: 'qa-notes', label: 'Formulas & Chapter PDFs', desc: 'Quick revision sheets', href: '/subjects', iconName: 'BookOpen' },
      { key: 'qa-mcq', label: 'Class 10 MCQ Practice', desc: 'Chapter-wise test drills', href: '/practice', iconName: 'Zap' },
    ],
    announcements: [
      { id: 'a-1', title: 'NEB Class 10 Model Examination Schedule Announced', date: 'Session 2082/2083', tag: 'NEB Routine', important: true },
      { id: 'a-2', title: 'New Handwritten AI Subjective Grader active for Math & Science', date: 'Updated Today', tag: 'AI Feature' },
      { id: 'a-3', title: 'Chapter-wise Formula Sheets available in PDF section', date: 'Free Download', tag: 'Resources' },
    ],
  },

  cee_medical: {
    id: 'cee_medical',
    brandName: 'Samyak CEE',
    courseTitle: 'SAMYAK CEE MEDICAL ENTRANCE',
    portalSubtitle: 'Medical Education Commission Entrance Exam (MECEE) High-Yield Preparation Hub',
    targetBadge: 'Target: Top 100 Rank · MBBS/BDS',
    themeColor: 'indigo',
    accentGradient: 'from-indigo-600 via-primary to-purple-700',
    borderAccent: 'border-indigo-500/30',
    features: [
      'continue_learning',
      'videos',
      'notes',
      'mcq',
      'mock_tests',
      'analytics',
      'leaderboard',
      'exam_countdown',
      'weak_topics',
      'announcements',
    ],
    defaultSubjects: [
      { id: 'zoology', name: 'Zoology', icon: '🦁', chaptersCount: 22, weightage: '40 Qs · 40 Marks', color: 'text-indigo-500' },
      { id: 'botany', name: 'Botany', icon: '🌿', chaptersCount: 20, weightage: '40 Qs · 40 Marks', color: 'text-emerald-500' },
      { id: 'chemistry', name: 'Chemistry', icon: '🧪', chaptersCount: 26, weightage: '50 Qs · 50 Marks', color: 'text-teal-500' },
      { id: 'physics', name: 'Physics', icon: '⚡', chaptersCount: 24, weightage: '50 Qs · 50 Marks', color: 'text-blue-500' },
      { id: 'mat', name: 'Mental Agility (MAT)', icon: '🧠', chaptersCount: 12, weightage: '20 Qs · 20 Marks', color: 'text-purple-500' },
    ],
    quickActions: [
      { key: 'qa-practice', label: '15,000+ CEE MCQs', desc: 'Filter by chapter & difficulty', href: '/practice', iconName: 'Zap', badge: '15K+ Qs' },
      { key: 'qa-mock', label: '200-Q Timed MEC Mock', desc: '180 min simulation with negative marks', href: '/mock-tests', iconName: 'FileText', badge: 'FULL MOCK' },
      { key: 'qa-battle', label: '1v1 Battle Arena', desc: 'Real-time 2-player matchmaking', href: '/battle-arena', iconName: 'Swords', badge: 'LIVE MATCH' },
      { key: 'qa-flashcards', label: 'SM-2 Flashcards', desc: 'Spaced repetition high-yield recall', href: '/flashcards', iconName: 'Brain' },
    ],
    announcements: [
      { id: 'c-1', title: 'MEC Entrance Exam Countdown is Live — 200 Question Mock Sets Ready', date: 'MEC Session 2026', tag: 'Exam Alert', important: true },
      { id: 'c-2', title: 'Grand All-Nepal CEE Mock Test this Saturday at 1:00 PM', date: 'Weekly Routine', tag: 'Live Exam' },
      { id: 'c-3', title: 'High-Yield Chemistry Organic Mechanism PDFs updated', date: 'Revision Notes', tag: 'Notes' },
    ],
  },

  ielts: {
    id: 'ielts',
    brandName: 'Samyak IELTS',
    courseTitle: 'SAMYAK IELTS ENGLISH MASTERY',
    portalSubtitle: 'Target Band 8.0+ Language Learning Hub with Real-Time AI Examiner Evaluation',
    targetBadge: 'Target: Band 8.0+ · CEFR C1/C2',
    themeColor: 'amber',
    accentGradient: 'from-amber-600 via-orange-600 to-amber-700',
    borderAccent: 'border-amber-500/30',
    features: [
      'continue_learning',
      'videos',
      'listening',
      'reading',
      'writing',
      'speaking',
      'band_score',
      'vocab_grammar',
      'resources',
      'announcements',
    ],
    defaultSubjects: [
      { id: 'speaking', name: 'Speaking Module (Parts 1, 2, 3)', icon: '🗣️', chaptersCount: 18, weightage: 'Band 9.0 Max', color: 'text-amber-500' },
      { id: 'writing_1', name: 'Writing Task 1 (Charts & Reports)', icon: '📊', chaptersCount: 12, weightage: '150 Words', color: 'text-blue-500' },
      { id: 'writing_2', name: 'Writing Task 2 (Academic Essay)', icon: '✍️', chaptersCount: 16, weightage: '250 Words', color: 'text-purple-500' },
      { id: 'listening', name: 'Listening Passages (Sections 1-4)', icon: '🎧', chaptersCount: 20, weightage: '40 Questions', color: 'text-emerald-500' },
      { id: 'reading', name: 'Reading Skimming & GT Texts', icon: '📖', chaptersCount: 22, weightage: '40 Questions', color: 'text-rose-500' },
      { id: 'awl_vocab', name: 'Academic Word List (AWL) & Collocations', icon: '💡', chaptersCount: 25, weightage: 'Lexical Bank', color: 'text-teal-500' },
    ],
    quickActions: [
      { key: 'qa-speak', label: 'AI Speaking Cue Card', desc: 'Voice recording with fluency & pronunciation', href: '/english', iconName: 'Mic', badge: 'AI VOICE' },
      { key: 'qa-write', label: 'Writing Task 1 & 2 Grader', desc: 'Instant Band 8.0+ rubric essay feedback', href: '/english', iconName: 'FileEdit', badge: 'ESSAY RUBRIC' },
      { key: 'qa-listen', label: 'Listening Audio Simulators', desc: 'Cambridge standard 40-Q audio drills', href: '/english', iconName: 'Headphones' },
      { key: 'qa-read', label: 'Speed Reading Passages', desc: 'True/False/Not Given timed drills', href: '/english', iconName: 'BookOpen' },
    ],
    announcements: [
      { id: 'i-1', title: 'New 2026 Cambridge Speaking Part 2 Cue Cards added to AI Examiner', date: 'New Prompts', tag: 'Speaking', important: true },
      { id: 'i-2', title: 'Band 8.5+ Sample Academic Essays available for download', date: 'Study Materials', tag: 'Writing' },
      { id: 'i-3', title: 'Top 500 Academic Word List (AWL) Flashcard deck now live', date: 'Vocabulary', tag: 'Vocab' },
    ],
  },

  digital_marketing: {
    id: 'digital_marketing',
    brandName: 'Samyak Digital',
    courseTitle: 'SAMYAK DIGITAL MARKETING SKILLS',
    portalSubtitle: 'Target Band 8.0+ Language Learning Hub with Real-Time AI Examiner Evaluation',
    targetBadge: 'Target: Band 8.0+ · CEFR C1/C2',
    themeColor: 'amber',
    accentGradient: 'from-amber-600 via-orange-600 to-amber-700',
    borderAccent: 'border-amber-500/30',
    features: [
      'continue_learning',
      'videos',
      'listening',
      'reading',
      'writing',
      'speaking',
      'band_score',
      'vocab_grammar',
      'resources',
      'announcements',
    ],
    defaultSubjects: [
      { id: 'speaking', name: 'Speaking Module (Parts 1, 2, 3)', icon: '🗣️', chaptersCount: 18, weightage: 'Band 9.0 Max', color: 'text-amber-500' },
      { id: 'writing_1', name: 'Writing Task 1 (Charts & Reports)', icon: '📊', chaptersCount: 12, weightage: '150 Words', color: 'text-blue-500' },
      { id: 'writing_2', name: 'Writing Task 2 (Academic Essay)', icon: '✍️', chaptersCount: 16, weightage: '250 Words', color: 'text-purple-500' },
      { id: 'listening', name: 'Listening Passages (Sections 1-4)', icon: '🎧', chaptersCount: 20, weightage: '40 Questions', color: 'text-emerald-500' },
      { id: 'reading', name: 'Reading Skimming & GT Texts', icon: '📖', chaptersCount: 22, weightage: '40 Questions', color: 'text-rose-500' },
      { id: 'awl_vocab', name: 'Academic Word List (AWL) & Collocations', icon: '💡', chaptersCount: 25, weightage: 'Lexical Bank', color: 'text-teal-500' },
    ],
    quickActions: [
      { key: 'qa-speak', label: 'AI Speaking Cue Card', desc: 'Voice recording with fluency & pronunciation', href: '/english', iconName: 'Mic', badge: 'AI VOICE' },
      { key: 'qa-write', label: 'Writing Task 1 & 2 Grader', desc: 'Instant Band 8.0+ rubric essay feedback', href: '/english', iconName: 'FileEdit', badge: 'ESSAY RUBRIC' },
      { key: 'qa-listen', label: 'Listening Audio Simulators', desc: 'Cambridge standard 40-Q audio drills', href: '/english', iconName: 'Headphones' },
      { key: 'qa-read', label: 'Speed Reading Passages', desc: 'True/False/Not Given timed drills', href: '/english', iconName: 'BookOpen' },
    ],
    announcements: [
      { id: 'i-1', title: 'New 2026 Cambridge Speaking Part 2 Cue Cards added to AI Examiner', date: 'New Prompts', tag: 'Speaking', important: true },
      { id: 'i-2', title: 'Band 8.5+ Sample Academic Essays available for download', date: 'Study Materials', tag: 'Writing' },
      { id: 'i-3', title: 'Top 500 Academic Word List (AWL) Flashcard deck now live', date: 'Vocabulary', tag: 'Vocab' },
    ],
  },

  digital_marketing: {
    id: 'digital_marketing',
    brandName: 'Samyak Digital',
    courseTitle: 'SAMYAK DIGITAL MARKETING SKILLS',
    portalSubtitle: 'Practical High-ROAS Advertising, Content Growth, SEO & Freelance Client Acquisition',
    targetBadge: 'Career Track · Freelance Ready',
    themeColor: 'rose',
    accentGradient: 'from-rose-600 via-pink-600 to-rose-700',
    borderAccent: 'border-rose-500/30',
    features: [
      'continue_learning',
      'videos',
      'marketing_modules',
      'projects',
      'assignments',
      'templates',
      'resources',
      'certification',
      'announcements',
    ],
    defaultSubjects: [
      { id: 'meta_ads', name: 'Meta & Instagram Ads Scaling', icon: '📱', chaptersCount: 18, weightage: 'High ROAS', color: 'text-blue-500' },
      { id: 'tiktok_growth', name: 'TikTok & Short-Form Viral Hooks', icon: '🎥', chaptersCount: 14, weightage: 'Organic Reach', color: 'text-rose-500' },
      { id: 'seo_google', name: 'Search Engine Optimization (SEO)', icon: '🔍', chaptersCount: 16, weightage: 'Rank #1 Google', color: 'text-emerald-500' },
      { id: 'copy_funnels', name: 'High-Converting Copywriting & Funnels', icon: '📝', chaptersCount: 15, weightage: 'Conversion %', color: 'text-amber-500' },
      { id: 'freelance_clients', name: 'Upwork, Fiverr & Global Client Acquisition', icon: '💼', chaptersCount: 12, weightage: 'Client Retainers', color: 'text-purple-500' },
      { id: 'analytics_ga4', name: 'Google Analytics 4 & Conversion Tracking', icon: '📊', chaptersCount: 10, weightage: 'Data Attribution', color: 'text-teal-500' },
    ],
    quickActions: [
      { key: 'qa-templates', label: '100+ Ad Swipe Files', desc: 'Copy-paste winning ad copy & funnels', href: '/courses?sector=digital_marketing', iconName: 'FolderKanban', badge: '100+ FILES' },
      { key: 'qa-projects', label: 'Live Campaign Projects', desc: 'Set up real Meta & TikTok campaigns', href: '/courses?sector=digital_marketing', iconName: 'Target', badge: 'PORTFOLIO' },
      { key: 'qa-seo', label: 'SEO Audit Playbooks', desc: 'Keyword research & on-page checklists', href: '/courses?sector=digital_marketing', iconName: 'Search' },
      { key: 'qa-cert', label: 'Professional Certificate', desc: 'Earn verified Digital Marketer badge', href: '/account', iconName: 'Award' },
    ],
    announcements: [
      { id: 'm-1', title: '2026 Meta Ads Scaling Blueprint updated with Advantage+ budget rules', date: 'Updated Playbook', tag: 'Paid Ads', important: true },
      { id: 'm-2', title: 'Download the 50 TikTok Viral Hook Templates in the Resources Hub', date: 'Swipe Files', tag: 'Content' },
      { id: 'm-3', title: 'Upwork Proposal Submission assignment review window is open', date: 'Live Assignment', tag: 'Freelance' },
    ],
  },

  artificial_intelligence: {
    id: 'artificial_intelligence',
    brandName: 'Samyak AI',
    courseTitle: 'SAMYAK AI ACADEMY',
    portalSubtitle: 'Modern Generative AI, Prompt Engineering Studio, Python for AI & Automation Agents',
    targetBadge: 'Next-Gen Tech · AI Specialist',
    themeColor: 'purple',
    accentGradient: 'from-purple-600 via-indigo-600 to-purple-800',
    borderAccent: 'border-purple-500/30',
    features: [
      'continue_learning',
      'videos',
      'prompt_studio',
      'ai_tools',
      'automations',
      'projects',
      'assignments',
      'resources',
      'certification',
      'announcements',
    ],
    defaultSubjects: [
      { id: 'prompt_eng', name: 'Prompt Engineering Studio (RTF & Few-Shot)', icon: '🤖', chaptersCount: 16, weightage: 'Live Sandbox', color: 'text-purple-500' },
      { id: 'gen_tools', name: 'Modern AI Tools (ChatGPT, Claude & Midjourney)', icon: '⚡', chaptersCount: 14, weightage: '10x Productivity', color: 'text-indigo-500' },
      { id: 'python_ai', name: 'Python for AI, Web Scraping & Bots', icon: '🐍', chaptersCount: 22, weightage: '5 Real Projects', color: 'text-emerald-500' },
      { id: 'automation_agents', name: 'No-Code AI Automation & Multi-Agents', icon: '⚙️', chaptersCount: 15, weightage: 'Make/n8n Bots', color: 'text-cyan-500' },
      { id: 'custom_gpts', name: 'Building Custom GPTs & Knowledgebases', icon: '🧠', chaptersCount: 12, weightage: 'RAG Systems', color: 'text-amber-500' },
      { id: 'freelance_ai', name: 'Monetizing AI Skills & Freelance Agency', icon: '🚀', chaptersCount: 10, weightage: 'Commercial AI', color: 'text-rose-500' },
    ],
    quickActions: [
      { key: 'qa-prompt', label: 'Live Prompt Studio Sandbox', desc: 'Test and grade prompts with AI feedback', href: '/digital', iconName: 'Bot', badge: 'SANDBOX' },
      { key: 'qa-python', label: '5 Python AI Projects', desc: 'Build bots, scrapers & agent workflows', href: '/courses?sector=artificial_intelligence', iconName: 'Code', badge: '5 PROJECTS' },
      { key: 'qa-agents', label: 'No-Code Automation Suite', desc: 'Connect Make.com & webhooks', href: '/courses?sector=artificial_intelligence', iconName: 'Terminal' },
      { key: 'qa-vault', label: '1,000+ Prompt Vault', desc: 'Tested system prompts for business & study', href: '/digital', iconName: 'Layers' },
    ],
    announcements: [
      { id: 'ai-1', title: 'Live Prompt Sandbox updated with Claude 3.5 & GPT-4o evaluation', date: 'Model Update', tag: 'Prompt Studio', important: true },
      { id: 'ai-2', title: 'New hands-on project released: Build an Autonomous Web Research Agent in Python', date: 'Coding Project', tag: 'Python' },
      { id: 'ai-3', title: 'Prompt Engineering Certification exam now available for enrolled students', date: 'Certificate', tag: 'Exam' },
    ],
  },
};

export function hasCourseFeature(courseId: CanonicalCourseId, feature: CourseFeatureKey): boolean {
  const config = COURSE_PORTAL_CONFIGS[courseId];
  if (!config) return false;
  return config.features.includes(feature);
}
