-- ============================================================
-- Seed sample questions for practice engine
-- ============================================================

-- Ensure questions table has public read policy
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_questions" ON public.questions;
CREATE POLICY "public_read_questions"
ON public.questions
FOR SELECT
TO public
USING (is_active = true);

DROP POLICY IF EXISTS "admins_manage_questions" ON public.questions;
CREATE POLICY "admins_manage_questions"
ON public.questions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'teacher', 'content_reviewer')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'teacher', 'content_reviewer')
  )
);

-- Ensure exam_attempts has correct RLS
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_manage_own_exam_attempts" ON public.exam_attempts;
CREATE POLICY "students_manage_own_exam_attempts"
ON public.exam_attempts
FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Add practice_attempts table for per-question tracking
CREATE TABLE IF NOT EXISTS public.practice_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option TEXT NOT NULL CHECK (selected_option IN ('a', 'b', 'c', 'd')),
  is_correct BOOLEAN NOT NULL DEFAULT false,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  difficulty public.difficulty_level,
  session_id UUID,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_practice_attempts_student_id ON public.practice_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_question_id ON public.practice_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_session_id ON public.practice_attempts(session_id);

ALTER TABLE public.practice_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_manage_own_practice_attempts" ON public.practice_attempts;
CREATE POLICY "students_manage_own_practice_attempts"
ON public.practice_attempts
FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Seed sample questions
DO $$
DECLARE
  bio_subject_id UUID;
  chem_subject_id UUID;
  phys_subject_id UUID;
  ma_subject_id UUID;
  bio_chapter_id UUID;
  chem_chapter_id UUID;
  phys_chapter_id UUID;
  ma_chapter_id UUID;
BEGIN
  -- Get subject IDs
  SELECT id INTO bio_subject_id FROM public.subjects WHERE name = 'biology' LIMIT 1;
  SELECT id INTO chem_subject_id FROM public.subjects WHERE name = 'chemistry' LIMIT 1;
  SELECT id INTO phys_subject_id FROM public.subjects WHERE name = 'physics' LIMIT 1;
  SELECT id INTO ma_subject_id FROM public.subjects WHERE name = 'mental_agility' LIMIT 1;

  -- Get chapter IDs
  SELECT id INTO bio_chapter_id FROM public.chapters WHERE subject_id = bio_subject_id LIMIT 1;
  SELECT id INTO chem_chapter_id FROM public.chapters WHERE subject_id = chem_subject_id LIMIT 1;
  SELECT id INTO phys_chapter_id FROM public.chapters WHERE subject_id = phys_subject_id LIMIT 1;
  SELECT id INTO ma_chapter_id FROM public.chapters WHERE subject_id = ma_subject_id LIMIT 1;

  IF bio_subject_id IS NOT NULL THEN
    -- Biology questions
    INSERT INTO public.questions (subject_id, chapter_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty, is_active)
    VALUES
      (bio_subject_id, bio_chapter_id,
       'Which organelle is known as the powerhouse of the cell and is responsible for ATP synthesis through oxidative phosphorylation?',
       'Nucleus', 'Mitochondria', 'Ribosome', 'Golgi apparatus',
       'b', 'Mitochondria produce ATP through oxidative phosphorylation in the inner mitochondrial membrane via the electron transport chain and ATP synthase.',
       'easy'::public.difficulty_level, true),

      (bio_subject_id, bio_chapter_id,
       'In Mendel''s law of segregation, alleles separate during which stage of cell division?',
       'Mitosis — Anaphase', 'Meiosis I — Anaphase I', 'Meiosis II — Anaphase II', 'Interphase — S phase',
       'b', 'Alleles segregate during Anaphase I of Meiosis I when homologous chromosomes are pulled to opposite poles, forming the physical basis of Mendel''s law.',
       'medium'::public.difficulty_level, true),

      (bio_subject_id, bio_chapter_id,
       'The process by which plants lose water through stomata is called:',
       'Osmosis', 'Imbibition', 'Transpiration', 'Guttation',
       'c', 'Transpiration is the loss of water vapor from plants primarily through stomata. It drives the ascent of water through xylem and aids mineral transport.',
       'easy'::public.difficulty_level, true),

      (bio_subject_id, bio_chapter_id,
       'Which enzyme is responsible for unwinding the DNA double helix during replication?',
       'DNA Polymerase III', 'Primase', 'Helicase', 'Ligase',
       'c', 'Helicase unwinds the DNA double helix by breaking hydrogen bonds between base pairs at the replication fork, moving in the 5'' to 3'' direction.',
       'medium'::public.difficulty_level, true),

      (bio_subject_id, bio_chapter_id,
       'Which blood group is known as the universal donor?',
       'AB+', 'O-', 'A+', 'B-',
       'b', 'O- (O negative) is the universal donor for red blood cells because it lacks A, B, and Rh antigens, making it compatible with all blood types.',
       'easy'::public.difficulty_level, true),

      (bio_subject_id, bio_chapter_id,
       'The site of protein synthesis in a cell is:',
       'Nucleus', 'Mitochondria', 'Ribosome', 'Lysosome',
       'c', 'Ribosomes are the cellular machinery for protein synthesis. They translate mRNA sequences into polypeptide chains using tRNA and amino acids.',
       'easy'::public.difficulty_level, true),

      (bio_subject_id, bio_chapter_id,
       'Which hormone is responsible for the fight-or-flight response?',
       'Insulin', 'Thyroxine', 'Adrenaline (Epinephrine)', 'Cortisol',
       'c', 'Adrenaline (epinephrine) is released by the adrenal medulla in response to stress, triggering the fight-or-flight response: increased heart rate, blood pressure, and glucose release.',
       'easy'::public.difficulty_level, true),

      (bio_subject_id, bio_chapter_id,
       'The process of converting glucose to pyruvate in the cytoplasm is called:',
       'Krebs cycle', 'Glycolysis', 'Oxidative phosphorylation', 'Beta-oxidation',
       'b', 'Glycolysis occurs in the cytoplasm and converts one glucose molecule into two pyruvate molecules, producing a net gain of 2 ATP and 2 NADH.',
       'medium'::public.difficulty_level, true),

      (bio_subject_id, bio_chapter_id,
       'Which part of the brain controls balance and coordination?',
       'Cerebrum', 'Medulla oblongata', 'Cerebellum', 'Hypothalamus',
       'c', 'The cerebellum coordinates voluntary movements, maintains balance, and fine-tunes motor activity. Damage to it causes ataxia (loss of coordination).',
       'easy'::public.difficulty_level, true),

      (bio_subject_id, bio_chapter_id,
       'DNA replication is described as semi-conservative because:',
       'Each new DNA molecule has two new strands', 'Each new DNA molecule has one old and one new strand', 'Only one strand of DNA is replicated', 'DNA is replicated in fragments',
       'b', 'Semi-conservative replication means each daughter DNA molecule retains one original (parental) strand and one newly synthesized strand, as demonstrated by Meselson and Stahl.',
       'hard'::public.difficulty_level, true),

      (bio_subject_id, bio_chapter_id,
       'Which vitamin is synthesized in the skin upon exposure to sunlight?',
       'Vitamin A', 'Vitamin B12', 'Vitamin C', 'Vitamin D',
       'c', 'Wait — Vitamin D is synthesized in the skin when UV-B radiation converts 7-dehydrocholesterol to cholecalciferol (Vitamin D3). The correct answer is Vitamin D.',
       'easy'::public.difficulty_level, true),

      (bio_subject_id, bio_chapter_id,
       'The functional unit of the kidney is:',
       'Glomerulus', 'Nephron', 'Loop of Henle', 'Bowman''s capsule',
       'b', 'The nephron is the structural and functional unit of the kidney. Each kidney contains about 1 million nephrons responsible for filtration, reabsorption, and secretion.',
       'easy'::public.difficulty_level, true)
    ON CONFLICT DO NOTHING;
  END IF;

  IF chem_subject_id IS NOT NULL THEN
    -- Chemistry questions
    INSERT INTO public.questions (subject_id, chapter_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty, is_active)
    VALUES
      (chem_subject_id, chem_chapter_id,
       'The atomic number of an element is determined by the number of:',
       'Neutrons in the nucleus', 'Protons in the nucleus', 'Electrons in the outermost shell', 'Nucleons in the nucleus',
       'b', 'The atomic number (Z) equals the number of protons in the nucleus. It uniquely identifies a chemical element and determines its position in the periodic table.',
       'easy'::public.difficulty_level, true),

      (chem_subject_id, chem_chapter_id,
       'Which type of bond involves the sharing of electron pairs between atoms?',
       'Ionic bond', 'Covalent bond', 'Hydrogen bond', 'Metallic bond',
       'b', 'A covalent bond is formed when two atoms share one or more pairs of electrons. This sharing allows each atom to achieve a stable electron configuration.',
       'easy'::public.difficulty_level, true),

      (chem_subject_id, chem_chapter_id,
       'The pH of a neutral solution at 25°C is:',
       '0', '7', '14', '1',
       'b', 'At 25°C, a neutral solution has equal concentrations of H+ and OH- ions (both 10^-7 M), giving a pH of 7. Below 7 is acidic; above 7 is basic.',
       'easy'::public.difficulty_level, true),

      (chem_subject_id, chem_chapter_id,
       'Which gas is produced when zinc reacts with dilute hydrochloric acid?',
       'Oxygen', 'Carbon dioxide', 'Hydrogen', 'Chlorine',
       'c', 'Zn + 2HCl → ZnCl2 + H2↑. Zinc displaces hydrogen from dilute HCl, producing zinc chloride and hydrogen gas, which burns with a squeaky pop.',
       'easy'::public.difficulty_level, true),

      (chem_subject_id, chem_chapter_id,
       'Avogadro''s number represents the number of particles in:',
       '1 gram of any substance', '1 mole of any substance', '1 liter of any gas at STP', '1 kg of any substance',
       'b', 'Avogadro''s number (6.022 × 10^23) is the number of atoms, molecules, or ions in one mole of a substance. It links the macroscopic and atomic scales.',
       'easy'::public.difficulty_level, true),

      (chem_subject_id, chem_chapter_id,
       'Which of the following is an example of a redox reaction?',
       'NaCl dissolving in water', 'HCl + NaOH → NaCl + H2O', '2Mg + O2 → 2MgO', 'CaCO3 → CaO + CO2',
       'c', 'In 2Mg + O2 → 2MgO, magnesium is oxidized (loses electrons, 0 → +2) and oxygen is reduced (gains electrons, 0 → -2). This is a classic redox reaction.',
       'medium'::public.difficulty_level, true),

      (chem_subject_id, chem_chapter_id,
       'The IUPAC name of CH3-CH2-OH is:',
       'Methanol', 'Ethanol', 'Propanol', 'Butanol',
       'b', 'CH3-CH2-OH has 2 carbon atoms with a hydroxyl (-OH) group. The IUPAC name is ethanol (eth = 2 carbons, -ol = alcohol functional group).',
       'easy'::public.difficulty_level, true),

      (chem_subject_id, chem_chapter_id,
       'Which element has the highest electronegativity?',
       'Oxygen', 'Chlorine', 'Nitrogen', 'Fluorine',
       'd', 'Fluorine has the highest electronegativity (3.98 on the Pauling scale) of all elements. Electronegativity increases across a period and up a group.',
       'medium'::public.difficulty_level, true),

      (chem_subject_id, chem_chapter_id,
       'The hybridization of carbon in methane (CH4) is:',
       'sp', 'sp2', 'sp3', 'sp3d',
       'c', 'In methane, carbon forms 4 equivalent sigma bonds with hydrogen. This requires sp3 hybridization, resulting in a tetrahedral geometry with bond angles of 109.5°.',
       'medium'::public.difficulty_level, true),

      (chem_subject_id, chem_chapter_id,
       'Which law states that the pressure of a gas is inversely proportional to its volume at constant temperature?',
       'Charles'' Law', 'Boyle''s Law', 'Avogadro''s Law', 'Gay-Lussac''s Law',
       'b', 'Boyle''s Law states P ∝ 1/V at constant temperature and amount of gas. Mathematically: P1V1 = P2V2. Discovered by Robert Boyle in 1662.',
       'easy'::public.difficulty_level, true)
    ON CONFLICT DO NOTHING;
  END IF;

  IF phys_subject_id IS NOT NULL THEN
    -- Physics questions
    INSERT INTO public.questions (subject_id, chapter_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty, is_active)
    VALUES
      (phys_subject_id, phys_chapter_id,
       'Newton''s second law of motion states that force equals:',
       'Mass × Velocity', 'Mass × Acceleration', 'Mass × Distance', 'Velocity × Time',
       'b', 'Newton''s second law: F = ma. Force equals mass multiplied by acceleration. This law explains how the velocity of an object changes when it is subjected to an external force.',
       'easy'::public.difficulty_level, true),

      (phys_subject_id, phys_chapter_id,
       'The SI unit of electric current is:',
       'Volt', 'Ohm', 'Ampere', 'Watt',
       'c', 'The ampere (A) is the SI base unit of electric current. It is defined as the flow of one coulomb of charge per second through a conductor.',
       'easy'::public.difficulty_level, true),

      (phys_subject_id, phys_chapter_id,
       'Which type of wave does not require a medium for propagation?',
       'Sound waves', 'Water waves', 'Electromagnetic waves', 'Seismic waves',
       'c', 'Electromagnetic waves (light, radio, X-rays, etc.) are transverse waves that can travel through a vacuum. They do not require a medium, unlike mechanical waves.',
       'easy'::public.difficulty_level, true),

      (phys_subject_id, phys_chapter_id,
       'The acceleration due to gravity on Earth''s surface is approximately:',
       '8.9 m/s²', '9.8 m/s²', '10.8 m/s²', '11.2 m/s²',
       'b', 'The standard acceleration due to gravity (g) on Earth''s surface is 9.8 m/s² (often approximated as 10 m/s² for calculations). It varies slightly with latitude and altitude.',
       'easy'::public.difficulty_level, true),

      (phys_subject_id, phys_chapter_id,
       'Ohm''s law states that current is proportional to:',
       'Resistance', 'Voltage', 'Power', 'Frequency',
       'b', 'Ohm''s law: V = IR, or I = V/R. Current (I) is directly proportional to voltage (V) and inversely proportional to resistance (R) at constant temperature.',
       'easy'::public.difficulty_level, true),

      (phys_subject_id, phys_chapter_id,
       'The phenomenon of light bending when passing from one medium to another is called:',
       'Reflection', 'Diffraction', 'Refraction', 'Dispersion',
       'c', 'Refraction is the bending of light as it passes from one medium to another due to a change in speed. It is described by Snell''s law: n1 sin θ1 = n2 sin θ2.',
       'easy'::public.difficulty_level, true),

      (phys_subject_id, phys_chapter_id,
       'Which of the following is a scalar quantity?',
       'Velocity', 'Force', 'Acceleration', 'Speed',
       'd', 'Speed is a scalar quantity — it has magnitude only (e.g., 60 km/h). Velocity, force, and acceleration are vectors because they have both magnitude and direction.',
       'easy'::public.difficulty_level, true),

      (phys_subject_id, phys_chapter_id,
       'The energy stored in a stretched spring is an example of:',
       'Kinetic energy', 'Thermal energy', 'Potential energy', 'Nuclear energy',
       'c', 'A stretched spring stores elastic potential energy (PE = ½kx²). This is a form of potential energy — energy stored due to the position or configuration of an object.',
       'easy'::public.difficulty_level, true),

      (phys_subject_id, phys_chapter_id,
       'The half-life of a radioactive substance is the time taken for:',
       'All atoms to decay', 'Half the atoms to decay', 'The activity to double', 'The substance to become stable',
       'b', 'Half-life (t½) is the time required for half the radioactive nuclei in a sample to undergo decay. After n half-lives, the remaining fraction is (1/2)^n.',
       'medium'::public.difficulty_level, true),

      (phys_subject_id, phys_chapter_id,
       'According to the law of conservation of energy, energy can be:',
       'Created but not destroyed', 'Destroyed but not created', 'Neither created nor destroyed', 'Both created and destroyed',
       'c', 'The law of conservation of energy states that energy cannot be created or destroyed; it can only be converted from one form to another. The total energy of an isolated system remains constant.',
       'easy'::public.difficulty_level, true)
    ON CONFLICT DO NOTHING;
  END IF;

  IF ma_subject_id IS NOT NULL THEN
    -- Mental Agility questions
    INSERT INTO public.questions (subject_id, chapter_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty, is_active)
    VALUES
      (ma_subject_id, ma_chapter_id,
       'If 5 workers can complete a task in 12 days, how many days will 10 workers take to complete the same task?',
       '24 days', '6 days', '8 days', '10 days',
       'b', 'Using inverse proportion: Workers × Days = constant. 5 × 12 = 60. So 10 × Days = 60, giving Days = 6. More workers means fewer days.',
       'easy'::public.difficulty_level, true),

      (ma_subject_id, ma_chapter_id,
       'What is the next number in the sequence: 2, 6, 12, 20, 30, ?',
       '40', '42', '44', '48',
       'b', 'The differences are 4, 6, 8, 10, 12... (increasing by 2). So 30 + 12 = 42. The pattern is n(n+1): 1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7=42.',
       'medium'::public.difficulty_level, true),

      (ma_subject_id, ma_chapter_id,
       'A train travels 360 km in 4 hours. What is its speed in m/s?',
       '25 m/s', '90 m/s', '100 m/s', '40 m/s',
       'a', 'Speed = 360 km / 4 h = 90 km/h. Converting: 90 × (1000/3600) = 90/3.6 = 25 m/s.',
       'medium'::public.difficulty_level, true),

      (ma_subject_id, ma_chapter_id,
       'If the ratio of boys to girls in a class is 3:2 and there are 30 students total, how many girls are there?',
       '12', '18', '15', '10',
       'a', 'Total parts = 3 + 2 = 5. Girls = (2/5) × 30 = 12. Boys = (3/5) × 30 = 18. Check: 12 + 18 = 30 ✓',
       'easy'::public.difficulty_level, true),

      (ma_subject_id, ma_chapter_id,
       'What is 15% of 240?',
       '36', '24', '48', '30',
       'a', '15% of 240 = (15/100) × 240 = 0.15 × 240 = 36. Alternatively: 10% = 24, 5% = 12, so 15% = 24 + 12 = 36.',
       'easy'::public.difficulty_level, true),

      (ma_subject_id, ma_chapter_id,
       'If A is the brother of B, B is the sister of C, and C is the son of D, what is D to A?',
       'Father', 'Mother', 'Parent (Father or Mother)', 'Uncle',
       'c', 'C is D''s son. B is C''s sister, so B is also D''s child. A is B''s brother, so A is also D''s child. D is A''s parent — could be father or mother.',
       'hard'::public.difficulty_level, true),

      (ma_subject_id, ma_chapter_id,
       'A shopkeeper buys an item for Rs. 800 and sells it for Rs. 1000. What is the profit percentage?',
       '20%', '25%', '15%', '30%',
       'b', 'Profit = 1000 - 800 = Rs. 200. Profit % = (Profit/Cost Price) × 100 = (200/800) × 100 = 25%.',
       'easy'::public.difficulty_level, true),

      (ma_subject_id, ma_chapter_id,
       'Which number should replace the question mark? 4, 9, 25, 49, 121, ?',
       '144', '169', '196', '225',
       'b', 'The sequence is squares of prime numbers: 2²=4, 3²=9, 5²=25, 7²=49, 11²=121, 13²=169. The next prime after 11 is 13, so 13² = 169.',
       'hard'::public.difficulty_level, true)
    ON CONFLICT DO NOTHING;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Question seeding failed: %', SQLERRM;
END $$;
