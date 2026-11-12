export interface TutorPrompt {
  title: string;
  prompt: string;
}

export const CEE_PROMPTS: Record<string, TutorPrompt[]> = {
  General: [
    { title: 'CEE Exam Pattern', prompt: 'Explain the CEE 2026 exam pattern, subject weightage, and marking scheme in detail.' },
    { title: '7-Day Battle Plan', prompt: 'Give me a 7-day high-yield revision strategy for CEE prep.' },
    { title: 'Most Repeated Topics', prompt: 'What are the top 10 most repeated high-yield topics for CEE Medical Entrance?' },
  ],
  Biology: [
    { title: 'DNA Replication Mechanism', prompt: 'Explain the step-by-step mechanism of DNA replication with key enzymes.' },
    { title: 'C3 vs C4 Photosynthesis', prompt: 'Compare C3 and C4 photosynthetic pathways with Krantz anatomy differences.' },
    { title: 'Mitosis vs Meiosis', prompt: 'Detail the major differences between Mitosis and Meiosis I/II.' },
  ],
  Chemistry: [
    { title: 'Hybridization Rules', prompt: 'Explain hybridization determination rules for inorganic molecules with examples.' },
    { title: 'Organic Mechanisms', prompt: 'Compare SN1 and SN2 substitution reactions with carbocation stability principles.' },
    { title: 'Periodic Trends', prompt: 'Summarize periodic trends in Ionization Energy, Electron Affinity, and Atomic Radii.' },
  ],
  Physics: [
    { title: 'Projectile Motion', prompt: 'Derive maximum height, time of flight, and range formulas for projectile motion.' },
    { title: 'Photoelectric Effect', prompt: "Explain Einstein's photoelectric equation, threshold frequency, and work function." },
    { title: "Kirchhoff's Laws", prompt: "Explain Kirchhoff's Current Law (KCL) and Voltage Law (KVL) with numerical tips." },
  ],
  'Mental Agility': [
    { title: 'Number Series Tricks', prompt: 'Provide 5 high-yield CEE number series questions with step-by-step logic.' },
    { title: 'Blood Relation Shortcuts', prompt: 'Explain blood relation problem solving shortcuts with tree diagram methods.' },
    { title: 'Logical Reasoning', prompt: 'What are the most common MAT patterns asked in CEE?' },
  ],
};

export const SEE_PROMPTS: Record<string, TutorPrompt[]> = {
  General: [
    { title: 'SEE Board Exam Pattern', prompt: 'Explain the Class 10 NEB SEE board exam paper structure, model questions, and grading scheme.' },
    { title: 'SEE Grade A+ Strategy', prompt: 'How can I score A+ in Class 10 NEB Board exams across Science, Math, English & Social Studies?' },
    { title: 'Important Board Questions', prompt: 'What are the most expected 4-mark and 5-mark long questions for Class 10 SEE?' },
  ],
  'Compulsory Science': [
    { title: 'Force & Gravitation', prompt: "Explain Newton's Universal Law of Gravitation, gravity vs acceleration due to gravity (g)." },
    { title: 'Chemical Reactions', prompt: 'Detail types of chemical reactions (combination, decomposition, displacement, neutralization).' },
    { title: 'Heredity & Mendel Laws', prompt: "Explain Mendel's Laws of Inheritance with monohybrid and dihybrid cross diagrams." },
  ],
  'Compulsory Mathematics': [
    { title: 'Sets & Venn Diagrams', prompt: 'Provide 3 model 4-mark word problems on Sets with Venn diagram solutions.' },
    { title: 'Statistics & Ogive', prompt: 'Explain how to compute Median and Quartiles from continuous frequency distribution tables.' },
    { title: 'Geometry Proofs', prompt: 'State and prove the theorem: Area of a triangle is half the area of a parallelogram on the same base.' },
  ],
  'Optional Mathematics': [
    { title: 'Composite Functions', prompt: 'Explain Composite Functions and Inverse Functions with step-by-step solved examples.' },
    { title: 'Trigonometric Identities', prompt: 'Solve compound angle and multiple angle trigonometric identity proofs.' },
    { title: 'Matrix Transformations', prompt: 'Explain 2D geometric transformations using 2x2 matrices.' },
  ],
  English: [
    { title: 'Letter & Essay Writing', prompt: 'Give a top-scoring format and sample for Formal Letter to Editor for SEE English.' },
    { title: 'Direct vs Indirect Speech', prompt: 'Explain rules for converting Direct Speech to Indirect Speech for Class 10 NEB grammar.' },
  ],
  'Social Studies': [
    { title: 'Constitution of Nepal', prompt: 'Summarize key features and fundamental rights under the Constitution of Nepal (2072).' },
    { title: 'Geography & Climate', prompt: "Explain physical divisions of Nepal and factors affecting Nepal's climate." },
  ],
};

export const ENGLISH_PROMPTS: Record<string, TutorPrompt[]> = {
  General: [
    { title: 'Daily Speaking Drill', prompt: 'Give me a 5-minute daily spoken English practice exercise with vocabulary and response framework.' },
    { title: 'IELTS Band 8.0 Strategy', prompt: 'What are the top 5 examiner tips for scoring Band 8.0+ in IELTS Academic Writing Task 2?' },
    { title: 'PTE Speaking Hacks', prompt: 'Explain the secret templates and scoring breakdown for PTE Describe Image & Retell Lecture.' },
  ],
  'Spoken English': [
    { title: 'Job Interview Prep', prompt: 'Simulate a job interview for "Tell me about yourself" and "What are your strengths?" with native phrasing.' },
    { title: 'Accent & Intonation', prompt: 'Explain how to master connected speech, sentence stress, and natural intonation in English.' },
  ],
  'IELTS Prep': [
    { title: 'Task 2 Essay Structure', prompt: 'Provide a Band 9 template for an Agree/Disagree opinion essay in IELTS Academic.' },
    { title: 'Part 2 Cue Card Strategy', prompt: 'How do I speak fluently for 2 full minutes on IELTS Cue Card topics without pausing?' },
  ],
  'PTE Prep': [
    { title: 'Describe Image Template', prompt: 'Give me a universal 25-second speaking template for any PTE Describe Image chart.' },
    { title: 'Write From Dictation', prompt: 'What are the best tips to remember exact words in PTE Write From Dictation?' },
  ],
  Grammar: [
    { title: 'Tenses Masterclass', prompt: 'Explain the difference between Present Perfect and Simple Past with 5 common mistake examples.' },
    { title: 'Articles (A, An, The)', prompt: 'Summarize all zero-article rules and common preposition traps in English.' },
  ],
};

export const DIGITAL_PROMPTS: Record<string, TutorPrompt[]> = {
  General: [
    { title: 'Top 10 AI Productivity Prompts', prompt: 'Give me 10 high-yield prompts for study productivity, resume writing, and learning faster.' },
    { title: 'Python Starter Blueprint', prompt: 'How can a complete beginner master Python coding in 30 days? Give a step-by-step roadmap.' },
    { title: 'Freelancing on Upwork', prompt: 'How can I win my first client on Upwork/Fiverr with zero past reviews?' },
  ],
  'AI & Prompts': [
    { title: 'Prompt Engineering Guide', prompt: 'Explain Few-Shot vs Chain-of-Thought prompting with real examples for ChatGPT and Claude.' },
    { title: 'Image Generation Prompts', prompt: 'How do I write detailed prompts for ultra-realistic digital artwork?' },
  ],
  'Python Coding': [
    { title: 'Loops & Conditionals', prompt: 'Explain Python for loops, while loops, and if-else statements with 3 beginner code snippets.' },
    { title: 'Web Scraping Basics', prompt: 'Show a simple Python script using BeautifulSoup to scrape article titles from a website.' },
  ],
  'Digital Marketing': [
    { title: 'Facebook Ads Guide', prompt: 'How do I set up a high-converting Facebook ad campaign for a local business with Rs 500 budget?' },
    { title: 'Copywriting Secrets', prompt: 'Explain the AIDA (Attention, Interest, Desire, Action) framework for high-converting social ads.' },
  ],
  'Canva Design': [
    { title: 'Social Media Design', prompt: 'What are the core design rules for contrast, font pairing, and color harmony in Canva?' },
  ],
};
