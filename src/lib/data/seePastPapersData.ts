export interface SeePastPaper {
  id: string;
  year: number;
  yearBikram: string; // e.g. '2081'
  subject: 'science' | 'math' | 'opt_math' | 'english' | 'nepali' | 'social';
  subjectName: string;
  province?: string;
  examType: 'Regular' | 'Supplementary' | 'Model Set';
  totalMarks: number;
  timeAllowed: string;
  pdfUrl: string;
  solutionPdfUrl?: string;
  downloadsCount: number;
  questionsSummary: string;
  keyTopicsCovered: string[];
  solutionAvailable: boolean;
  sampleQuestions: {
    group: 'Group A' | 'Group B' | 'Group C' | 'Group D';
    marks: number;
    question: string;
    answer: string;
  }[];
}

export const SEE_PAST_PAPERS: SeePastPaper[] = [
  {
    id: 'see-paper-2081-sci',
    year: 2024,
    yearBikram: '2081 BS',
    subject: 'science',
    subjectName: 'Compulsory Science & Tech',
    province: 'All Provinces (National Board)',
    examType: 'Regular',
    totalMarks: 75,
    timeAllowed: '2 Hours 15 Mins',
    pdfUrl: '/documents/past-papers/see_2081_science_paper.pdf',
    solutionPdfUrl: '/documents/past-papers/see_2081_science_solution.pdf',
    downloadsCount: 14820,
    questionsSummary: '24 questions covering Mechanics (Gravitation), Optics, Chemical Reactions, and Heredity.',
    keyTopicsCovered: ["Newton's Law of Gravitation", "Total Internal Reflection", "Extraction of Iron", "Mendelian Dihybrid Cross"],
    solutionAvailable: true,
    sampleQuestions: [
      {
        group: 'Group A',
        marks: 1,
        question: 'State Newton\'s Universal Law of Gravitation.',
        answer: 'Every particle of matter in the universe attracts every other particle with a force directly proportional to the product of their masses and inversely proportional to the square of the distance between their centres.'
      },
      {
        group: 'Group B',
        marks: 2,
        question: 'Why does a piece of iron sink in water but float in mercury?',
        answer: 'The density of iron (7.8 g/cm³) is greater than the density of water (1 g/cm³), hence it sinks in water. However, the density of iron is less than that of mercury (13.6 g/cm³), meaning the buoyant upthrust of mercury exceeds the weight of iron, allowing it to float.'
      },
      {
        group: 'Group C',
        marks: 3,
        question: 'Calculate the acceleration due to gravity on the surface of Jupiter if mass of Jupiter is 1.9 × 10²⁷ kg and its radius is 7.1 × 10⁷ m (G = 6.67 × 10⁻¹¹ N·m²/kg²).',
        answer: 'Formula: g = GM / R² = (6.67 × 10⁻¹¹ × 1.9 × 10²⁷) / (7.1 × 10⁷)² = (12.673 × 10¹⁶) / (5.041 × 10¹⁵) = 25.14 m/s².'
      },
      {
        group: 'Group D',
        marks: 4,
        question: 'Explain the laboratory preparation of Carbon Dioxide gas with a neat labelled diagram, balanced chemical equation, and two tests for identification.',
        answer: 'Lab preparation: CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑. Apparatus: Woulfe\'s bottle, thistle funnel, delivery tube, gas jar. Identification: 1) Turns moist blue litmus paper red. 2) Turns lime water [Ca(OH)₂] milky due to insoluble CaCO₃ formation.'
      }
    ]
  },
  {
    id: 'see-paper-2081-math',
    year: 2024,
    yearBikram: '2081 BS',
    subject: 'math',
    subjectName: 'Compulsory Mathematics',
    province: 'All Provinces',
    examType: 'Regular',
    totalMarks: 75,
    timeAllowed: '3 Hours',
    pdfUrl: '/documents/past-papers/see_2081_math_paper.pdf',
    solutionPdfUrl: '/documents/past-papers/see_2081_math_solution.pdf',
    downloadsCount: 18950,
    questionsSummary: '16 comprehensive questions covering Sets, Compound Interest, Mensuration solids, Algebra, and Circle Theorems.',
    keyTopicsCovered: ['Venn Diagrams 3 Sets', 'Compound Depreciation & Tax', 'Cone & Cylinder Composite Solid', 'Central vs Inscribed Angle Theorem'],
    solutionAvailable: true,
    sampleQuestions: [
      {
        group: 'Group A',
        marks: 1,
        question: 'Write the formula for calculating semi-annual compound amount when rate is R% and time is T years.',
        answer: 'CA = P [ 1 + R / 200 ]²ᵀ'
      },
      {
        group: 'Group B',
        marks: 2,
        question: 'If the total surface area of a sphere is 616 cm², find its radius (Take π = 22/7).',
        answer: 'TSA = 4πr² => 616 = 4 × (22/7) × r² => r² = (616 × 7) / 88 = 49 => r = 7 cm.'
      },
      {
        group: 'Group C',
        marks: 3,
        question: 'Simplify: (x² - 1/y²) / (x - 1/y) + (y² - 1/x²) / (y - 1/x).',
        answer: 'Factorizing difference of squares: [ (x - 1/y)(x + 1/y) ] / (x - 1/y) + [ (y - 1/x)(y + 1/x) ] / (y - 1/x) = (x + 1/y) + (y + 1/x) = (x + y) + (x + y)/xy = (x + y)(1 + 1/xy).'
      },
      {
        group: 'Group D',
        marks: 4,
        question: 'Theoretically prove that the angle subtended by an arc of a circle at the centre is twice the angle subtended by it at any point on the remaining circumference.',
        answer: 'Given: Circle with centre O, arc AB subtending ∠AOB at centre and ∠ACB at circumference. Construction: Join CO and produce to point D. Proof: Using exterior angle of isosceles triangles AOC and BOC, ∠AOD = 2∠ACO and ∠BOD = 2∠BCO. Adding both equations yields ∠AOB = 2∠ACB.'
      }
    ]
  },
  {
    id: 'see-paper-2080-sci',
    year: 2023,
    yearBikram: '2080 BS',
    subject: 'science',
    subjectName: 'Compulsory Science & Tech',
    province: 'Bagmati Province (Model Standard)',
    examType: 'Regular',
    totalMarks: 75,
    timeAllowed: '2 Hours 15 Mins',
    pdfUrl: '/documents/past-papers/see_2080_science_paper.pdf',
    solutionPdfUrl: '/documents/past-papers/see_2080_science_solution.pdf',
    downloadsCount: 22100,
    questionsSummary: 'Standard NEB paper with emphasis on Pascal law hydraulics, Transformer step-up calculations, and DNA replication.',
    keyTopicsCovered: ['Pascal Hydraulic Ratio', 'Step-up Transformer', 'Chemical Equation Balancing', 'Chromosome Number in Gametes'],
    solutionAvailable: true,
    sampleQuestions: [
      {
        group: 'Group A',
        marks: 1,
        question: 'What is 1 dioptre power of a lens?',
        answer: 'One dioptre is the optical power of a lens whose focal length is exactly 1 metre (P = 1/f).'
      },
      {
        group: 'Group B',
        marks: 2,
        question: 'State Archimedes\' Principle. What is the condition for a body to float?',
        answer: 'Archimedes\' Principle states that when a body is completely or partially immersed in a fluid, it experiences an upthrust equal to the weight of the fluid displaced. Condition for floatation: Weight of body = Weight of displaced fluid.'
      }
    ]
  },
  {
    id: 'see-paper-2080-opt-math',
    year: 2023,
    yearBikram: '2080 BS',
    subject: 'opt_math',
    subjectName: 'Optional Mathematics',
    province: 'All Provinces',
    examType: 'Regular',
    totalMarks: 75,
    timeAllowed: '3 Hours',
    pdfUrl: '/documents/past-papers/see_2080_opt_math_paper.pdf',
    downloadsCount: 13400,
    questionsSummary: 'Matrices (Cramer\'s Rule), Coordinate Geometry angle between lines, Conditional Trigonometry, Vector proofs.',
    keyTopicsCovered: ['Cramer\'s Determinant Method', 'Homogeneous Equations', 'sin 2A + sin 2B + sin 2C', 'Vector Medians of Triangle'],
    solutionAvailable: true,
    sampleQuestions: [
      {
        group: 'Group C',
        marks: 3,
        question: 'Solve using Cramer\'s Rule: 3x - 4y = 1, 2x + 3y = 12.',
        answer: 'D = |3, -4; 2, 3| = 9 - (-8) = 17. Dx = |1, -4; 12, 3| = 3 - (-48) = 51. Dy = |3, 1; 2, 12| = 36 - 2 = 34. Hence x = Dx/D = 51/17 = 3, y = Dy/D = 34/17 = 2.'
      }
    ]
  },
  {
    id: 'see-paper-2079-sci',
    year: 2022,
    yearBikram: '2079 BS',
    subject: 'science',
    subjectName: 'Compulsory Science & Tech',
    province: 'All Provinces',
    examType: 'Regular',
    totalMarks: 75,
    timeAllowed: '2 Hours 15 Mins',
    pdfUrl: '/documents/past-papers/see_2079_science_paper.pdf',
    downloadsCount: 19800,
    questionsSummary: 'Classic board paper covering Electro-magnetism, Periodic Table modern law, and Ecosystem trophic pyramid.',
    keyTopicsCovered: ['Electromagnetic Induction', 'Mendeleev vs Modern Table', 'Eye Defects (Myopia & Hypermetropia)', 'Biomass Pyramid'],
    solutionAvailable: true,
    sampleQuestions: [
      {
        group: 'Group B',
        marks: 2,
        question: 'Write two differences between Myopia and Hypermetropia with corrective lenses.',
        answer: '1) Myopia (near-sightedness) is inability to see distant objects clearly, corrected by concave lens. 2) Hypermetropia (far-sightedness) is inability to see nearby objects clearly, corrected by convex lens.'
      }
    ]
  },
  {
    id: 'see-paper-2079-eng',
    year: 2022,
    yearBikram: '2079 BS',
    subject: 'english',
    subjectName: 'English Language',
    province: 'National Board',
    examType: 'Regular',
    totalMarks: 75,
    timeAllowed: '3 Hours',
    pdfUrl: '/documents/past-papers/see_2079_english_paper.pdf',
    downloadsCount: 16500,
    questionsSummary: 'Reading Comprehension poems and stories, Formal application writing, Reported speech and Voice transformation.',
    keyTopicsCovered: ['Unseen Passage Comprehension', 'Voice & Reported Speech', 'Job Application with CV', 'Essay on Youth and Tech'],
    solutionAvailable: true,
    sampleQuestions: [
      {
        group: 'Group B',
        marks: 2,
        question: 'Change the speech: The teacher said to the students, "The earth revolves around the sun."',
        answer: 'The teacher told the students that the earth revolves around the sun (universal truth remains in present tense).'
      }
    ]
  },
  {
    id: 'see-paper-2078-math',
    year: 2021,
    yearBikram: '2078 BS',
    subject: 'math',
    subjectName: 'Compulsory Mathematics',
    province: 'All Provinces',
    examType: 'Regular',
    totalMarks: 75,
    timeAllowed: '3 Hours',
    pdfUrl: '/documents/past-papers/see_2078_math_paper.pdf',
    downloadsCount: 17200,
    questionsSummary: 'Compound interest with tax deduction, Quadratic equations by factoring, Height and distance 30°-60° angles.',
    keyTopicsCovered: ['Tax and Money Exchange', 'Circle Tangent-Chord Theorem', 'Combined Cone-Hemisphere Volume', 'Ogive Graph'],
    solutionAvailable: true,
    sampleQuestions: [
      {
        group: 'Group C',
        marks: 3,
        question: 'A pole 18m high casts a shadow of 6√3 m on the level ground. Find the angle of elevation of the sun.',
        answer: 'tan θ = Opposite / Adjacent = 18 / (6√3) = 3 / √3 = √3. Since tan 60° = √3, the angle of elevation of the sun is 60°.'
      }
    ]
  },
  {
    id: 'see-paper-2077-sci',
    year: 2020,
    yearBikram: '2077 BS',
    subject: 'science',
    subjectName: 'Compulsory Science & Tech',
    province: 'National Model Exam',
    examType: 'Model Set',
    totalMarks: 75,
    timeAllowed: '2 Hours 15 Mins',
    pdfUrl: '/documents/past-papers/see_2077_science_paper.pdf',
    downloadsCount: 15400,
    questionsSummary: 'Comprehensive model set by Curriculum Development Centre (CDC) reflecting revised curriculum competencies.',
    keyTopicsCovered: ['Gravitational Force Calculation', 'Ammonia Gas Haber Process', 'Nervous Reflex Arc', 'Renewable Energy Hydro'],
    solutionAvailable: true,
    sampleQuestions: [
      {
        group: 'Group B',
        marks: 2,
        question: 'Why does an iron nail sink in water while a massive ship made of iron floats?',
        answer: 'A solid nail has low volume, so the weight of water it displaces is less than its own weight. A ship is hollowed out with huge volume, displacing water whose weight is equal to or greater than the total ship weight.'
      }
    ]
  }
];
