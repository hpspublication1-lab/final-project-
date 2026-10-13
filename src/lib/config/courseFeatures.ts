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
      { key: 'qa-qbank', label: 'Question Bank (1-4M)', desc: '1, 2, 3, 4 Marks with solutions', href: '/see/question-bank', iconName: 'HelpCircle', badge: '1,2,3,4M' },
      { key: 'qa-digest', label: 'Digest & Formula Bank', desc: 'Download capsules & formula books', href: '/see/question-bank', iconName: 'FileText', badge: 'PDF DIGEST' },
      { key: 'qa-subjective', label: 'AI Handwritten Grading', desc: 'Instant photo check with step marks', href: '/practice/subjective', iconName: 'Sparkles', badge: 'AI RUBRIC' },
      { key: 'qa-model-papers', label: '10-Year Model Sets', desc: 'NEB past question solutions', href: '/mock-tests', iconName: 'FileText', badge: 'SOLVED' },
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

  neb_class_11: {
    id: 'neb_class_11',
    brandName: 'Samyak NEB 11',
    courseTitle: 'SAMYAK NEB CLASS 11 SCIENCE & MATH',
    portalSubtitle: 'NEB Grade 11 Science Foundation, Derivations, Numericals & Entrance Bridge Hub',
    targetBadge: 'Target: GPA 3.85+ · NEB Grade 11',
    themeColor: 'sky',
    accentGradient: 'from-sky-600 via-blue-600 to-indigo-700',
    borderAccent: 'border-sky-500/30',
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
      { id: 'neb11_phy', name: 'Physics (Mechanics, Heat & Optics)', icon: '⚡', chaptersCount: 22, weightage: '75 Marks Theory', color: 'text-sky-500' },
      { id: 'neb11_chem', name: 'Chemistry (Physical, Inorganic & Organic)', icon: '🧪', chaptersCount: 20, weightage: '75 Marks Theory', color: 'text-teal-500' },
      { id: 'neb11_math', name: 'Basic Mathematics (Algebra, Vectors & Calc)', icon: '📐', chaptersCount: 18, weightage: '75 Marks Theory', color: 'text-blue-500' },
      { id: 'neb11_bio', name: 'Biology (Botany & Zoology Class 11)', icon: '🌿', chaptersCount: 18, weightage: '75 Marks Theory', color: 'text-emerald-500' },
      { id: 'neb11_eng', name: 'Compulsory English & Nepali', icon: '📚', chaptersCount: 14, weightage: 'Board Compulsory', color: 'text-amber-500' },
    ],
    quickActions: [
      { key: 'qa-neb11-course', label: 'Class 11 Syllabus & Chapters', desc: 'Derivations, numericals & chapter notes', href: '/courses/neb-class-11-science-mastery', iconName: 'BookOpen', badge: 'NEB 11' },
      { key: 'qa-neb11-subj', label: 'AI Derivation & Numerical Check', desc: 'Instant grading for 5-mark board answers', href: '/practice/subjective', iconName: 'Sparkles', badge: 'AI RUBRIC' },
      { key: 'qa-neb11-mcq', label: 'Entrance Bridge MCQs', desc: 'Class 11 CEE/IOE foundation practice', href: '/practice', iconName: 'Zap', badge: 'BRIDGE' },
      { key: 'qa-neb11-mock', label: 'NEB Grade 11 Model Sets', desc: 'Timed board-pattern terminal exams', href: '/mock-tests', iconName: 'FileText' },
    ],
    announcements: [
      { id: 'n11-1', title: 'NEB Class 11 Physics Mechanics & Heat Derivation Handbook uploaded', date: 'Session 2082/2083', tag: 'Derivations', important: true },
      { id: 'n11-2', title: 'Organic Chemistry IUPAC Nomenclature & GOC Foundation Live Classes active', date: 'Updated Weekly', tag: 'Chemistry' },
      { id: 'n11-3', title: 'Class 11 Terminal Exam Model Question Papers with marking schemes ready', date: 'Model Sets', tag: 'NEB 11' },
    ],
  },

  neb_class_12: {
    id: 'neb_class_12',
    brandName: 'Samyak NEB 12',
    courseTitle: 'SAMYAK NEB CLASS 12 BOARD TOPPER',
    portalSubtitle: 'NEB Class 12 Board Examination Mastery, Past Papers & CEE/IOE Entrance Bridge',
    targetBadge: 'Target: GPA 4.0 · NEB Class 12 Board',
    themeColor: 'blue',
    accentGradient: 'from-blue-600 via-indigo-600 to-blue-800',
    borderAccent: 'border-blue-500/30',
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
      'exam_countdown',
      'announcements',
    ],
    defaultSubjects: [
      { id: 'neb12_phy', name: 'Physics (Electromagnetism & Modern Physics)', icon: '⚡', chaptersCount: 24, weightage: '75 Marks Theory', color: 'text-blue-500' },
      { id: 'neb12_chem', name: 'Chemistry (Organic, Haloalkanes & Physical)', icon: '🧪', chaptersCount: 22, weightage: '75 Marks Theory', color: 'text-teal-500' },
      { id: 'neb12_math', name: 'Mathematics (Calculus, Conics & Vectors)', icon: '📐', chaptersCount: 20, weightage: '75 Marks Theory', color: 'text-indigo-500' },
      { id: 'neb12_bio', name: 'Biology (Genetics, Anatomy & Physiology)', icon: '🧬', chaptersCount: 20, weightage: '75 Marks Theory', color: 'text-emerald-500' },
      { id: 'neb12_bridge', name: 'CEE / IOE Entrance Bridge Capsules', icon: '🎯', chaptersCount: 16, weightage: 'Entrance Prep', color: 'text-purple-500' },
    ],
    quickActions: [
      { key: 'qa-neb12-course', label: 'Class 12 Board Topper Hub', desc: 'Complete syllabus, derivations & Old is Gold', href: '/courses/neb-class-12-board-topper-batch', iconName: 'BookOpen', badge: 'NEB 12' },
      { key: 'qa-neb12-subj', label: 'AI 5-Mark & 8-Mark Grader', desc: 'Handwritten derivation & numerical feedback', href: '/practice/subjective', iconName: 'Sparkles', badge: 'AI RUBRIC' },
      { key: 'qa-neb12-mock', label: 'NEB Class 12 Pre-Board Mocks', desc: 'Full 3-hour board examination sets', href: '/mock-tests', iconName: 'FileText', badge: 'PRE-BOARD' },
      { key: 'qa-neb12-mcq', label: 'CEE / IOE Bridge MCQs', desc: 'High-speed entrance MCQ practice', href: '/practice', iconName: 'Zap' },
    ],
    announcements: [
      { id: 'n12-1', title: 'NEB Class 12 10-Year Solved Past Question Bank (Old is Gold) updated', date: 'Board Exam 2082/2083', tag: 'NEB Board', important: true },
      { id: 'n12-2', title: 'Organic Chemistry Named Reactions & Conversion Roadmaps PDF released', date: 'Revision Capsule', tag: 'Chemistry' },
      { id: 'n12-3', title: 'Pre-Board Subjective Answer Sheet Evaluation open for all Class 12 students', date: 'AI Grading', tag: 'Pre-Board' },
    ],
  },

  ioe_engineering: {
    id: 'ioe_engineering',
    brandName: 'Samyak IOE',
    courseTitle: 'SAMYAK IOE ENGINEERING ENTRANCE',
    portalSubtitle: 'TU IOE Pulchowk, KU & Pokhara University BE Computer-Based Entrance Preparation Hub',
    targetBadge: 'Target: Pulchowk Top Rank · 140 Marks CBT',
    themeColor: 'cyan',
    accentGradient: 'from-cyan-600 via-blue-600 to-indigo-700',
    borderAccent: 'border-cyan-500/30',
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
      { id: 'ioe_math', name: 'Engineering Mathematics (50 Marks)', icon: '📐', chaptersCount: 28, weightage: '50 Marks · High Weight', color: 'text-cyan-500' },
      { id: 'ioe_phy', name: 'Engineering Physics (45 Marks)', icon: '⚡', chaptersCount: 26, weightage: '45 Marks · 1M & 2M Qs', color: 'text-blue-500' },
      { id: 'ioe_chem', name: 'Engineering Chemistry (25 Marks)', icon: '🧪', chaptersCount: 22, weightage: '25 Marks · Fast Recall', color: 'text-teal-500' },
      { id: 'ioe_eng', name: 'English & Engineering Aptitude (20 Marks)', icon: '🔤', chaptersCount: 14, weightage: '20 Marks · Pass Boost', color: 'text-amber-500' },
    ],
    quickActions: [
      { key: 'qa-ioe-course', label: 'IOE Super Target Syllabus', desc: '140-Mark CBT modules & calculator hacks', href: '/courses/ioe-engineering-entrance-2026', iconName: 'BookOpen', badge: 'PULCHOWK' },
      { key: 'qa-ioe-mock', label: '140-Mark IOE CBT Simulator', desc: '2-hour computer test with -10% negative marks', href: '/mock-tests', iconName: 'FileText', badge: 'CBT MOCK' },
      { key: 'qa-ioe-mcq', label: '1-Mark & 2-Mark Engineering Qs', desc: 'Math, Physics & Chemistry speed drills', href: '/practice', iconName: 'Zap', badge: '1M & 2M' },
      { key: 'qa-ioe-battle', label: 'Engineering 1v1 Battle Arena', desc: 'Compete live on Calculus & Mechanics', href: '/battle-arena', iconName: 'Swords' },
    ],
    announcements: [
      { id: 'ioe-1', title: 'IOE Pulchowk 140-Mark Computer-Based Test (CBT) Mock Series 2026 is Live', date: 'IOE Session 2026', tag: 'CBT Simulator', important: true },
      { id: 'ioe-2', title: 'Scientific Calculator (fx-991EX) Matrix, Integration & Complex Number Shortcuts added', date: 'Speed Hacks', tag: 'Mathematics' },
      { id: 'ioe-3', title: '15-Year Solved IOE Past Questions with step-by-step solutions updated', date: 'Question Bank', tag: 'Past Papers' },
    ],
  },

  lok_sewa: {
    id: 'lok_sewa',
    brandName: 'Samyak Lok Sewa',
    courseTitle: 'SAMYAK LOK SEWA AAYOG PREPARATION',
    portalSubtitle: 'Public Service Commission (PSC Nepal) Kharidar, Nayab Subba & Section Officer GK & IQ Hub',
    targetBadge: 'Target: Nijamati Sewa · GK & IQ First Paper',
    themeColor: 'orange',
    accentGradient: 'from-orange-600 via-amber-600 to-red-700',
    borderAccent: 'border-orange-500/30',
    features: [
      'continue_learning',
      'videos',
      'notes',
      'pdfs',
      'mcq',
      'mock_tests',
      'analytics',
      'leaderboard',
      'exam_countdown',
      'weak_topics',
      'announcements',
    ],
    defaultSubjects: [
      { id: 'psc_gk_nepal', name: 'Nepal Geography, History, Culture & Economy', icon: '🇳🇵', chaptersCount: 24, weightage: 'GK High-Yield', color: 'text-orange-500' },
      { id: 'psc_const', name: 'Constitution of Nepal 2072 & Governance Acts', icon: '⚖️', chaptersCount: 16, weightage: 'Ain / Niyamawali', color: 'text-amber-500' },
      { id: 'psc_world_ca', name: 'World GK, UN, SAARC, BIMSTEC & Current Affairs', icon: '🌍', chaptersCount: 18, weightage: 'Samasamayik 2082/83', color: 'text-blue-500' },
      { id: 'psc_iq_verbal', name: 'Verbal & Numerical IQ (Series, Coding, Math)', icon: '🧠', chaptersCount: 20, weightage: '20-Second Tricks', color: 'text-purple-500' },
      { id: 'psc_iq_spatial', name: 'Non-Verbal & Spatial IQ (Matrices & Figures)', icon: '🔷', chaptersCount: 14, weightage: 'Visual Reasoning', color: 'text-emerald-500' },
    ],
    quickActions: [
      { key: 'qa-psc-course', label: 'Lok Sewa GK & IQ Syllabus', desc: 'Kharidar, Na.Su. & Officer First Paper modules', href: '/courses/lok-sewa-aayog-preparation-2082', iconName: 'BookOpen', badge: 'PSC 2082/83' },
      { key: 'qa-psc-mock', label: '45-Min PSC First Paper Mock', desc: 'Timed GK & IQ exam with 20% negative marks', href: '/mock-tests', iconName: 'FileText', badge: 'PSC MOCK' },
      { key: 'qa-psc-mcq', label: 'GK & IQ Rapid Practice', desc: 'Samasamayik, Constitution & IQ drills', href: '/practice', iconName: 'Zap', badge: 'GK + IQ' },
      { key: 'qa-psc-flash', label: 'Constitution & Date Flashcards', desc: 'Memorize articles, treaties & historical dates', href: '/flashcards', iconName: 'Brain' },
    ],
    announcements: [
      { id: 'psc-1', title: 'Monthly Samasamayik (Current Affairs) Digest for 2082/2083 uploaded in PDF & MCQ bank', date: 'Updated Monthly', tag: 'Samasamayik', important: true },
      { id: 'psc-2', title: '50 Full-Length Kharidar, Nayab Subba & Section Officer First Paper Mock Sets live', date: 'PSC Routine', tag: 'First Paper' },
      { id: 'psc-3', title: 'Constitution of Nepal 2072 & Nijamati Sewa Ain Audio-Visual Notes added', date: 'Governance', tag: 'GK Notes' },
    ],
  },
};

export function hasCourseFeature(courseId: CanonicalCourseId, feature: CourseFeatureKey): boolean {
  const config = COURSE_PORTAL_CONFIGS[courseId];
  if (!config) return false;
  return config.features.includes(feature);
}
