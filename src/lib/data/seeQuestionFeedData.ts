export interface SeeQuestionFeedItem {
  id: string;
  author: {
    name: string;
    role: string;
    avatar: string;
    verified: boolean;
  };
  postedAt: string;
  subject: 'science' | 'math' | 'opt_math' | 'english' | 'nepali' | 'social';
  subjectName: string;
  chapter: string;
  marks: 1 | 2 | 3 | 4;
  group: 'Group A' | 'Group B' | 'Group C' | 'Group D';
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Exam Trap';
  badge: string;
  question: string;
  questionNepali?: string;
  solution: string;
  markingBreakdown: { step: string; marks: number }[];
  commonMistakes: string;
  formulaNote?: string;
  upvotesCount: number;
  solvedCount: number;
}

export const SEE_QUESTION_FEED_ITEMS: SeeQuestionFeedItem[] = [
  {
    id: 'feed-q-101',
    author: {
      name: 'Prof. Ram K. Adhikari',
      role: 'Chief Science Moderation Panel',
      avatar: '/avatars/teacher-sci.jpg',
      verified: true,
    },
    postedAt: 'Just now (Today)',
    subject: 'science',
    subjectName: 'Compulsory Science & Tech',
    chapter: 'Force & Gravitation',
    marks: 3,
    group: 'Group C',
    difficulty: 'Hard',
    badge: '🔥 2082 BOARD PREDICTION',
    question: 'The weight of a person on Earth is 600 N. If the mass of the moon is 1/81 of the Earth\'s mass and its radius is 1/3.7 of the Earth\'s radius, calculate the weight of the person on the moon. What will be their mass on the moon?',
    questionNepali: 'पृथ्वीमा एक व्यक्तिको तौल ६०० N छ । यदि चन्द्रमाको पिण्ड पृथ्वीको १/८१ भाग र अर्धव्यास १/३.७ भाग भए चन्द्रमामा उक्त व्यक्तिको तौल कति होला ? चन्द्रमामा उनको पिण्ड कति होला ?',
    solution: 'Given:\nWeight on Earth (W_e) = 600 N\ng_e = 9.8 m/s² => Mass of person m = W_e / g_e = 600 / 9.8 ≈ 61.22 kg.\n\nRelation between g_e and g_m:\ng = GM / R²\ng_m / g_e = (M_m / M_e) × (R_e / R_m)²\n= (1/81) × (3.7)² = 13.69 / 81 ≈ 0.169 ≈ 1/6.\n\nWeight on moon (W_m) = m × g_m = 600 × (13.69 / 81) ≈ 101.4 N.\nMass on the moon remains CONSTANT = 61.22 kg (mass does not depend on gravity).',
    markingBreakdown: [
      { step: 'Formula setup and finding mass on Earth (W = mg)', marks: 1 },
      { step: 'Ratio equation for acceleration due to gravity (g_m / g_e)', marks: 1 },
      { step: 'Correct weight calculation (101.4 N) and stating mass remains invariant', marks: 1 },
    ],
    commonMistakes: 'Students often write that mass changes on the moon. Mass is the measure of inertia and remains unchanged; only weight varies with local gravitational field.',
    formulaNote: 'g_m = GM_m / R_m² ; W = m × g',
    upvotesCount: 342,
    solvedCount: 890,
  },
  {
    id: 'feed-q-102',
    author: {
      name: 'Er. Pradeep Sharma',
      role: 'Senior Math Faculty & Author',
      avatar: '/avatars/teacher-math.jpg',
      verified: true,
    },
    postedAt: '2 hours ago',
    subject: 'math',
    subjectName: 'Compulsory Mathematics',
    chapter: 'Geometry (Theorems)',
    marks: 4,
    group: 'Group D',
    difficulty: 'Exam Trap',
    badge: '⭐ 4-MARK THEOREM RIDER',
    question: 'In a circle with centre O, quadrilateral ABCD is inscribed. If side AB is produced to point E, prove theoretically that exterior angle ∠CBE is equal to its opposite interior angle ∠ADC.',
    questionNepali: 'O केन्द्र भएको वृत्तमा चक्रीय चतुर्भुज ABCD छ । यदि भुजा AB लाई बिन्दु E सम्म लम्ब्याइएको छ भने बाहिरी कोण ∠CBE = भित्री विपरीत कोण ∠ADC हुन्छ भनी प्रमाणित गर्नुहोस् ।',
    solution: 'Statements and Reasons Proof:\n1. ∠ABC + ∠CBE = 180° (Linear pair on straight line ABE)\n2. ∠ABC + ∠ADC = 180° (Opposite angles of a cyclic quadrilateral are supplementary)\n3. ∠ABC + ∠CBE = ∠ABC + ∠ADC (From statements 1 and 2, both equal 180°)\n4. Subtracting ∠ABC from both sides: ∠CBE = ∠ADC (Proven).',
    markingBreakdown: [
      { step: 'Correct diagram with labelled points O, A, B, C, D, E', marks: 1 },
      { step: 'Given and To Prove statements accurately recorded', marks: 1 },
      { step: 'Step 1 & 2 linear pair and cyclic quad supplementary statements', marks: 1 },
      { step: 'Step 3 & 4 algebraic elimination to arrive at equality', marks: 1 },
    ],
    commonMistakes: 'Forgetting to draw the circle diagram or failing to mention that ABCD is cyclic in reason 2 leads to 1.5 marks deduction.',
    formulaNote: 'Linear pair sum = 180°; Cyclic quad opposite angles = 180°',
    upvotesCount: 512,
    solvedCount: 1420,
  },
  {
    id: 'feed-q-103',
    author: {
      name: 'Dr. Sushila Banskota',
      role: 'NEB Chemistry Reviewer',
      avatar: '/avatars/teacher-chem.jpg',
      verified: true,
    },
    postedAt: '5 hours ago',
    subject: 'science',
    subjectName: 'Compulsory Science & Tech',
    chapter: 'Chemical Reactions & Periodic Table',
    marks: 2,
    group: 'Group B',
    difficulty: 'Medium',
    badge: '📌 GIVE REASON DRILL',
    question: 'Why is potassium (K) chemically more reactive than sodium (Na), even though both belong to Group IA (Alkali Metals)?',
    questionNepali: 'पोटासियम (K) र सोडियम (Na) दुवै समूह IA मा पर्ने भए तापनि पोटासियम किन सोडियम भन्दा बढी प्रतिक्रियाशील हुन्छ ? कारण लेख्नुहोस् ।',
    solution: 'Potassium (atomic number 19) has a larger atomic radius and more electron shells (4 shells: 2,8,8,1) than sodium (atomic number 11, 3 shells: 2,8,1). Consequently, the single valence electron of potassium is farther from the positively charged nucleus and experiences weaker electrostatic attraction. Therefore, potassium can lose its valence electron more readily than sodium, making it more chemically reactive.',
    markingBreakdown: [
      { step: 'Mentioning larger atomic size / more shells in Potassium', marks: 1 },
      { step: 'Explaining weaker nuclear hold and easier electron loss', marks: 1 },
    ],
    commonMistakes: 'Writing merely "because potassium comes below sodium" without discussing atomic size and nuclear attractive force yields only half credit.',
    upvotesCount: 289,
    solvedCount: 760,
  },
  {
    id: 'feed-q-104',
    author: {
      name: 'Prof. K.B. Thapa',
      role: 'Optional Mathematics Head',
      avatar: '/avatars/teacher-opt.jpg',
      verified: true,
    },
    postedAt: 'Yesterday',
    subject: 'opt_math',
    subjectName: 'Optional Mathematics',
    chapter: 'Trigonometry (Multiple Angles)',
    marks: 4,
    group: 'Group D',
    difficulty: 'Hard',
    badge: '🏆 CONDITIONAL IDENTITY',
    question: 'If A + B + C = π (180°), prove that: cos 2A + cos 2B + cos 2C = -1 - 4 cos A cos B cos C.',
    questionNepali: 'यदि A + B + C = 180° भए प्रमाणित गर्नुहोस्: cos 2A + cos 2B + cos 2C = -1 - 4 cos A cos B cos C.',
    solution: 'L.H.S. = (cos 2A + cos 2B) + cos 2C\nUsing transformation formula: cos C + cos D = 2 cos((C+D)/2) cos((C-D)/2):\n= 2 cos(A+B) cos(A-B) + (2 cos² C - 1)\nSince A + B = 180° - C => cos(A+B) = cos(180° - C) = -cos C:\n= 2(-cos C) cos(A-B) + 2 cos² C - 1\n= -1 - 2 cos C [ cos(A-B) - cos C ]\nSince cos C = -cos(A+B):\n= -1 - 2 cos C [ cos(A-B) + cos(A+B) ]\nSince cos(A+B) + cos(A-B) = 2 cos A cos B:\n= -1 - 2 cos C [ 2 cos A cos B ]\n= -1 - 4 cos A cos B cos C = R.H.S. (Proved).',
    markingBreakdown: [
      { step: 'Pairing (cos 2A + cos 2B) and applying transformation identity', marks: 1 },
      { step: 'Substituting cos(A+B) = -cos C correctly', marks: 1 },
      { step: 'Taking -2 cos C common and expanding remaining angles', marks: 1 },
      { step: 'Final step arriving at -1 - 4 cos A cos B cos C', marks: 1 },
    ],
    commonMistakes: 'Sign errors when factoring out negative signs inside brackets: [cos(A-B) - cos C] vs [cos(A-B) + cos C].',
    upvotesCount: 467,
    solvedCount: 1120,
  },
  {
    id: 'feed-q-105',
    author: {
      name: 'Ms. Anita Shrestha',
      role: 'Lead English Department',
      avatar: '/avatars/teacher-eng.jpg',
      verified: true,
    },
    postedAt: 'Yesterday',
    subject: 'english',
    subjectName: 'English Language',
    chapter: 'Grammar & Transformation',
    marks: 1,
    group: 'Group A',
    difficulty: 'Medium',
    badge: '⚡ SPEED GRAMMAR RULE',
    question: 'Transform into passive voice: "Nobody has opened this vintage box for centuries."',
    solution: 'Passive Voice: "This vintage box has not been opened for centuries."\nExplanation: When the active subject is "Nobody" or "No one", the passive verb must be made negative ("has not been opened") and "by nobody" is omitted because indefinite agents are not retained in standard formal English.',
    markingBreakdown: [
      { step: 'Correct passive tense ("has not been opened") and omitting indefinite pronoun', marks: 1 }
    ],
    commonMistakes: 'Writing "This box has been opened by nobody" is grammatically poor in board marking standards.',
    upvotesCount: 198,
    solvedCount: 650,
  }
];
