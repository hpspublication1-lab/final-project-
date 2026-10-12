export interface CourseCurriculumModule {
  title: string;
  desc: string;
  lessonsCount: number;
  topics: string[];
}

export interface CourseInstructor {
  name: string;
  title: string;
  credentials: string;
  bio: string;
  avatar: string;
}

export interface CourseTestimonial {
  name: string;
  role: string;
  score: string;
  text: string;
  avatar: string;
}

export interface CourseFaqItem {
  question: string;
  answer: string;
}

export interface CourseLandingConfig {
  id: string;
  canonicalSlug: string;
  routePath: string;
  seoTitle: string;
  seoDescription: string;
  brandBadge: string;
  heroHeadline: string;
  heroHighlight: string;
  heroSubtitle: string;
  primaryCtaText: string;
  secondaryCtaText: string;
  targetAudience: string;
  targetOutcome: string;
  sku: string;
  price: number;
  originalPrice: number;
  validityDays: number;
  validityLabel: string;
  accentColor: string;
  gradientBg: string;
  themeBorder: string;
  problemStatement: {
    title: string;
    description: string;
    painPoints: string[];
  };
  solutionOverview: {
    title: string;
    description: string;
    keyFeatures: { title: string; desc: string; icon: string }[];
  };
  curriculum: CourseCurriculumModule[];
  instructors: CourseInstructor[];
  testimonials: CourseTestimonial[];
  faqs: CourseFaqItem[];
  stats: { label: string; value: string }[];
}

export const COURSE_LANDING_DATA: Record<string, CourseLandingConfig> = {
  'cee-medical-entrance': {
    id: 'cee_medical',
    canonicalSlug: 'cee-medical-entrance',
    routePath: '/cee-medical-entrance',
    seoTitle: 'CEE Medical Entrance Preparation | Samyak',
    seoDescription: 'Prepare smarter for Nepal MEC CEE Medical Entrance Exam with 15,000+ past paper MCQs, full mock exams, chapter video lessons, and 24/7 AI Doubt Solver.',
    brandBadge: 'NEPAL MEC CEE 2026 ENTRANCE',
    heroHeadline: 'Prepare Smarter for',
    heroHighlight: 'CEE Medical Entrance',
    heroSubtitle: 'Master Physics, Chemistry, Biology & MAT with 15,000+ high-yield MCQs, real exam simulator, chapter video lectures, and instant 24/7 AI Tutor feedback.',
    primaryCtaText: 'Start CEE Preparation',
    secondaryCtaText: 'Explore Course Curriculum',
    targetAudience: 'Grade 12 Graduates & CEE Droppers aiming for MBBS, BDS, B.Sc. Nursing & Paramedical scholarship seats in Nepal.',
    targetOutcome: 'Achieve 150+ out of 200 in CEE with verified concept mastery and high-speed MCQ accuracy.',
    sku: 'cee-mbbs-mastery-2026',
    price: 7990,
    originalPrice: 14990,
    validityDays: 180,
    validityLabel: 'Full MECEE Cycle (180 Days)',
    accentColor: 'text-primary',
    gradientBg: 'from-blue-600 via-indigo-600 to-primary-dark',
    themeBorder: 'border-primary/30',
    stats: [
      { label: 'Past MCQs & Derivations', value: '15,000+' },
      { label: 'CEE Mock Tests', value: '50+' },
      { label: 'Concept Video Lessons', value: '180+' },
      { label: 'AI Doubt Resolution', value: '24/7' },
    ],
    problemStatement: {
      title: 'Why Most Students Struggle in CEE Medical Entrance',
      description: 'CEE tests speed (200 MCQs in 3 hours) and negative marking trap management. Rote memorization without past paper application causes score stagnation.',
      painPoints: [
        'Overwhelmed by massive syllabus across 4 major subjects',
        'Lack of real-time CEE timer simulation and negative marking analysis',
        'Getting stuck on complex Physics & Organic Chemistry questions without instant help',
        'Inability to track weak chapters and negative marking trends',
      ],
    },
    solutionOverview: {
      title: 'The Complete Samyak CEE Mastery System',
      description: 'Built specifically for Nepal CEE entrance pattern, combining expert faculty lectures with AI precision diagnostics.',
      keyFeatures: [
        { title: '15,000+ CEE Question Bank', desc: 'Chapterwise MCQs tagged with past CEE/IOM/MOE exam years and detailed explanations.', icon: 'BookOpen' },
        { title: 'Real CEE Arena Simulator', desc: 'Timed mock exams with authentic -0.25 negative marking and live ELO student leaderboard.', icon: 'Zap' },
        { title: '24/7 AI Medical Doubt Solver', desc: 'Snap or type any tough Physics/Chemistry derivation for step-by-step guidance instantly.', icon: 'Bot' },
        { title: 'Weak-Topic Engine', desc: 'Automatic breakdown of chapters where you lose marks so you revise targeted content.', icon: 'Target' },
      ],
    },
    curriculum: [
      { title: 'Botany & Zoology Mastery', desc: 'Plant Anatomy, Taxonomy, Genetics, Human Physiology & Ecology.', lessonsCount: 45, topics: ['Cell Biology & Genetics', 'Plant Physiology & Diversity', 'Human Organ Systems', 'Ecology & Evolution'] },
      { title: 'Organic & Inorganic Chemistry', desc: 'Reaction Mechanisms, Hydrocarbons, Named Reactions & Periodic Table.', lessonsCount: 40, topics: ['GOC & Reaction Mechanisms', 'Aliphatic & Aromatic Compounds', 'Physical Chemistry Formulas', 'Inorganic Metallurgy'] },
      { title: 'Entrance Physics & Derivations', desc: 'Mechanics, Heat, Optics, Electricity, Magnetism & Modern Physics.', lessonsCount: 50, topics: ['Mechanics & Rotational Dynamics', 'Optics & Wave Motion', 'Electrostatics & Circuits', 'Modern & Nuclear Physics'] },
      { title: 'Mental Aptitude Test (MAT)', desc: 'Numerical Reasoning, Logical Patterns, Verbal Fluency & Spatial Test.', lessonsCount: 20, topics: ['Numerical Series & Logic', 'Verbal Reasoning Drills', 'Spatial & Diagram Patterns', 'Speed Calculation Techniques'] },
    ],
    instructors: [
      { name: 'Dr. Samyak Shrestha', title: 'Chief Medical Educator', credentials: 'MBBS (IOM Maharajgunj), CEE Entrance Specialist', bio: 'Specialist in Human Physiology, High-Yield Botany, and high-frequency entrance MCQ breakdowns.', avatar: '/images/instructors/samyak.jpg' },
      { name: 'Er. Bishal Adhikari', title: 'Physics Entrance Specialist', credentials: 'M.Sc. Physics (TU), 10+ Yrs Entrance Training', bio: 'Pioneer of shortcut derivation techniques and rapid numerical solving formulas for CEE.', avatar: '/images/instructors/bishal.jpg' },
    ],
    testimonials: [
      { name: '200-Q Timed Mock Simulator', role: 'Verified Platform Feature', score: '-0.25 Marking', text: 'Full-length 3-hour MECEE simulations with +1.0 correct scoring, -0.25 negative marking, and chapter-by-chapter accuracy breakdowns.', avatar: '🩺' },
      { name: '15,000+ Topicwise Question Bank', role: 'Verified Platform Feature', score: 'PCB + MAT', text: 'Organized across Zoology, Botany, Chemistry, Physics, and MAT with step-by-step rationales and spaced-repetition bookmarks.', avatar: '🧬' },
    ],
    faqs: [
      { question: 'Is this aligned with the latest MEC CEE 2026 syllabus?', answer: 'Yes! All MCQs, mock tests, and weightages strictly follow the official Medical Education Commission (MEC) Nepal syllabus.' },
      { question: 'Can I access CEE mock tests on my mobile phone?', answer: 'Absolutely. The platform is 100% mobile-friendly with instant PWA offline note access and responsive exam simulators.' },
      { question: 'How long does my subscription last?', answer: 'Your access lasts for the full MECEE entrance cycle (180 days) from your enrollment date, covering your entire CEE preparation.' },
    ],
  },

  'see-class-10': {
    id: 'see_class_10',
    canonicalSlug: 'see-class-10',
    routePath: '/see-class-10',
    seoTitle: 'SEE Class 10 Preparation & Board Mastery | Samyak',
    seoDescription: 'Ace your Class 10 SEE Board Exam in Nepal with 147+ video chapters, 10-year model question bank, AI Handwritten Paper Examiner, and 4.0 GPA target tracking.',
    brandBadge: 'NEB BOARD EXAM CLASS 10',
    heroHeadline: 'Prepare for SEE With a',
    heroHighlight: 'Clear Study System',
    heroSubtitle: 'Complete Science, Compulsory Math, Opt Math, English, and Nepali preparation with chapter notes, past paper banks, and AI Vision handwritten answer evaluation.',
    primaryCtaText: 'Start SEE Preparation',
    secondaryCtaText: 'View Class 10 Subjects',
    targetAudience: 'Class 10 students in Nepal preparing for the Secondary Education Examination (SEE) board exams.',
    targetOutcome: 'Achieve GPA 3.6 to 4.0 with verified subject mastery in Science, Mathematics & English.',
    sku: 'see-class-10-board-topper-batch',
    price: 4990,
    originalPrice: 7990,
    validityDays: 365,
    validityLabel: '1 Full Year (365 Days)',
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    gradientBg: 'from-emerald-600 via-teal-600 to-emerald-700',
    themeBorder: 'border-emerald-500/30',
    stats: [
      { label: 'Video Chapters', value: '147+' },
      { label: '10-Year Model Papers', value: '500+' },
      { label: 'SEE Practice MCQs', value: '4,000+' },
      { label: 'Target GPA', value: '4.0' },
    ],
    problemStatement: {
      title: 'Why Students Panic Before SEE Board Exams',
      description: 'Huge syllabus across 6 core subjects, strict NEB grading criteria, and lack of step-by-step subjective answer evaluation lead to exam stress.',
      painPoints: [
        'Struggling to solve complex SEE Math and Physics numericals independently',
        'Not knowing how marks are awarded for long subjective answers in Science & Social',
        'Lack of organized unit notes for quick revision before exams',
        'Uncertainty about weak chapters that reduce final SEE GPA',
      ],
    },
    solutionOverview: {
      title: 'Your Complete SEE Board Success Hub',
      description: 'Combines video chapter walkthroughs, PDF notes, and AI Vision paper checker for maximum board marks.',
      keyFeatures: [
        { title: 'AI Vision Handwritten Checker', desc: 'Snap a photo of your handwritten answer sheet for instant NEB rubric marking and tips.', icon: 'Camera' },
        { title: '10-Year Model Paper Bank', desc: 'Solved past SEE board question papers with exact mark distribution schemes.', icon: 'FileText' },
        { title: 'Chapter Notes & Summaries', desc: 'Crisp Nepali & English revision notes for Science, Math, Social & Languages.', icon: 'BookOpen' },
        { title: 'GPA 4.0 Progress Tracker', desc: 'Real-time dashboard tracking your completion across all 6 SEE subjects.', icon: 'TrendingUp' },
      ],
    },
    curriculum: [
      { title: 'Science (Physics, Chem, Bio, Astronomy)', desc: 'Complete 24 chapter coverage with numerical problems & diagrams.', lessonsCount: 45, topics: ['Force & Pressure', 'Energy & Heat', 'Chemical Reactions', 'Genetics & Universe'] },
      { title: 'Compulsory Mathematics', desc: 'Algebra, Geometry, Trigonometry, Sets, Arithmetic & Statistics.', lessonsCount: 40, topics: ['Sets & Compound Interest', 'Mensuration & Geometry', 'Trigonometry & Vectors', 'Statistics & Probability'] },
      { title: 'Optional Mathematics', desc: 'Functions, Polynomials, Matrices, Coordinate Geometry & Transformations.', lessonsCount: 35, topics: ['Functions & Limits', 'Matrices & Determinants', 'Coordinate Geometry', 'Transformation & Vectors'] },
      { title: 'English & Nepali Grammar', desc: 'Reading Comprehension, Essay Writing, Grammar Drills & Literature.', lessonsCount: 28, topics: ['Grammar Rules & Essay Structure', 'Seen & Unseen Passages', 'व्याकरण र शुद्धलेखन', 'कथा, कविता र निबन्ध'] },
    ],
    instructors: [
      { name: 'Pradeep Poudel Sir', title: 'Head of SEE Science', credentials: 'M.Sc. Physics (TU), 12+ Yrs Board Teaching', bio: 'Secondary education specialist in Class 10 Science, Opt Math derivations, and marking rubrics.', avatar: '/images/instructors/pradeep.jpg' },
      { name: 'Er. Ramesh Karki', title: 'Senior Mathematics Lead', credentials: 'B.E. (IOE Pulchowk), Author of SEE Topper Series', bio: 'Master of shortcut geometry proofs and numerical problem solving.', avatar: '/images/instructors/ramesh.jpg' },
    ],
    testimonials: [
      { name: 'Dual-Medium HD Video Library', role: 'Verified Platform Feature', score: 'EN & NP Medium', text: 'Complete Class 10 video playlists available in both English Medium (ID 379737) and Nepali Medium (ID 367785) for flexible board revision.', avatar: '🎓' },
      { name: 'AI Handwritten Rubric Marker', role: 'Verified Platform Feature', score: '1–4 Marks Scheme', text: 'Upload photos of handwritten Science or Math solutions to receive step-by-step NEB marking scheme feedback and teacher escalation.', avatar: '📝' },
    ],
    faqs: [
      { question: 'Is this content aligned with the new NEB SEE Class 10 curriculum?', answer: 'Yes! Content is updated for the latest CDC & NEB Nepal Class 10 curriculum and question specification grid.' },
      { question: 'How does the AI Vision Paper Examiner work?', answer: 'Take a clear photo of your handwritten answer sheet on your phone. Our AI checks it against official NEB rubrics and gives feedback within seconds.' },
      { question: 'Can I access this on mobile devices?', answer: 'Yes, Samyak SEE works on all smartphones, tablets, and computers.' },
    ],
  },

  'ielts-preparation': {
    id: 'ielts_english',
    canonicalSlug: 'ielts-preparation',
    routePath: '/ielts-preparation',
    seoTitle: 'IELTS Preparation Course & Band Predictor | Samyak',
    seoDescription: 'Build the IELTS skills you need to reach Band 7.5+. Practice Listening, Reading, AI Speaking Simulator, and Instant Essay Writing Feedback.',
    brandBadge: 'IELTS ACADEMIC & GENERAL TRAINING',
    heroHeadline: 'Build IELTS Skills to Reach Your',
    heroHighlight: 'Target Band 7.5+',
    heroSubtitle: 'Complete 4-skill preparation with Cambridge test simulations, instant AI Writing score evaluation, and interactive Speaking Test simulator.',
    primaryCtaText: 'Start IELTS Preparation',
    secondaryCtaText: 'Try AI Band Predictor',
    targetAudience: 'Students and professionals in Nepal preparing for abroad study or migration tests.',
    targetOutcome: 'Achieve Band 7.5 or higher with verified accuracy across Reading, Writing, Listening & Speaking.',
    sku: 'english-ielts-target-8-mastery',
    price: 3490,
    originalPrice: 5990,
    validityDays: 60,
    validityLabel: '60 Days Intensive Access',
    accentColor: 'text-purple-600 dark:text-purple-400',
    gradientBg: 'from-purple-600 via-indigo-600 to-purple-800',
    themeBorder: 'border-purple-500/30',
    stats: [
      { label: 'Cambridge Practice Tests', value: '40+' },
      { label: 'AI Writing Evaluations', value: 'Unlimited' },
      { label: 'Target Band', value: '7.5+' },
      { label: 'Speaking Mock Drills', value: '100+' },
    ],
    problemStatement: {
      title: 'Why Students Miss Their Target IELTS Band',
      description: 'Writing Task 2 structure errors, Reading time traps, and Speaking nervousness cause score drops below university cutoff requirements.',
      painPoints: [
        'Getting stuck at Band 6.0 in Writing due to cohesion and lexical errors',
        'Running out of time on Reading Passage 3',
        'Lack of real human speaking feedback to practice Part 1, 2 & 3 topics',
        'High cost of repeated official test attempts',
      ],
    },
    solutionOverview: {
      title: 'Master All 4 IELTS Modules With AI Precision',
      description: 'Practice real Cambridge exam formats with instant feedback on grammar, coherence, and pronunciation.',
      keyFeatures: [
        { title: 'AI Essay Rubric Checker', desc: 'Get immediate score breakdowns for Task 1 & Task 2 on Task Response, Coherence, Lexical Resource & Grammar.', icon: 'Edit' },
        { title: 'Interactive Speaking Simulator', desc: 'Practice cue cards and follow-up questions with live voice evaluation and audio transcript feedback.', icon: 'Mic' },
        { title: 'Speed Reading Drills', desc: 'Master True/False/Not Given, Matching Headings & Sentence Completion strategies.', icon: 'BookOpen' },
        { title: 'Full Listening Test Drills', desc: 'Authentic audio recordings with multiple accents (UK, US, Aus) and instant answer key validation.', icon: 'Headphones' },
      ],
    },
    curriculum: [
      { title: 'IELTS Listening Mastery', desc: 'Audio section strategies, map labeling & note completion.', lessonsCount: 15, topics: ['Form & Note Completion', 'Multiple Choice & Matching', 'Section 3 & 4 Complex Dialogues', 'Speed Audio Drills'] },
      { title: 'IELTS Reading Speed System', desc: 'Skimming, scanning, T/F/NG and paragraph matching.', lessonsCount: 18, topics: ['True/False/Not Given Mastery', 'Matching Headings & Information', 'Summary & Table Completion', 'Time Management Drills'] },
      { title: 'IELTS Writing Task 1 & 2 Engine', desc: 'Graph analysis & band 8.0 essay templates.', lessonsCount: 22, topics: ['Line, Bar & Pie Chart Analysis', 'Process Diagrams & Maps', 'Task 2 Essay Structures', 'Advanced Lexical Collocations'] },
      { title: 'IELTS Speaking Confidence', desc: 'Part 1, 2 Cue Card & Part 3 Discussion drills.', lessonsCount: 16, topics: ['Part 1 Fluency & Confidence', 'Part 2 Cue Card Strategy', 'Part 3 Abstract Discussion', 'Pronunciation & Intonation'] },
    ],
    instructors: [
      { name: 'Subash Bhattarai', title: 'Senior English Language Faculty', credentials: 'M.A. English Literature, Certified IELTS Trainer', bio: 'Specialist in Task 2 essay structuring, academic collocations, and speaking fluency drills.', avatar: '/images/instructors/subash.jpg' },
      { name: 'Coach Aria (AI Assessor)', title: 'AI Speech & Rubric Evaluator', credentials: 'Cambridge IELTS Band Descriptors Calibration', bio: 'Interactive voice persona delivering real-time acoustic and rubric feedback across Fluency, Vocabulary, Grammar, and Pronunciation.', avatar: '/images/instructors/aria.jpg' },
    ],
    testimonials: [
      { name: 'Coach Aria Speaking Engine', role: 'Verified Platform Feature', score: 'Part 1, 2 & 3', text: 'Practice IELTS Speaking cue cards with live voice transcription and rubric feedback calibrated to public Band Descriptors.', avatar: '🎙️' },
      { name: 'Writing Task 1 & 2 Evaluator', role: 'Verified Platform Feature', score: '4-Criterion Rubric', text: 'Instant diagnostic breakdown across Task Response, Coherence & Cohesion, Lexical Resource, and Grammatical Range.', avatar: '✍️' },
    ],
    faqs: [
      { question: 'Does this cover both IELTS Academic and General Training?', answer: 'Yes! Both Academic and General Training modules for Reading, Writing, Listening & Speaking are included.' },
      { question: 'How accurate is the AI Essay & Band Predictor?', answer: 'Our evaluation engine is calibrated against public IELTS 9-band descriptors for Task Response, Coherence, Vocabulary & Grammar as an estimated practice score.' },
      { question: 'Can I practice Speaking tests on my smartphone?', answer: 'Yes! You can record your voice directly in the browser or phone for evaluation.' },
    ],
  },

  'digital-marketing': {
    id: 'digital_marketing',
    canonicalSlug: 'digital-marketing',
    routePath: '/digital-marketing',
    seoTitle: 'Digital Marketing Course & Skills Certification | Samyak',
    seoDescription: 'Master SEO, Meta Ads, Google Ads, Content Strategy, and Analytics. Build real-world campaigns and earn industry skills certification in Nepal.',
    brandBadge: 'PRACTICAL CAREER SKILLS PASS',
    heroHeadline: 'Learn Digital Marketing by',
    heroHighlight: 'Building Real Campaigns',
    heroSubtitle: 'Practical training covering SEO, Facebook & Instagram Ads, Google Search Ads, Content Marketing & Web Analytics with hands-on projects.',
    primaryCtaText: 'Start Learning Digital Marketing',
    secondaryCtaText: 'Explore Modules',
    targetAudience: 'Students, job seekers, entrepreneurs, and freelancers in Nepal looking to master digital growth skills.',
    targetOutcome: 'Run high-ROI ad campaigns, optimize websites for Google search, and launch a digital marketing portfolio.',
    sku: 'digital-marketing-canva-freelancing',
    price: 1990,
    originalPrice: 3490,
    validityDays: 45,
    validityLabel: '45 Days Access',
    accentColor: 'text-amber-600 dark:text-amber-400',
    gradientBg: 'from-amber-600 via-orange-600 to-amber-700',
    themeBorder: 'border-amber-500/30',
    stats: [
      { label: 'Practical Modules', value: '12+' },
      { label: 'Real Projects', value: '5 Live' },
      { label: 'Ad Budget Drills', value: 'Live Hands-On' },
      { label: 'Career Certificate', value: 'Included' },
    ],
    problemStatement: {
      title: 'Why Theory-Only Marketing Courses Fail',
      description: 'Reading about marketing without running live ad budgets, setting up Google Analytics, or writing conversion copy leaves students unprepared for real jobs.',
      painPoints: [
        'Spending money on Facebook ads without knowing custom audience targeting or pixel setup',
        'Not knowing how to rank a website on page 1 of Google using SEO',
        'Lack of a tangible portfolio to showcase to clients or employers',
        'Inability to measure ROI and ad performance analytics',
      ],
    },
    solutionOverview: {
      title: 'Action-Oriented Digital Growth System',
      description: 'Step-by-step practical modules covering strategy, campaign execution, and optimization.',
      keyFeatures: [
        { title: 'Meta Ads Masterclass', desc: 'Create high-converting Facebook & Instagram ad campaigns, lookalike audiences & A/B tests.', icon: 'Target' },
        { title: 'SEO & Content Strategy', desc: 'On-page SEO, technical audits, keyword research, and high-ranking article frameworks.', icon: 'Search' },
        { title: 'Google Ads & PPC', desc: 'Search ads, display networks, YouTube video ads, and conversion tracking.', icon: 'DollarSign' },
        { title: 'Analytics & Reporting', desc: 'Set up GA4, Google Tag Manager, and build client performance dashboards.', icon: 'BarChart' },
      ],
    },
    curriculum: [
      { title: 'Fundamentals & Audience Persona', desc: 'Funnel architecture, customer psychology & brand positioning.', lessonsCount: 10, topics: ['Marketing Funnel Stages', 'Audience Personas & Messaging', 'Competitor Research Tools', 'Copywriting Formulas'] },
      { title: 'Meta Ads (Facebook & Instagram)', desc: 'Ad manager setup, audience building & ad creative design.', lessonsCount: 16, topics: ['Meta Pixel & Conversion Setup', 'Targeting & Custom Audiences', 'A/B Testing & Scaling', 'Ad Creative & Video Reels'] },
      { title: 'Search Engine Optimization (SEO)', desc: 'Keyword research, on-page optimization & backlinks.', lessonsCount: 18, topics: ['Keyword Research & Intent', 'On-Page & Technical SEO', 'Link Building Strategies', 'Local SEO & Google Business'] },
      { title: 'Google Ads & GA4 Analytics', desc: 'PPC search campaigns, bidding models & Google Analytics 4.', lessonsCount: 14, topics: ['Google Search Ads Setup', 'Keyword Match Types & Bidding', 'GA4 Dashboard & Event Tracking', 'Client Growth Reporting'] },
    ],
    instructors: [
      { name: 'Nabin KC', title: 'AI & Digital Tech Educator', credentials: 'Software Engineer & Digital Growth Specialist', bio: 'Leads practical training in digital marketing funnels, SEO architecture, and AI-assisted campaign workflows.', avatar: '/images/instructors/nabin.jpg' },
    ],
    testimonials: [
      { name: 'Meta & Search Campaign Checklists', role: 'Verified Platform Feature', score: '12 Modules', text: 'Structured walkthroughs for audience targeting, conversion tracking, on-page SEO audits, and GA4 reporting templates.', avatar: '📈' },
      { name: 'AI Copywriting & Prompt Sandbox', role: 'Verified Platform Feature', score: 'Interactive Tool', text: 'Test ad copy hooks, landing page headlines, and SEO outlines inside the Samyak Digital AI Studio.', avatar: '💼' },
    ],
    faqs: [
      { question: 'Do I need prior coding or marketing experience?', answer: 'No prior experience is needed! We start from basic marketing principles up to advanced campaign setup.' },
      { question: 'Will I receive a course certificate?', answer: 'Yes, you will receive a verified Samyak Digital Marketing Certificate upon project completion.' },
      { question: 'How long do I have access to course materials?', answer: 'Full 45-day access to all video lessons, templates, ad strategy frameworks, and updates.' },
    ],
  },

  'ai-python-course': {
    id: 'ai_academy',
    canonicalSlug: 'ai-python-course',
    routePath: '/ai-python-course',
    seoTitle: 'AI & Python Course: Build Smart Applications | Samyak',
    seoDescription: 'Learn Python programming, API automation, OpenAI integration, and build practical AI applications from scratch in Nepal.',
    brandBadge: 'FUTURE TECH & AI PASS',
    heroHeadline: 'Learn Python.',
    heroHighlight: 'Build With AI.',
    heroSubtitle: 'Master Python fundamentals, AI API integrations, automation scripts, and build real-world AI tools without fluff.',
    primaryCtaText: 'Start Learning AI + Python',
    secondaryCtaText: 'View Project Syllabus',
    targetAudience: 'Students, developers, and tech enthusiasts in Nepal eager to learn programming and artificial intelligence tools.',
    targetOutcome: 'Write clean Python code, connect to LLM APIs, automate tasks, and deploy live AI projects.',
    sku: 'digital-python-programming-zero-to-hero',
    price: 2490,
    originalPrice: 4500,
    validityDays: 60,
    validityLabel: '60 Days Hands-On Access',
    accentColor: 'text-indigo-600 dark:text-indigo-400',
    gradientBg: 'from-indigo-600 via-purple-600 to-indigo-800',
    themeBorder: 'border-indigo-500/30',
    stats: [
      { label: 'Python & AI Modules', value: '10+' },
      { label: 'Hands-On Projects', value: '6 Projects' },
      { label: 'API Integrations', value: 'OpenAI, Gemini' },
      { label: 'Course Access', value: '60 Days' },
    ],
    problemStatement: {
      title: 'Why Traditional Programming Courses Feel Outdated',
      description: 'Learning theoretical syntax without connecting to modern AI APIs (like OpenAI & Gemini) leaves students behind in the modern tech stack.',
      painPoints: [
        'Getting stuck on syntax errors without building real applications',
        'Not knowing how to integrate LLM APIs into Python code',
        'Struggling to automate daily repetitive tasks with scripts',
        'Lack of portfolio projects to show technical capability',
      ],
    },
    solutionOverview: {
      title: 'Modern Python + Generative AI Curriculum',
      description: 'Learn core programming fundamentals alongside cutting-edge AI application building.',
      keyFeatures: [
        { title: 'Python Core Mastery', desc: 'Variables, loops, functions, OOP, data structures, and error handling.', icon: 'Code' },
        { title: 'AI API Integrations', desc: 'Connect to OpenAI & Gemini APIs to build custom chatbots and text generators.', icon: 'Bot' },
        { title: 'Task Automation', desc: 'Write Python scripts to automate web scraping, file processing, and email alerts.', icon: 'Cpu' },
        { title: 'Prompt Studio & Tooling', desc: 'Master prompt engineering techniques and structured JSON outputs.', icon: 'Sparkles' },
      ],
    },
    curriculum: [
      { title: 'Python Fundamentals', desc: 'Data types, control flow, functions & file I/O.', lessonsCount: 12, topics: ['Variables & Data Types', 'Conditionals & Loops', 'Functions & Modules', 'File Handling & JSON'] },
      { title: 'Object-Oriented & Modern Python', desc: 'Classes, methods, external packages & virtual envs.', lessonsCount: 10, topics: ['Classes & Objects', 'PIP & Virtual Environments', 'Error Handling & Logging', 'Working with REST APIs'] },
      { title: 'Generative AI & LLM APIs', desc: 'Integrating OpenAI & Gemini into Python scripts.', lessonsCount: 14, topics: ['API Authentication & Requests', 'Prompt Engineering in Code', 'Structuring JSON Outputs', 'Memory & Context Windows'] },
      { title: 'AI Project Building & Deployment', desc: 'Building chatbots, web scrapers & automated tools.', lessonsCount: 12, topics: ['Building a Custom AI Chatbot', 'Automated Web Scraper', 'Document Summarizer Tool', 'Project Deployment Basics'] },
    ],
    instructors: [
      { name: 'Nabin KC', title: 'Software Engineer, AI & Tech Educator', credentials: 'Full-Stack & AI Application Developer', bio: 'Guides beginners from core Python syntax and REST APIs to practical LLM integrations and automation scripts.', avatar: '/images/instructors/nabin.jpg' },
    ],
    testimonials: [
      { name: '6 Guided Python + AI Projects', role: 'Verified Platform Feature', score: 'Hands-On Code', text: 'Build practical scripts including JSON data parsers, REST API clients, and Gemini/OpenAI document summarizers.', avatar: '💻' },
      { name: 'Interactive Prompt & Code Sandbox', role: 'Verified Platform Feature', score: '60 Days Access', text: 'Experiment with structured prompts and rubric-graded outputs directly in the browser.', avatar: '🚀' },
    ],
    faqs: [
      { question: 'Is this suitable for complete beginners in coding?', answer: 'Yes! We start from absolute scratch with Python variables and build up to AI API integrations.' },
      { question: 'What software or laptop specs do I need?', answer: 'Any standard laptop (Windows, Mac, or Linux) with an internet connection will work. We use free tools like VS Code and Python 3.x.' },
      { question: 'How long do I have access to the course?', answer: 'You get full 60-day access to all video lessons, code repositories, and project templates.' },
    ],
  },
};
