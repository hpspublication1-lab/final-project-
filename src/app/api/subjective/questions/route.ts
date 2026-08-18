import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SubjectiveQuestion } from '@/components/subjective/types';

// Fallback high-yield SEE Class 10 written exam questions if database table is initially empty
const FALLBACK_SEE_QUESTIONS: SubjectiveQuestion[] = [
  {
    id: 'see-sci-01-gravitation',
    program: 'see',
    subject: 'Compulsory Science',
    chapter: 'Force & Gravitation',
    question_text: 'State Newton\'s Universal Law of Gravitation. Calculate the gravitational force between the Earth (mass = 6 × 10²⁴ kg) and the Moon (mass = 7.4 × 10²² kg) if the distance between their centers is 3.84 × 10⁸ m. (G = 6.67 × 10⁻¹¹ N m²/kg²)',
    marks: 4,
    suggested_time_minutes: 10,
    sample_solution: `1. Statement (1 Mark): Every mass particle in the universe attracts every other mass particle with a force directly proportional to the product of their masses and inversely proportional to the square of distance between their centers. Formula: F = G(m₁m₂)/d².
2. Given values (1 Mark):
   - Mass of Earth (m₁) = 6 × 10²⁴ kg
   - Mass of Moon (m₂) = 7.4 × 10²² kg
   - Distance (d) = 3.84 × 10⁸ m
   - G = 6.67 × 10⁻¹¹ N m²/kg²
3. Calculation (1.5 Marks):
   F = (6.67 × 10⁻¹¹ × 6 × 10²⁴ × 7.4 × 10²²) / (3.84 × 10⁸)²
   F = (2.961 × 10³⁷) / (1.47456 × 10¹⁷)
   F = 2.01 × 10²⁰ N
4. Final Answer Statement & Unit (0.5 Mark): The gravitational force is 2.01 × 10²⁰ N.`,
    rubric: [
      { criterion: 'Law Statement & Formula', max_marks: 1, description: 'Correct wording of Newton\'s Law and formula F = G(m1m2)/d^2' },
      { criterion: 'Data Identification', max_marks: 1, description: 'Proper listing of given values with correct SI units' },
      { criterion: 'Step-by-step Substitution & Math', max_marks: 1.5, description: 'Correct exponent calculations and intermediate steps' },
      { criterion: 'Final Unit & Statement', max_marks: 0.5, description: 'Final numerical answer 2.01 x 10^20 with unit Newton (N)' },
    ],
  },
  {
    id: 'see-sci-02-heredity',
    program: 'see',
    subject: 'Compulsory Science',
    chapter: 'Heredity & Mendelism',
    question_text: 'State Mendel\'s Law of Dominance. Show a Punnett square cross between a pure tall pea plant (TT) and a pure dwarf pea plant (tt) up to the F₂ generation. Write the phenotypic and genotypic ratios.',
    marks: 4,
    suggested_time_minutes: 8,
    sample_solution: `1. Law of Dominance (1 Mark): In a cross between two organisms contrasting for a trait, only one trait (dominant) expresses itself in F₁ generation, while the other trait (recessive) remains hidden.
2. F₁ Cross Diagram (1 Mark):
   Parents: TT (Tall) × tt (Dwarf)
   Gametes: T and t
   F₁ Generation: Tt (100% All Hybrid Tall)
3. F₂ Punnett Square Cross (1 Mark):
   Selfing F₁: Tt × Tt
   Gametes: T, t
   F₂ Genotypes: TT (Pure Tall), Tt (Hybrid Tall), Tt (Hybrid Tall), tt (Dwarf)
4. Ratios (1 Mark):
   - Phenotypic Ratio = 3 Tall : 1 Dwarf (3:1)
   - Genotypic Ratio = 1 Pure Tall : 2 Hybrid Tall : 1 Dwarf (1:2:1)`,
    rubric: [
      { criterion: 'Law Statement', max_marks: 1, description: 'Definition of dominant vs recessive trait' },
      { criterion: 'F1 Generation Diagram', max_marks: 1, description: 'Parental genotypes and F1 hybrid tall offspring' },
      { criterion: 'F2 Punnett Square Chart', max_marks: 1, description: 'Clean 2x2 Punnett square grid' },
      { criterion: 'Phenotypic & Genotypic Ratios', max_marks: 1, description: 'Correct 3:1 and 1:2:1 ratios stated' },
    ],
  },
  {
    id: 'see-math-01-venn',
    program: 'see',
    subject: 'Compulsory Mathematics',
    chapter: 'Sets & Venn Diagrams',
    question_text: 'In a survey of 100 students, 65 like Mathematics, 45 like Science, and 20 like both subjects. Find: (i) The number of students who like at least one subject, (ii) The number of students who like neither subject, (iii) Illustrate the information in a clean Venn diagram.',
    marks: 4,
    suggested_time_minutes: 10,
    sample_solution: `1. Given Data & Set Symbols (1 Mark):
   Let U = Total students = 100
   M = Students who like Math, n(M) = 65
   S = Students who like Science, n(S) = 45
   Intersection n(M ∩ S) = 20
2. Part (i) At least one subject (1 Mark):
   n(M ∪ S) = n(M) + n(S) - n(M ∩ S)
   n(M ∪ S) = 65 + 45 - 20 = 90 students
3. Part (ii) Neither subject (1 Mark):
   n(M ∪ S)' = n(U) - n(M ∪ S)
   n(M ∪ S)' = 100 - 90 = 10 students
4. Part (iii) Venn Diagram Illustration (1 Mark):
   Draw universal set rectangle U with two overlapping circles M and S.
   Central overlap = 20
   Only Math n°(M) = 65 - 20 = 45
   Only Science n°(S) = 45 - 20 = 25
   Outside circles = 10`,
    rubric: [
      { criterion: 'Set Notation & Given Data', max_marks: 1, description: 'Listing n(U), n(M), n(S), n(M ∩ S)' },
      { criterion: 'Calculation of n(M ∪ S)', max_marks: 1, description: 'Using formula n(A ∪ B) = n(A) + n(B) - n(A ∩ B)' },
      { criterion: 'Calculation of Complement n(M ∪ S)\'', max_marks: 1, description: 'Subtracting union from universal set' },
      { criterion: 'Venn Diagram Accuracy', max_marks: 1, description: 'Correctly labeled region values (45, 20, 25, 10)' },
    ],
  },
  {
    id: 'see-optmath-01-trig',
    program: 'see',
    subject: 'Optional Mathematics',
    chapter: 'Trigonometric Identities',
    question_text: 'Prove the trigonometric identity: (sin 2A / (1 + cos 2A)) = tan A',
    marks: 2,
    suggested_time_minutes: 5,
    sample_solution: `LHS = sin 2A / (1 + cos 2A)
Using double-angle formulas:
  sin 2A = 2 sin A cos A
  1 + cos 2A = 2 cos² A
Substituting into LHS:
  LHS = (2 sin A cos A) / (2 cos² A)
Canceling 2 and cos A from numerator and denominator:
  LHS = sin A / cos A = tan A = RHS.
Hence Proved.`,
    rubric: [
      { criterion: 'Formula Substitution', max_marks: 1, description: 'Applying sin 2A = 2sinAcosA and 1 + cos 2A = 2cos^2A' },
      { criterion: 'Simplification & Proof', max_marks: 1, description: 'Canceling terms to reach tan A = RHS' },
    ],
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const program = searchParams.get('program') || 'see';
    const subject = searchParams.get('subject');
    const chapter = searchParams.get('chapter');
    const marks = searchParams.get('marks');

    const supabase = await createClient();

    let query = supabase
      .from('subjective_questions')
      .select('*')
      .eq('program', program);

    if (subject && subject !== 'all') {
      query = query.eq('subject', subject);
    }
    if (chapter && chapter !== 'all') {
      query = query.eq('chapter', chapter);
    }
    if (marks && marks !== 'all') {
      query = query.eq('marks', parseInt(marks, 10));
    }

    const { data: dbQuestions, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.warn('Database query error for subjective_questions (using fallback):', error.message);
    }

    // Combine DB questions with fallback questions filtered by request params
    let questionsList: SubjectiveQuestion[] = dbQuestions && dbQuestions.length > 0 ? dbQuestions : FALLBACK_SEE_QUESTIONS;

    if (subject && subject !== 'all') {
      questionsList = questionsList.filter((q) => q.subject.toLowerCase() === subject.toLowerCase());
    }
    if (marks && marks !== 'all') {
      questionsList = questionsList.filter((q) => q.marks === parseInt(marks, 10));
    }

    return NextResponse.json({
      questions: questionsList,
      count: questionsList.length,
    });
  } catch (err) {
    console.error('API /api/subjective/questions error:', err);
    return NextResponse.json({ error: 'Failed to fetch subjective questions' }, { status: 500 });
  }
}
