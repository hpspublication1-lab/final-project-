export interface SeeQuestion {
  id: string;
  subject: 'science' | 'math' | 'opt_math' | 'english' | 'nepali' | 'social' | 'computer' | 'accountancy';
  subjectName: string;
  chapter: string;
  subtopic?: string;
  sectionNumber: 1 | 2 | 3 | 4;
  section: 'Section 1 (Very Short)' | 'Section 2 (Short Answer)' | 'Section 3 (Problem Solving)' | 'Section 4 (Long & HOTS)';
  group: 'Group A' | 'Group B' | 'Group C' | 'Group D';
  marks: 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10;
  questionType: 'very_short' | 'short_answer' | 'numerical' | 'derivation' | 'diagram' | 'long_answer' | 'hots' | 'objective';
  question: string;
  questionNepali?: string;
  year: string;
  province?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  solution: string;
  
  // Numerical structured breakdown
  numericalSteps?: {
    given?: string;
    formula?: string;
    substitution?: string;
    calculation?: string;
    finalAnswer?: string;
  };
  
  markingScheme: { step: string; marks: number }[];
  examTip?: string;
  commonMistakes?: string;
  relatedFormulas?: string[];
  diagramUrl?: string;
  videoUrl?: string;
}

export interface SeeSubjectHierarchy {
  id: string;
  name: string;
  code: string;
  icon: string;
  chapters: {
    name: string;
    subtopics: string[];
  }[];
}

export const SEE_SUBJECT_HIERARCHY: SeeSubjectHierarchy[] = [
  {
    id: 'science',
    name: 'Compulsory Science & Tech',
    code: 'SCI-10',
    icon: '🔬',
    chapters: [
      {
        name: 'Force & Gravitation',
        subtopics: ["Newton's Universal Law of Gravitation", 'Acceleration due to Gravity (g)', 'Free Fall & Weightlessness', 'Gravity & Weight'],
      },
      {
        name: 'Pressure',
        subtopics: ["Pascal's Law & Hydraulic Press", "Archimedes' Principle & Law of Flotation", 'Atmospheric & Liquid Pressure'],
      },
      {
        name: 'Energy, Light & Electricity',
        subtopics: ['Refraction of Light & Lenses', 'Electric Power, Transformer & Circuit Calculation', 'Renewable Energy Sources'],
      },
      {
        name: 'Chemical Reactions & Periodic Table',
        subtopics: ['Modern Periodic Law & Groups', 'Types of Chemical Reactions', 'Acid, Base & Salt Calculations'],
      },
      {
        name: 'Metals & Industrial Chemistry',
        subtopics: ['Extraction of Iron & Copper', 'Manufacture of Carbon Dioxide & Ammonia', 'Ceramics, Plastics & Fertilizers'],
      },
      {
        name: 'Heredity, Nervous System & Environment',
        subtopics: ["Mendel's Laws of Inheritance", 'Human Nervous & Endocrine System', 'Chromosomes, DNA & Cell Division'],
      },
    ],
  },
  {
    id: 'math',
    name: 'Compulsory Mathematics',
    code: 'MATH-10',
    icon: '📐',
    chapters: [
      {
        name: 'Sets & Cardinality',
        subtopics: ['Cardinality Formula for 2 Sets', 'Word Problems with 3 Sets & Venn Diagrams'],
      },
      {
        name: 'Arithmetic & Compound Interest',
        subtopics: ['Compound Interest (Yearly & Half-Yearly)', 'Depreciation & Population Growth', 'VAT, Money Exchange & Profit/Loss'],
      },
      {
        name: 'Mensuration (2D & 3D)',
        subtopics: ['Cone, Cylinder & Sphere Combined Solids', 'Prism, Pyramid & Hemispherical Bowls', 'Cost Estimation for Painting/Tiles'],
      },
      {
        name: 'Algebra & Equations',
        subtopics: ['HCF & LCM of Algebraic Expressions', 'Quadratic Equations & Word Problems', 'Indices & Surds Simplification'],
      },
      {
        name: 'Geometry (Theorems & Riders)',
        subtopics: ['Area of Parallelograms & Triangles on Same Base', 'Circles: Central & Inscribed Angles', 'Cyclic Quadrilaterals & Tangent Theorems', 'Experimental & Geometric Constructions'],
      },
      {
        name: 'Trigonometry & Statistics',
        subtopics: ['Height and Distance with Elevation/Depression', 'Mean, Median, Quartiles & Ogive Graphs'],
      },
    ],
  },
  {
    id: 'opt_math',
    name: 'Optional Mathematics',
    code: 'OPT-10',
    icon: '📊',
    chapters: [
      {
        name: 'Functions & Polynomials',
        subtopics: ['Composite & Inverse Functions', 'Remainder & Factor Theorems', 'Synthetic Division & Roots'],
      },
      {
        name: 'Matrices & Determinants',
        subtopics: ['Inverse of a 2x2 Matrix', "Cramer's Rule for Linear Equations", 'Matrix Equation Method'],
      },
      {
        name: 'Coordinate Geometry',
        subtopics: ['Angle between Two Straight Lines', 'Pair of Straight Lines passing through Origin', 'Equation of Circle & Tangents'],
      },
      {
        name: 'Trigonometry (Compound & Multiple Angles)',
        subtopics: ['Trigonometric Identities (A+B, A-B)', 'Multiple Angles (2A, 3A) & Submultiples', 'Conditional Trigonometric Identities', 'Trigonometric Equations (0° to 360°)'],
      },
      {
        name: 'Vectors & Transformations',
        subtopics: ['Dot Product & Angle between Vectors', 'Vector Geometry Theorem Proofs', 'Combined Transformations (Reflection, Rotation, Translation)'],
      },
    ],
  },
  {
    id: 'english',
    name: 'English Language',
    code: 'ENG-10',
    icon: '📚',
    chapters: [
      {
        name: 'Reading Comprehension',
        subtopics: ['Seen Texts (Poems, Essays, Stories)', 'Unseen News Articles & Travelogues', 'Chart / Graph Interpretation'],
      },
      {
        name: 'Grammar & Transformation',
        subtopics: ['Tense, Voice & Reported Speech', 'Conditionals, Connectives & Tags', 'Prepositions, Articles & Subject-Verb Agreement'],
      },
      {
        name: 'Guided & Free Writing',
        subtopics: ['Formal Letters (Job Application, Editor)', 'Email & Essay Writing (150-200 words)', 'Dialogue, News Story & Book Review'],
      },
    ],
  },
  {
    id: 'nepali',
    name: 'Nepali (नेपाली)',
    code: 'NEP-10',
    icon: '🇳🇵',
    chapters: [
      {
        name: 'व्याकरण (Grammar)',
        subtopics: ['वर्णविन्यास र पदवर्ग (नाम, सर्वनाम, विशेषण, क्रियापद)', 'काल, पक्ष, भाव, र वाच्य रूपान्तरण', 'कारक, विभक्ति र समास प्रक्रिया'],
      },
      {
        name: 'पाठ्यपुस्तक तथा विवेचना (Literature)',
        subtopics: ['संक्षिप्त उत्तर (कविता, कथा, निबन्ध)', 'व्याख्या गर्नुहोस् (सप्रसङ्ग व्याख्या)', 'विवेचनात्मक तथा समीक्षात्मक उत्तर'],
      },
      {
        name: 'रचना तथा अभिव्यक्ति (Composition)',
        subtopics: ['बुँदा टिपोट र सारांश लेखन', 'चिठी, निवेदन, मनोवाद र संवाद लेखन', 'समसामयिक निबन्ध लेखन'],
      },
    ],
  },
  {
    id: 'social',
    name: 'Social Studies & Life Skills',
    code: 'SOC-10',
    icon: '🌍',
    chapters: [
      {
        name: 'हाम्रो समाज र विकास (Society & Development)',
        subtopics: ['मानव संसाधन विकास र नेपालको पूर्वाधार', 'दिगो विकास र जनसङ्ख्या व्यवस्थापन'],
      },
      {
        name: 'नेपालको इतिहास र संविधान (History & Constitution)',
        subtopics: ['२००७ देखि २०६२/६३ सम्मका ऐतिहासिक घटनाहरू', 'नेपालको वर्तमान संविधान र मौलिक हकहरू', 'निर्वाचन प्रणाली र नागरिक कर्तव्य'],
      },
      {
        name: 'भूगोल र नक्सा कार्य (Geography & Map Work)',
        subtopics: ['नेपालको नक्सा कोर्ने र तथ्यहरू भर्ने विधि', 'विश्वको महादेश तथा जलवायु प्रणाली'],
      },
      {
        name: 'अन्तर्राष्ट्रिय सम्बन्ध र समसामयिक (International Affairs)',
        subtopics: ['संयुक्त राष्ट्रसङ्घ (UN) र यसका अङ्गहरू', 'सार्क (SAARC) र नेपालको परराष्ट्र नीति'],
      },
    ],
  },
];

export const SEE_QUESTION_BANK: SeeQuestion[] = [
  // ==========================================================================
  // COMPULSORY SCIENCE & TECHNOLOGY
  // ==========================================================================
  
  // Section 1: 1 Mark (Group A)
  {
    id: 'sci-1m-01',
    subject: 'science',
    subjectName: 'Compulsory Science & Tech',
    chapter: 'Force & Gravitation',
    subtopic: 'Acceleration due to Gravity (g)',
    sectionNumber: 1,
    section: 'Section 1 (Very Short)',
    group: 'Group A',
    marks: 1,
    questionType: 'very_short',
    question: "Define acceleration due to gravity (g) and write its standard SI value on the Earth's surface.",
    questionNepali: 'गुरुत्वप्रवेग (g) को परिभाषा लेख्नुहोस् र पृथ्वीको सतहमा यसको मानक मान कति हुन्छ लेख्नुहोस्।',
    year: 'NEB 2080 Regular',
    difficulty: 'Easy',
    examTip: 'Always mention SI units (m/s²) with numerical values in 1 mark definitions.',
    markingScheme: [
      { step: 'Definition of acceleration due to gravity', marks: 0.5 },
      { step: 'Standard SI value (9.8 m/s²)', marks: 0.5 },
    ],
    solution: `**Definition:**
Acceleration due to gravity ($g$) is defined as the acceleration produced on a freely falling body under the sole influence of Earth's gravitational pull without any air resistance.

**Standard SI Value:**
On the surface of the Earth, standard $g = 9.8 \\text{ m/s}^2$ (or $9.81 \\text{ m/s}^2$).`,
  },
  {
    id: 'sci-1m-02',
    subject: 'science',
    subjectName: 'Compulsory Science & Tech',
    chapter: 'Chemical Reactions & Periodic Table',
    subtopic: 'Modern Periodic Law & Groups',
    sectionNumber: 1,
    section: 'Section 1 (Very Short)',
    group: 'Group A',
    marks: 1,
    questionType: 'very_short',
    question: 'State Modern Periodic Law.',
    questionNepali: 'आधुनिक आवर्त नियम (Modern Periodic Law) लेख्नुहोस्।',
    year: 'NEB 2079',
    difficulty: 'Easy',
    examTip: 'Mention "atomic number" instead of "atomic weight" to secure full 1 mark.',
    markingScheme: [
      { step: 'Statement stating physical and chemical properties are periodic functions of atomic numbers', marks: 1.0 },
    ],
    solution: `**Modern Periodic Law:**
"The physical and chemical properties of elements are periodic functions of their atomic numbers."`,
  },
  {
    id: 'sci-1m-03',
    subject: 'science',
    subjectName: 'Compulsory Science & Tech',
    chapter: 'Energy, Light & Electricity',
    subtopic: 'Electric Power, Transformer & Circuit Calculation',
    sectionNumber: 1,
    section: 'Section 1 (Very Short)',
    group: 'Group A',
    marks: 1,
    questionType: 'very_short',
    question: 'What is 1 kilowatt-hour (1 kWh) of electrical energy in Joules?',
    questionNepali: '१ किलोवाट-घण्टा (1 kWh) विद्युत शक्तिलाई जुल (Joules) मा कति हुन्छ लेख्नुहोस्।',
    year: 'NEB 2081 Model',
    difficulty: 'Easy',
    examTip: 'Show $1 \\text{ kWh} = 1000 \\text{ W} \\times 3600 \\text{ s} = 3.6 \\times 10^6 \\text{ J}$.',
    markingScheme: [
      { step: 'Conversion calculation and final value $3.6 \\times 10^6 \\text{ J}$', marks: 1.0 },
    ],
    solution: `$$1 \\text{ kWh} = 1 \\text{ kW} \\times 1 \\text{ hr} = 1000 \\text{ W} \\times 3600 \\text{ s} = 3.6 \\times 10^6 \\text{ Joules (J)}$$`,
  },

  // Section 2: 2 Marks (Group B)
  {
    id: 'sci-2m-01',
    subject: 'science',
    subjectName: 'Compulsory Science & Tech',
    chapter: 'Force & Gravitation',
    subtopic: 'Free Fall & Weightlessness',
    sectionNumber: 2,
    section: 'Section 2 (Short Answer)',
    group: 'Group B',
    marks: 2,
    questionType: 'short_answer',
    question: 'Why does a parachute descend slowly while a stone falls rapidly in air?',
    questionNepali: 'प्यारासुट हावामा बिस्तारै खस्छ तर ढुङ्गा छिटो खस्छ, किन? कारण दिनुहोस्।',
    year: 'NEB 2080 Regular',
    difficulty: 'Medium',
    examTip: 'Differentiate between surface area and upward air resistance acting on both objects.',
    markingScheme: [
      { step: 'Mentioning parachute has large surface area and high upward air resistance', marks: 1.0 },
      { step: 'Mentioning stone has small surface area and negligible air resistance', marks: 1.0 },
    ],
    solution: `**Scientific Reason:**
1. A parachute has a very large surface area. When it falls through air, it experiences a large upward force of **air resistance (upthrust)**, which balances its weight quickly to reach a small terminal velocity.
2. In contrast, a stone has a very small surface area compared to its mass, so the air resistance acting on it is negligible. Hence, it falls rapidly with full acceleration due to gravity ($g$).`,
  },
  {
    id: 'sci-2m-02',
    subject: 'science',
    subjectName: 'Compulsory Science & Tech',
    chapter: 'Pressure',
    subtopic: "Archimedes' Principle & Law of Flotation",
    sectionNumber: 2,
    section: 'Section 2 (Short Answer)',
    group: 'Group B',
    marks: 2,
    questionType: 'short_answer',
    question: 'State two conditions required for a body to float on a liquid.',
    questionNepali: 'कुनै वस्तु तरल पदार्थमा तैरिन आवश्यक पर्ने कुनै दुई सर्तहरू लेख्नुहोस्।',
    year: 'NEB 2078',
    difficulty: 'Easy',
    examTip: 'Relate weight of body with upthrust and density of body with liquid density.',
    markingScheme: [
      { step: 'Condition 1: Weight of body = Weight of displaced liquid (Upthrust)', marks: 1.0 },
      { step: 'Condition 2: Average density of body ≤ Density of the liquid', marks: 1.0 },
    ],
    solution: `**Two Conditions for Flotation:**
1. **Force Equilibrium:** The total downward weight of the floating body must be equal to the upward thrust (weight of the liquid displaced by the submerged part).
$$\\text{Weight of Body} = \\text{Upthrust (U)}$$
2. **Density Relation:** The average density of the body must be less than or equal to the density of the liquid ($\\rho_{\\text{body}} \\le \\rho_{\\text{liquid}}$).`,
  },

  // Section 3: 3 Marks (Group C)
  {
    id: 'sci-3m-01',
    subject: 'science',
    subjectName: 'Compulsory Science & Tech',
    chapter: 'Metals & Industrial Chemistry',
    subtopic: 'Manufacture of Carbon Dioxide & Ammonia',
    sectionNumber: 3,
    section: 'Section 3 (Problem Solving)',
    group: 'Group C',
    marks: 3,
    questionType: 'numerical',
    question: 'Describe the laboratory preparation of Ammonia gas with a balanced chemical equation and collection method.',
    questionNepali: 'प्रयोगशालामा एमोनिया ग्यास बनाउने विधिको सन्तुलित रासायनिक समीकरण र सङ्कलन गर्ने तरिका लेख्नुहोस्।',
    year: 'NEB 2080 Regular',
    difficulty: 'Medium',
    examTip: 'Specify downward displacement of air because ammonia is lighter than air.',
    markingScheme: [
      { step: 'Reactants: Ammonium chloride (NH4Cl) and Calcium hydroxide (Ca(OH)2)', marks: 1.0 },
      { step: 'Balanced Chemical Equation', marks: 1.0 },
      { step: 'Collection method: Downward displacement of air in an inverted dry gas jar', marks: 1.0 },
    ],
    solution: `**1. Reactants Used:**
A mixture of Ammonium chloride ($\\text{NH}_4\\text{Cl}$) and Calcium hydroxide / Slaked lime ($\\text{Ca(OH)}_2$) in a ratio of $2:1$ by weight.

**2. Balanced Chemical Reaction:**
$$2\\text{NH}_4\\text{Cl} + \\text{Ca(OH)}_2 \\xrightarrow{\\Delta} \\text{CaCl}_2 + 2\\text{H}_2\\text{O} + 2\\text{NH}_3\\uparrow$$

**3. Collection Method:**
Ammonia gas is collected by the **downward displacement of air** in an inverted dry gas jar because it is lighter than air and highly soluble in water (so it cannot be collected over water).`,
  },

  // Section 4: 4 Marks (Group D)
  {
    id: 'sci-4m-01',
    subject: 'science',
    subjectName: 'Compulsory Science & Tech',
    chapter: 'Force & Gravitation',
    subtopic: "Newton's Universal Law of Gravitation",
    sectionNumber: 4,
    section: 'Section 4 (Long & HOTS)',
    group: 'Group D',
    marks: 4,
    questionType: 'hots',
    question: 'The mass of Jupiter is $1.9 \\times 10^{27} \\text{ kg}$ and its radius is $7.1 \\times 10^7 \\text{ m}$. Calculate the acceleration due to gravity on Jupiter ($g_J$). If an astronaut weighs $700 \\text{ N}$ on Earth ($g_E = 9.8 \\text{ m/s}^2$), what will be his weight on Jupiter? ($G = 6.67 \\times 10^{-11} \\text{ N m}^2/\\text{kg}^2$)',
    questionNepali: 'बृहस्पति ग्रहको पिण्ड $1.9 \\times 10^{27} \\text{ kg}$ र अर्धव्यास $7.1 \\times 10^7 \\text{ m}$ छ। बहस्पतिको गुरुत्वप्रवेग ($g_J$) हिसाब गर्नुहोस्। यदि पृथ्वीमा एक अन्तरिक्षयात्रीको तौल $700 \\text{ N}$ भए बृहस्पतिमा कति हुन्छ? ($g_E = 9.8 \\text{ m/s}^2$)',
    year: 'NEB 2081 Expected',
    difficulty: 'Hard',
    examTip: 'Calculate mass on Earth first ($m = W_E / g_E$), then find weight on Jupiter ($W_J = m \\times g_J$).',
    numericalSteps: {
      given: 'Mass of Jupiter $M = 1.9 \\times 10^{27} \\text{ kg}$, Radius $R = 7.1 \\times 10^7 \\text{ m}$, Weight on Earth $W_E = 700 \\text{ N}$, $g_E = 9.8 \\text{ m/s}^2$.',
      formula: '$g_J = \\frac{G M}{R^2}$ and $W_J = m \\times g_J = \\left(\\frac{W_E}{g_E}\\right) \\times g_J$.',
      substitution: '$g_J = \\frac{6.67 \\times 10^{-11} \\times 1.9 \\times 10^{27}}{(7.1 \\times 10^7)^2} = \\frac{1.2673 \\times 10^{17}}{5.041 \\times 10^{15}} = 25.14 \\text{ m/s}^2$.',
      calculation: 'Mass of astronaut $m = \\frac{700}{9.8} = 71.43 \\text{ kg}$. Weight on Jupiter $W_J = 71.43 \\times 25.14 = 1795.75 \\text{ N}$.',
      finalAnswer: 'Acceleration due to gravity on Jupiter $g_J = 25.14 \\text{ m/s}^2$, Weight on Jupiter = $1795.75 \\text{ N}$.',
    },
    markingScheme: [
      { step: 'Given values and formula $g = GM/R^2$', marks: 1.0 },
      { step: 'Correct calculation of $g_J = 25.14 \\text{ m/s}^2$', marks: 1.5 },
      { step: 'Calculation of mass on Earth $m = 71.43 \\text{ kg}$', marks: 0.5 },
      { step: 'Final weight calculation with unit $W_J = 1795.75 \\text{ N}$', marks: 1.0 },
    ],
    solution: `**Step 1: Given Data:**
- Mass of Jupiter ($M$) = $1.9 \\times 10^{27} \\text{ kg}$
- Radius of Jupiter ($R$) = $7.1 \\times 10^7 \\text{ m}$
- Gravitational constant ($G$) = $6.67 \\times 10^{-11} \\text{ N m}^2/\\text{kg}^2$
- Weight on Earth ($W_E$) = $700 \\text{ N}$, $g_E = 9.8 \\text{ m/s}^2$

**Step 2: Calculate Acceleration due to Gravity on Jupiter ($g_J$):**
$$g_J = \\frac{G \\cdot M}{R^2} = \\frac{6.67 \\times 10^{-11} \\times 1.9 \\times 10^{27}}{(7.1 \\times 10^7)^2}$$
$$g_J = \\frac{1.2673 \\times 10^{17}}{5.041 \\times 10^{15}} = 25.14 \\text{ m/s}^2$$

**Step 3: Calculate Weight on Jupiter ($W_J$):**
$$\\text{Mass of astronaut } m = \\frac{W_E}{g_E} = \\frac{700}{9.8} = 71.43 \\text{ kg}$$
$$\\text{Weight on Jupiter } W_J = m \\times g_J = 71.43 \\times 25.14 = 1795.75 \\text{ N}$$

**Final Answer:**
- Acceleration due to gravity on Jupiter ($g_J$) = **$25.14 \\text{ m/s}^2$**
- Weight of the astronaut on Jupiter = **$1,795.75 \\text{ N}$**`,
  },

  // ==========================================================================
  // COMPULSORY MATHEMATICS (अनिवार्य गणित)
  // ==========================================================================
  
  // Section 1: 1 Mark
  {
    id: 'math-1m-01',
    subject: 'math',
    subjectName: 'Compulsory Mathematics',
    chapter: 'Sets & Cardinality',
    subtopic: 'Cardinality Formula for 2 Sets',
    sectionNumber: 1,
    section: 'Section 1 (Very Short)',
    group: 'Group A',
    marks: 1,
    questionType: 'very_short',
    question: 'If A and B are two intersecting sets, write the formula for $n(A \\cup B)$ in terms of $n(A)$, $n(B)$, and $n(A \\cap B)$.',
    questionNepali: 'यदि A र B दुई खप्टिएका समूहहरू भए $n(A \\cup B)$ को सूत्र लेख्नुहोस्।',
    year: 'NEB 2080',
    difficulty: 'Easy',
    examTip: 'Remember to subtract the intersection part once.',
    markingScheme: [
      { step: 'Correct formula $n(A \\cup B) = n(A) + n(B) - n(A \\cap B)$', marks: 1.0 },
    ],
    solution: `$$n(A \\cup B) = n(A) + n(B) - n(A \\cap B)$$`,
  },
  {
    id: 'math-1m-02',
    subject: 'math',
    subjectName: 'Compulsory Mathematics',
    chapter: 'Arithmetic & Compound Interest',
    subtopic: 'Compound Interest (Yearly & Half-Yearly)',
    sectionNumber: 1,
    section: 'Section 1 (Very Short)',
    group: 'Group A',
    marks: 1,
    questionType: 'very_short',
    question: 'Write the formula to calculate semi-annual compound amount (C.A.) for principal P, rate R% p.a., and time T years.',
    questionNepali: 'साँवा P, वार्षिक ब्याजदर R% र समय T वर्ष भए अर्धवार्षिक चक्रीय मिश्रधन (C.A.) निकाल्ने सूत्र लेख्नुहोस्।',
    year: 'NEB 2079',
    difficulty: 'Easy',
    examTip: 'Semi-annual means rate is halved (R/200) and time is doubled (2T).',
    markingScheme: [
      { step: 'Formula $\\text{C.A.} = P \\left(1 + \\frac{R}{200}\\right)^{2T}$', marks: 1.0 },
    ],
    solution: `$$\\text{Compound Amount (Semi-annual)} = P \\left(1 + \\frac{R}{200}\\right)^{2T}$$`,
  },

  // Section 2: 2 Marks
  {
    id: 'math-2m-01',
    subject: 'math',
    subjectName: 'Compulsory Mathematics',
    chapter: 'Mensuration (2D & 3D)',
    subtopic: 'Cone, Cylinder & Sphere Combined Solids',
    sectionNumber: 2,
    section: 'Section 2 (Short Answer)',
    group: 'Group B',
    marks: 2,
    questionType: 'numerical',
    question: 'The radius of a solid sphere is $7 \\text{ cm}$. Find its total surface area (TSA).',
    questionNepali: 'एउटा ठोस गोलाको अर्धव्यास $7 \\text{ cm}$ भए यसको पूरा सतहको क्षेत्रफल पत्ता लगाउनुहोस्।',
    year: 'NEB 2080 Regular',
    difficulty: 'Easy',
    examTip: "Formula for TSA of sphere is $4\\pi r^2$. Don't confuse with hemisphere.",
    markingScheme: [
      { step: 'Formula $\\text{TSA} = 4\\pi r^2$', marks: 1.0 },
      { step: 'Calculation and final value $616 \\text{ cm}^2$', marks: 1.0 },
    ],
    solution: `**Given:**
Radius ($r$) = $7 \\text{ cm}$

$$\\text{Total Surface Area of Sphere (TSA)} = 4\\pi r^2$$
$$\\text{TSA} = 4 \\times \\frac{22}{7} \\times 7^2 = 4 \\times 22 \\times 7 = 616 \\text{ cm}^2$$`,
  },

  // Section 3: 3 Marks
  {
    id: 'math-3m-01',
    subject: 'math',
    subjectName: 'Compulsory Mathematics',
    chapter: 'Algebra & Equations',
    subtopic: 'HCF & LCM of Algebraic Expressions',
    sectionNumber: 3,
    section: 'Section 3 (Problem Solving)',
    group: 'Group C',
    marks: 3,
    questionType: 'short_answer',
    question: 'Find the HCF of $x^3 - 8$ and $x^2 - 4x + 4$.',
    questionNepali: '$x^3 - 8$ र $x^2 - 4x + 4$ को म.स. (HCF) पत्ता लगाउनुहोस्।',
    year: 'NEB 2080',
    difficulty: 'Medium',
    examTip: 'Factorize each expression using $a^3 - b^3$ and $(a-b)^2$.',
    markingScheme: [
      { step: 'First expression factorization $(x-2)(x^2 + 2x + 4)$', marks: 1.0 },
      { step: 'Second expression factorization $(x-2)^2$', marks: 1.0 },
      { step: 'Identifying common factor $(x-2)$ as HCF', marks: 1.0 },
    ],
    solution: `**First Expression:**
$$x^3 - 8 = x^3 - 2^3 = (x - 2)(x^2 + 2x + 4)$$

**Second Expression:**
$$x^2 - 4x + 4 = (x - 2)^2 = (x - 2)(x - 2)$$

**Common Factor (HCF):**
$$\\text{HCF} = (x - 2)$$`,
  },

  // Section 4: 4 Marks
  {
    id: 'math-4m-01',
    subject: 'math',
    subjectName: 'Compulsory Mathematics',
    chapter: 'Geometry (Theorems & Riders)',
    subtopic: 'Area of Parallelograms & Triangles on Same Base',
    sectionNumber: 4,
    section: 'Section 4 (Long & HOTS)',
    group: 'Group D',
    marks: 4,
    questionType: 'derivation',
    question: 'Theoretically prove that parallelograms standing on the same base and between the same parallel lines are equal in area.',
    questionNepali: 'एउटै आधार र उही समानान्तर रेखाहरू बीच बनेका समानान्तर चतुर्भुजहरूको क्षेत्रफल बराबर हुन्छ भनी सैद्धान्तिक प्रमाण गर्नुहोस्।',
    year: 'NEB 2080 & 2078',
    difficulty: 'Medium',
    examTip: 'Draw neat labeled diagram with given, to prove, and statement-reason columns.',
    markingScheme: [
      { step: 'Correct diagram, Given and To Prove statements', marks: 1.0 },
      { step: 'Congruency of the two triangles outside common area', marks: 1.5 },
      { step: 'Area equation and conclusion statements with reasons', marks: 1.5 },
    ],
    solution: `**Given:**
Parallelograms $ABCD$ and $ABEF$ stand on the same base $AB$ and between the same parallel lines $AB \\parallel DE$.

**To Prove:**
$$\\text{Area of } \\square ABCD = \\text{Area of } \\square ABEF$$

**Proof Table:**

| Statements | Reasons |
|---|---|
| 1. In $\\Delta ADF$ and $\\Delta BCE$: | |
| (i) $\\angle ADF = \\angle BCE$ ($A$) | Corresponding angles as $AD \\parallel BC$ |
| (ii) $\\angle AFD = \\angle BEC$ ($A$) | Corresponding angles as $AF \\parallel BE$ |
| (iii) $AD = BC$ ($S$) | Opposite sides of parallelogram $ABCD$ |
| 2. $\\Delta ADF \\cong \\Delta BCE$ | By AAS axiom of congruency |
| 3. $\\text{Area of } \\Delta ADF = \\text{Area of } \\Delta BCE$ | Congruent triangles have equal areas |
| 4. $\\text{Area of } \\square ABED = \\text{Area of } \\square ABED$ | Same common figure |
| 5. $\\text{Area of } \\square ABCD = \\text{Area of } \\square ABEF$ | Subtracting/Adding congruent triangles from common area |

**Conclusion:**
Hence, parallelograms on the same base and between the same parallels are equal in area. *(Proved)*`,
  },

  // ==========================================================================
  // OPTIONAL MATHEMATICS (ऐच्छिक गणित)
  // ==========================================================================
  {
    id: 'opt-4m-01',
    subject: 'opt_math',
    subjectName: 'Optional Mathematics',
    chapter: 'Matrices & Determinants',
    subtopic: "Cramer's Rule for Linear Equations",
    sectionNumber: 4,
    section: 'Section 4 (Long & HOTS)',
    group: 'Group D',
    marks: 4,
    questionType: 'hots',
    question: "Solve the system of linear equations using Cramer's Rule:\n$$3x + 2y = 12$$\n$$2x + 3y = 13$$",
    questionNepali: 'क्रेमर्सको नियम (Cramer\'s Rule) प्रयोग गरी समीकरण हल गर्नुहोस्:\n$$3x + 2y = 12$$\n$$2x + 3y = 13$$',
    year: 'NEB 2080 Regular',
    difficulty: 'Medium',
    examTip: 'Calculate $D$, $D_1$, and $D_2$ clearly before computing $x = D_1/D$ and $y = D_2/D$.',
    numericalSteps: {
      given: 'Equations: $3x + 2y = 12$ and $2x + 3y = 13$.',
      formula: '$D = \\begin{vmatrix} 3 & 2 \\\\ 2 & 3 \\end{vmatrix}$, $D_1 = \\begin{vmatrix} 12 & 2 \\\\ 13 & 3 \\end{vmatrix}$, $D_2 = \\begin{vmatrix} 3 & 12 \\\\ 2 & 13 \\end{vmatrix}$, $x = \\frac{D_1}{D}, y = \\frac{D_2}{D}$.',
      substitution: '$D = (3)(3) - (2)(2) = 9 - 4 = 5$.\n$D_1 = (12)(3) - (13)(2) = 36 - 26 = 10$.\n$D_2 = (3)(13) - (2)(12) = 39 - 24 = 15$.',
      calculation: '$x = \\frac{10}{5} = 2$, $y = \\frac{15}{5} = 3$.',
      finalAnswer: '$x = 2$ and $y = 3$.',
    },
    markingScheme: [
      { step: 'Correct determinant $D = 5$', marks: 1.0 },
      { step: 'Correct determinants $D_1 = 10$ and $D_2 = 15$', marks: 2.0 },
      { step: 'Final values $x = 2$ and $y = 3$', marks: 1.0 },
    ],
    solution: `**Step 1: Find the Coefficient Determinant ($D$):**
$$D = \\begin{vmatrix} 3 & 2 \\\\ 2 & 3 \\end{vmatrix} = (3 \\times 3) - (2 \\times 2) = 9 - 4 = 5 \\neq 0$$

**Step 2: Find $D_x$ (or $D_1$) by replacing x-column with constants:**
$$D_x = \\begin{vmatrix} 12 & 2 \\\\ 13 & 3 \\end{vmatrix} = (12 \\times 3) - (13 \\times 2) = 36 - 26 = 10$$

**Step 3: Find $D_y$ (or $D_2$) by replacing y-column with constants:**
$$D_y = \\begin{vmatrix} 3 & 12 \\\\ 2 & 13 \\end{vmatrix} = (3 \\times 13) - (2 \\times 12) = 39 - 24 = 15$$

**Step 4: Solve for $x$ and $y$ using Cramer's Formula:**
$$x = \\frac{D_x}{D} = \\frac{10}{5} = 2$$
$$y = \\frac{D_y}{D} = \\frac{15}{5} = 3$$

**Final Answer:**
$$x = 2, \\quad y = 3$$`,
  },

  // ==========================================================================
  // ENGLISH LANGUAGE
  // ==========================================================================
  {
    id: 'eng-1m-01',
    subject: 'english',
    subjectName: 'English Language',
    chapter: 'Grammar & Transformation',
    subtopic: 'Tense, Voice & Reported Speech',
    sectionNumber: 1,
    section: 'Section 1 (Very Short)',
    group: 'Group A',
    marks: 1,
    questionType: 'very_short',
    question: 'Transform into passive voice: "The chef cooked a delicious meal yesterday."',
    year: 'NEB 2080',
    difficulty: 'Easy',
    examTip: 'Past simple active (cooked) becomes was/were + V3 (was cooked).',
    markingScheme: [
      { step: 'Correct passive transformation "A delicious meal was cooked by the chef yesterday."', marks: 1.0 },
    ],
    solution: `**Passive Voice:**
"A delicious meal was cooked by the chef yesterday."`,
  },
  {
    id: 'eng-4m-01',
    subject: 'english',
    subjectName: 'English Language',
    chapter: 'Guided & Free Writing',
    subtopic: 'Formal Letters (Job Application, Editor)',
    sectionNumber: 4,
    section: 'Section 4 (Long & HOTS)',
    group: 'Group D',
    marks: 5,
    questionType: 'long_answer',
    question: 'Write a formal letter to the editor of a national daily expressing your concern about increasing traffic congestion and road accidents in Kathmandu Valley. (Word limit: 120-150 words)',
    year: 'NEB 2080 Regular',
    difficulty: 'Medium',
    examTip: 'Follow formal layout: Sender address, Date, Receiver address, Subject, Salutation, 3 body paragraphs, and formal sign-off.',
    markingScheme: [
      { step: 'Format (Sender address, date, subject line, salutation, subscription)', marks: 1.5 },
      { step: 'Content & relevant arguments (Causes, problems, solutions)', marks: 2.0 },
      { step: 'Language accuracy, vocabulary & grammar', marks: 1.5 },
    ],
    solution: `**Model Formal Letter:**

Kathmandu, Nepal  
15th Jestha, 2082  

To  
The Editor  
The Kathmandu Post  
Kathmandu, Nepal  

**Subject: Growing Concern over Traffic Congestion and Road Accidents**

Sir/Madam,  

Through the columns of your esteemed newspaper, I wish to draw the urgent attention of the concerned authorities and the general public towards the escalating problem of traffic congestion and road accidents in Kathmandu Valley.

Due to the exponential increase in unmanaged vehicles, narrow roads, and frequent violation of lane rules, commuters are forced to spend hours stranded in gridlocks. Furthermore, reckless speeding and inadequate zebra crossings have turned major intersections into accident-prone zones, endangering pedestrian lives daily.

To tackle this crisis, the Department of Transport Management and Traffic Police must implement strict digital speed monitoring, expand mass transit networks, and enforce rigorous pedestrian safety protocols. I earnestly hope this matter receives immediate attention.

Yours sincerely,  
**Rohan Sharma**  
Concerned Citizen`,
  },

  // ==========================================================================
  // NEPALI (नेपाली)
  // ==========================================================================
  {
    id: 'nep-1m-01',
    subject: 'nepali',
    subjectName: 'Nepali (नेपाली)',
    chapter: 'व्याकरण (Grammar)',
    subtopic: 'वर्णविन्यास र पदवर्ग (नाम, सर्वनाम, विशेषण, क्रियापद)',
    sectionNumber: 1,
    section: 'Section 1 (Very Short)',
    group: 'Group A',
    marks: 1,
    questionType: 'very_short',
    question: 'रेखाङ्कित शब्दको पदवर्ग पहिचान गर्नुहोस्: "हामीले **सधैं** सत्य बोल्नुपर्छ।"',
    year: 'NEB 2080',
    difficulty: 'Easy',
    examTip: 'सधैं शब्दले समय/निरन्तरता जनाउने भएकाले यो क्रियायोगी (क्रियाविशेषण) हो।',
    markingScheme: [
      { step: 'सही पदवर्ग पहिचान (क्रियायोगी / क्रियाविशेषण)', marks: 1.0 },
    ],
    solution: `**पदवर्ग पहिचान:**
- **सधैं** = **क्रियायोगी (क्रियाविशेषण)** (समय वा निरन्तरता बुझाउने शब्द)`,
  },
  {
    id: 'nep-4m-01',
    subject: 'nepali',
    subjectName: 'Nepali (नेपाली)',
    chapter: 'पाठ्यपुस्तक तथा विवेचना (Literature)',
    subtopic: 'विवेचनात्मक तथा समीक्षात्मक उत्तर',
    sectionNumber: 4,
    section: 'Section 4 (Long & HOTS)',
    group: 'Group D',
    marks: 4,
    questionType: 'long_answer',
    question: '"उज्यालो यात्रा" कविताको मूल भाव के हो? आफ्ना विचारसहित समीक्षात्मक विवेचना गर्नुहोस्।',
    year: 'NEB 2080 Regular',
    difficulty: 'Medium',
    examTip: 'कवि रामप्रसाद ज्ञवालीको परिचय, कविताको मुख्य सन्देश, आशावादिता, र समसामयिक सान्दर्भिकता समेट्नुहोस्।',
    markingScheme: [
      { step: 'कवि र कविताको सटिक परिचय', marks: 1.0 },
      { step: 'मूल भाव तथा जीवनोपयोगी आशावादी सन्देशको विश्लेषण', marks: 2.0 },
      { step: 'भाषा शैली, निष्कर्ष र समसामयिक महत्व', marks: 1.0 },
    ],
    solution: `**"उज्यालो यात्रा" कविताको मूल भाव र विवेचना:**

कवि रामप्रसाद ज्ञवालीद्वारा रचित 'उज्यालो यात्रा' कविता एक उत्कृष्ट प्रगतिवादी तथा आशावादी जीवनदर्शन बोकेको कविता हो। यस कवितामा जीवनलाई निराशाबाट आशातर्फ, अन्धकारबाट उज्यालोतर्फ र अज्ञानताबाट ज्ञानतर्फ डोर्‍याउने प्रेरणादायी सन्देश प्रवाह गरिएको छ।

कविताको मूल भाव मानव जीवनमा आइपर्ने कठिनाइ, बाधा र व्यवधानहरूसँग नडराई निरन्तर सत्कर्ममा लाग्नुपर्छ भन्ने हो। मानिसले आफ्नो स्वार्थभन्दा माथि उठेर समाज र राष्ट्रको कल्याणका लागि कर्मशील हुनुपर्छ। हिमाल जस्तै अटल र नदी जस्तै निरन्तर गतिमान भएर जीवनयात्रा तय गर्नुपर्छ। 

समग्रमा, 'उज्यालो यात्रा' कविताले प्रत्येक युवा तथा विद्यार्थीलाई सकारात्मक सोच, अनुशासन, सहअस्तित्व र कर्मठताको बाटोमा अग्रसर हुन मार्गदर्शन गरेको छ। यो कविता आजको समाजमा अझ बढी सान्दर्भिक देखिन्छ।`,
  },

  // ==========================================================================
  // SOCIAL STUDIES & LIFE SKILLS
  // ==========================================================================
  {
    id: 'soc-1m-01',
    subject: 'social',
    subjectName: 'Social Studies & Life Skills',
    chapter: 'नेपालको इतिहास र संविधान (History & Constitution)',
    subtopic: 'नेपालको वर्तमान संविधान र मौलिक हकहरू',
    sectionNumber: 1,
    section: 'Section 1 (Very Short)',
    group: 'Group A',
    marks: 1,
    questionType: 'very_short',
    question: 'How many Fundamental Rights are guaranteed in Part 3 of the present Constitution of Nepal?',
    questionNepali: 'नेपालको वर्तमान संविधानको भाग ३ मा कतिवटा मौलिक हकहरूको व्यवस्था गरिएको छ?',
    year: 'NEB 2080',
    difficulty: 'Easy',
    examTip: 'Articles 16 to 46 guarantee 31 fundamental rights.',
    markingScheme: [
      { step: 'Stating 31 Fundamental Rights', marks: 1.0 },
    ],
    solution: `There are **31 Fundamental Rights** (Articles 16 to 46) guaranteed in Part 3 of the Constitution of Nepal (2072).`,
  },
  {
    id: 'soc-4m-01',
    subject: 'social',
    subjectName: 'Social Studies & Life Skills',
    chapter: 'हाम्रो समाज र विकास (Society & Development)',
    subtopic: 'दिगो विकास र जनसङ्ख्या व्यवस्थापन',
    sectionNumber: 4,
    section: 'Section 4 (Long & HOTS)',
    group: 'Group D',
    marks: 4,
    questionType: 'long_answer',
    question: 'What is Sustainable Development? Explain any three measures that Nepal should adopt to achieve Sustainable Development Goals (SDGs) by 2030.',
    questionNepali: 'दिगो विकास भनेको के हो? सन् २०३० सम्म दिगो विकासका लक्ष्यहरू हासिल गर्न नेपालले अपनाउनुपर्ने कुनै तीन उपायहरू व्याख्या गर्नुहोस्।',
    year: 'NEB 2080 Regular',
    difficulty: 'Medium',
    examTip: 'Define Brundtland definition: Meeting present needs without compromising future generations.',
    markingScheme: [
      { step: 'Accurate definition of Sustainable Development', marks: 1.0 },
      { step: 'Three realistic actionable measures with explanations', marks: 3.0 },
    ],
    solution: `**1. Definition of Sustainable Development:**
Sustainable Development is development that meets the needs of the present generation without compromising the ability of future generations to meet their own needs. It harmonizes economic growth, social inclusion, and environmental protection.

**2. Three Key Measures for Nepal to Achieve SDGs:**
- **Promotion of Clean & Renewable Energy:** Expand hydroelectricity and solar power projects to replace fossil fuel dependency and reduce carbon emissions.
- **Investment in Quality Education & Healthcare:** Strengthen public education and modern health infrastructure in rural provinces to eradicate poverty and reduce inequalities (SDG 1, 3, 4).
- **Eco-Friendly Agriculture & Infrastructure:** Adopt organic farming, climate-resilient road engineering, and sustainable forestry to protect biodiversity in fragile Himalayan ecosystems (SDG 13, 15).`,
  },
];
