import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface AcademicResource {
  id: string;
  title: string;
  program: 'cee' | 'see' | 'ielts' | 'neb';
  subject: string;
  chapter: string;
  type: 'notes' | 'formula_sheet' | 'model_question' | 'ielts_pack';
  is_premium: boolean;
  reading_time_mins: number;
  download_count: number;
  pdf_url?: string | null;
  content: string;
  summary_key_points: string[];
  formula_sheet_latex?: string;
  created_at: string;
}

const CANONICAL_ACADEMIC_RESOURCES: AcademicResource[] = [
  // ── CEE Medical Entrance Resources ──────────────────────────────────────────
  {
    id: 'cee-phys-thermo',
    title: 'CEE Physics: Thermodynamics, Heat Transfer & Carnot Efficiency Master Notes',
    program: 'cee',
    subject: 'Physics',
    chapter: 'Thermodynamics',
    type: 'notes',
    is_premium: false,
    reading_time_mins: 14,
    download_count: 2480,
    pdf_url: null,
    content: `# CEE Physics: Thermodynamics & Thermal Physics

## 1. First Law of Thermodynamics
$$\\Delta Q = \\Delta U + \\Delta W$$
Where $\\Delta U$ is the change in internal energy, which depends **strictly on temperature** for an ideal gas:
$$\\Delta U = n C_v \\Delta T$$

### Thermodynamic Work Done
- **General Work Equation:** $W = \\int_{V_1}^{V_2} P \\, dV$
- **Isothermal Process ($T = \\text{const}$):**
  $$W = nRT \\ln\\left(\\frac{V_2}{V_1}\\right) = nRT \\ln\\left(\\frac{P_1}{P_2}\\right)$$
- **Adiabatic Process ($Q = 0$):**
  $$PV^\\gamma = \\text{const}, \\quad W = \\frac{nR(T_1 - T_2)}{\\gamma - 1} = \\frac{P_1 V_1 - P_2 V_2}{\\gamma - 1}$$
- **Isobaric Process ($P = \\text{const}$):** $W = P(V_2 - V_1) = nR\\Delta T$
- **Isochoric Process ($V = \\text{const}$):** $W = 0 \\implies \\Delta Q = \\Delta U$

---

## 2. Second Law & Carnot Engine
The maximum theoretical efficiency of any heat engine operating between a source ($T_1$) and sink ($T_2$ in Kelvin) is given by:
$$\\eta = 1 - \\frac{T_2}{T_1} = \\frac{W}{Q_1} = \\frac{Q_1 - Q_2}{Q_1}$$

> [!CAUTION]
> **MECEE Trap:** Always convert temperatures from Celsius to Kelvin ($K = ^\\circ C + 273.15$) before computing efficiency! Calculating with Celsius yields completely incorrect fractions.

---

## 3. High-Yield Past Exam Traps
1. **Slope of Adiabatic vs Isothermal:**
   $$\\left(\\frac{dP}{dV}\\right)_{\\text{adiabatic}} = \\gamma \\left(\\frac{dP}{dV}\\right)_{\\text{isothermal}}$$
   Since $\\gamma > 1$, the adiabatic curve on an indicator diagram is always $\\gamma$ times steeper than the isothermal curve.
2. **Molar Heat Capacities Ratio:**
   $$C_p - C_v = R, \\quad \\gamma = \\frac{C_p}{C_v} = 1 + \\frac{2}{f}$$
   - Monoatomic ($f=3$): $\\gamma = 5/3 \\approx 1.67$
   - Diatomic ($f=5$): $\\gamma = 7/5 = 1.40$
   - Polyatomic non-linear ($f=6$): $\\gamma = 4/3 \\approx 1.33$`,
    summary_key_points: [
      'Internal energy of an ideal gas depends solely on temperature: dU = n Cv dT.',
      'Slope of adiabatic curve is gamma times steeper than isothermal curve.',
      'Carnot efficiency formula strictly requires absolute temperature in Kelvin.',
      'For monoatomic gas gamma = 1.67, diatomic gas gamma = 1.40.',
    ],
    formula_sheet_latex: `\\Delta Q = \\Delta U + \\Delta W \\\\\n\\eta = 1 - \\frac{T_{\\text{sink}}}{T_{\\text{source}}} \\\\\nW_{\\text{isothermal}} = nRT \\ln\\left(\\frac{V_2}{V_1}\\right) \\\\\nW_{\\text{adiabatic}} = \\frac{nR(T_1 - T_2)}{\\gamma - 1} \\\\\nC_p - C_v = R, \\quad \\gamma = 1 + \\frac{2}{f}`,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'cee-bot-photosynthesis',
    title: 'CEE Botany: Photosynthesis ($C_3, C_4, \\text{CAM}$) & Respiration High-Yield Capsule',
    program: 'cee',
    subject: 'Botany',
    chapter: 'Plant Physiology',
    type: 'notes',
    is_premium: false,
    reading_time_mins: 16,
    download_count: 3120,
    pdf_url: null,
    content: `# CEE Botany: Plant Physiology & Photosynthesis Master Capsule

## 1. Light Reactions (Photochemical Phase)
Occurs in the **thylakoid membranes (grana)** of chloroplasts.
- **Photosystem II ($P_{680}$):** Located in appressed regions of grana thylakoids; carries out photolysis of water ($2H_2O \\to 4H^+ + 4e^- + O_2$).
- **Photosystem I ($P_{700}$):** Located in non-appressed regions of stroma thylakoids; reduces $NADP^+$ to $NADPH + H^+$ via Ferredoxin-$NADP^+$ reductase.
- **Chemiosmotic Hypothesis (Peter Mitchell):** Proton accumulation inside the thylakoid lumen creates a proton gradient ($pH$ inside drops to ~4-5), driving ATP synthesis through $CF_0 - CF_1$ ATP synthase.

---

## 2. Comparison of $C_3$, $C_4$, and CAM Pathways

| Feature | $C_3$ Pathway (Calvin Cycle) | $C_4$ Pathway (Hatch-Slack) | CAM Pathway |
| :--- | :--- | :--- | :--- |
| **Primary $CO_2$ Acceptor** | Ribulose 1,5-bisphosphate (RuBP, 5C) | Phosphoenolpyruvate (PEP, 3C) | PEP (at night) |
| **First Stable Product** | 3-PGA (3-Carbon acid) | Oxaloacetic Acid (OAA, 4C) | OAA / Malic Acid |
| **Kranz Anatomy** | Absent | Present (Bundle Sheath Cells) | Absent |
| **Photorespiration** | High (losses up to 25-40%) | Negligible / Absent | Very low |
| **Optimum Temperature** | $20^\\circ - 25^\\circ\\text{C}$ | $30^\\circ - 45^\\circ\\text{C}$ | High ($>35^\\circ\\text{C}$) |
| **Examples** | Wheat, Rice, Potato | Maize, Sugarcane, Sorghum | Pineapple, Opuntia, Kalanchoe |

---

## 3. High-Yield Entrance Points & Trap Alerts
- **RuBisCO:** Most abundant enzyme on Earth. Bifunctional: works as carboxylase at normal $CO_2/O_2$ ratio, but shifts to oxygenase when $O_2$ is high and temperature rises, initiating Photorespiration ($C_2$ cycle in Chloroplast $\\to$ Peroxisome $\\to$ Mitochondria).
- **ATP and NADPH Cost for One Glucose Molecule:**
  - In $C_3$ plants: $6 \\, CO_2 + 18 \\, \\text{ATP} + 12 \\, \\text{NADPH} \\to \\text{Glucose}$.
  - In $C_4$ plants: $6 \\, CO_2 + 30 \\, \\text{ATP} + 12 \\, \\text{NADPH} \\to \\text{Glucose}$ (12 extra ATP needed to regenerate PEP).`,
    summary_key_points: [
      'Primary CO2 acceptor in C3 is RuBP (5C); in C4 it is PEP (3C).',
      'First stable product: 3-PGA in C3, OAA (4C) in C4.',
      'C4 plants exhibit Kranz anatomy and avoid photorespiration completely.',
      'Photorespiration organelles sequence: Chloroplast -> Peroxisome -> Mitochondria.',
    ],
    formula_sheet_latex: `\\text{C}_3\\text{ Synthesis: } 6\\text{CO}_2 + 18\\text{ATP} + 12\\text{NADPH} \\to \\text{C}_6\\text{H}_{12}\\text{O}_6 + 18\\text{ADP} + 12\\text{NADP}^+ \\\\\n\\text{C}_4\\text{ Synthesis: } 6\\text{CO}_2 + 30\\text{ATP} + 12\\text{NADPH} \\to \\text{C}_6\\text{H}_{12}\\text{O}_6 + 30\\text{ADP} + 12\\text{NADP}^+`,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'cee-chem-mechanisms',
    title: 'CEE Chemistry: Organic Reaction Mechanisms, Name Reactions & Carbonyl Traps',
    program: 'cee',
    subject: 'Chemistry',
    chapter: 'Organic Chemistry',
    type: 'formula_sheet',
    is_premium: true,
    reading_time_mins: 15,
    download_count: 1890,
    pdf_url: null,
    content: `# CEE Chemistry: High-Yield Organic Name Reactions & Mechanisms

## 1. Aldol Condensation vs Cannizzaro Reaction
- **Aldol Condensation:**
  - **Prerequisite:** Carbonyl compound with at least one **$\\alpha$-hydrogen** (e.g., $CH_3CHO$, $CH_3COCH_3$).
  - **Reagent:** Dilute alkali ($10\\% \\, \\text{NaOH}$ or $Ba(OH)_2$).
  - **Product:** $\\beta$-hydroxy aldehyde/ketone (aldol/ketol) which dehydrates upon heating to form $\\alpha,\\beta$-unsaturated carbonyls.
- **Cannizzaro Reaction:**
  - **Prerequisite:** Aldehydes having **NO $\\alpha$-hydrogen** (e.g., $HCHO$, $C_6H_5CHO$, $(CH_3)_3CCHO$).
  - **Reagent:** Concentrated alkali ($50\\% \\, \\text{NaOH}$).
  - **Mechanism:** Disproportionation (Redox): one molecule oxidized to carboxylic acid salt, one reduced to alcohol.
    $$2 \\, HCHO + 50\\% \\, \\text{NaOH} \\to HCOONa + CH_3OH$$

---

## 2. Electrophilic Aromatic Substitution Traps
- **Activating Groups (ortho/para directors):** $-OH, -NH_2, -OCH_3, -CH_3$.
- **Deactivating Groups (meta directors):** $-NO_2, -CHO, -COOH, -SO_3H, -CN$.
- **Halogen Anomaly ($-Cl, -Br, -I$):** Deactivating due to $-I$ inductive effect, yet **ortho/para directing** due to $+M$ resonance stabilization of the arenium intermediate!

---

## 3. Quick Distinction Tests
| Test | Positive Result | Distinguishes |
| :--- | :--- | :--- |
| **Iodoform Test ($I_2 / \\text{NaOH}$)** | Yellow crystalline precipitate of $CHI_3$ (m.p. $119^\\circ\\text{C}$) | Compounds with $CH_3-C=O$ or $CH_3-CH(OH)-$ groups |
| **Tollens' Test ($[Ag(NH_3)_2]^+$)** | Bright Silver Mirror ($Ag^0$) | Aldehydes (aliphatic & aromatic) from Ketones |
| **Fehling's Solution** | Red precipitate of $Cu_2O$ | Aliphatic aldehydes (Aromatic aldehydes do NOT reduce Fehling's) |
| **Lucas Reagent ($ZnCl_2 + \\text{conc. } HCl$)** | Cloudiness: $3^\\circ$ immediately, $2^\\circ$ in 5 min, $1^\\circ$ upon heating | Primary, Secondary, and Tertiary Alcohols |`,
    summary_key_points: [
      'Aldol requires alpha-hydrogen; Cannizzaro requires absence of alpha-hydrogen.',
      'Halogens are deactivating but ortho/para directing due to +M resonance.',
      'Benzaldehyde reduces Tollens reagent but does NOT reduce Fehlings solution.',
      'Iodoform test is given by compounds containing CH3-CO- or CH3-CH(OH)-.',
    ],
    formula_sheet_latex: `\\text{Aldol: } 2 \\, CH_3CHO \\xrightarrow{\\text{dil. NaOH}} CH_3-CH(OH)-CH_2CHO \\xrightarrow{\\Delta} CH_3-CH=CH-CHO \\\\\n\\text{Cannizzaro: } 2 \\, C_6H_5CHO \\xrightarrow{50\\% \\text{NaOH}} C_6H_5COONa + C_6H_5CH_2OH \\\\\n\\text{Iodoform: } CH_3COCH_3 + 3I_2 + 4NaOH \\to CHI_3\\downarrow + CH_3COONa + 3NaI + 3H_2O`,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },

  // ── SEE Class 10 Resources ──────────────────────────────────────────────────
  {
    id: 'see-sci-gravity',
    title: 'SEE Class 10 Science: Universal Gravitation, Gravity & Liquid Pressure Guide',
    program: 'see',
    subject: 'Compulsory Science',
    chapter: 'Force & Pressure',
    type: 'notes',
    is_premium: false,
    reading_time_mins: 11,
    download_count: 4210,
    pdf_url: null,
    content: `# SEE Class 10 Compulsory Science: Force & Pressure Master Guide
*Aligned with Curriculum Development Centre (CDC) Examination Grid*

## 1. Newton's Universal Law of Gravitation
Every body in the universe attracts every other body with a mutual force directly proportional to the product of their masses and inversely proportional to the square of the distance between their centers:
$$F = G \\frac{m_1 m_2}{d^2}$$

- **Gravitational Constant ($G$):** $6.67 \\times 10^{-11} \\, \\text{N}\\cdot\\text{m}^2/\\text{kg}^2$.
- $G$ is called a **universal constant** because its value is independent of the nature of bodies, medium between them, and temperature.

---

## 2. Acceleration due to Gravity ($g$)
$$g = \\frac{GM}{R^2}$$

### Factors Affecting $g$ on Earth:
1. **Shape of Earth (Equator vs Poles):**
   Earth is oblate spheroid ($R_{\\text{equator}} > R_{\\text{pole}}$). Since $g \\propto 1/R^2$:
   $$g_{\\text{pole}} \\approx 9.83 \\, \\text{m/s}^2 > g_{\\text{equator}} \\approx 9.78 \\, \\text{m/s}^2$$
2. **Altitude ($h$):** $g' = g\\left(1 - \\frac{2h}{R}\\right)$ — decreases with altitude.
3. **Depth ($d$):** $g' = g\\left(1 - \\frac{d}{R}\\right)$ — decreases linearly, becoming **$0$ at the center of the Earth**.

---

## 3. Liquid Pressure & Pascal's Law
- **Formula:** $P = h \\cdot d \\cdot g$ (where $h$ is depth, $d$ is liquid density, $g$ is gravity).
- **Pascal's Law:** Pressure applied to an enclosed liquid is transmitted equally and perpendicularly in all directions:
  $$\\frac{F_1}{A_1} = \\frac{F_2}{A_2} \\implies F_2 = F_1 \\left(\\frac{A_2}{A_1}\\right)$$
  - Used in: Hydraulic lift, hydraulic brake, hydraulic press.`,
    summary_key_points: [
      'G is universal (6.67 x 10^-11 Nm^2/kg^2); g varies with position and altitude.',
      'Surface gravity is maximum at poles (9.83 m/s^2) and minimum at equator (9.78 m/s^2).',
      'Acceleration due to gravity at the exact center of Earth is zero.',
      'Pascal law hydraulic multiplication: F2 = F1 * (A2 / A1).',
    ],
    formula_sheet_latex: `F = G \\frac{m_1 m_2}{d^2} \\\\\ng = \\frac{GM}{R^2} \\\\\nP = h \\cdot d \\cdot g \\\\\n\\frac{F_1}{A_1} = \\frac{F_2}{A_2} \\\\\nU = V \\cdot d \\cdot g`,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'see-math-theorems',
    title: 'SEE Class 10 Compulsory Mathematics: Geometry Circle Theorems & Mensuration',
    program: 'see',
    subject: 'Compulsory Mathematics',
    chapter: 'Geometry & Mensuration',
    type: 'formula_sheet',
    is_premium: false,
    reading_time_mins: 13,
    download_count: 3840,
    pdf_url: null,
    content: `# SEE Compulsory Mathematics: Circle Theorems & Solid Mensuration

## 1. Core Circle Theorems for SEE 4-Mark & 5-Mark Questions
1. **Central Angle vs Inscribed Angle:**
   The angle subtended by an arc at the center is **double** the angle subtended by the same arc at any point on the remaining circumference:
   $$\\angle AOB = 2 \\times \\angle ACB$$
2. **Angles in the Same Segment:**
   Angles subtended by the same arc on the circumference are equal:
   $$\\angle ACB = \\angle ADB$$
3. **Angle in a Semicircle:**
   An angle inscribed in a semicircle is a right angle ($90^\\circ$).
4. **Cyclic Quadrilateral Theorem:**
   - The opposite angles of a cyclic quadrilateral are supplementary:
     $$\\angle A + \\angle C = 180^\\circ, \\quad \\angle B + \\angle D = 180^\\circ$$
   - An exterior angle of a cyclic quadrilateral is equal to its interior opposite angle.

---

## 2. Solid Mensuration Formulas

### Combined Solid: Hemisphere + Cone
- **Slant Height of Cone ($l$):** $l = \\sqrt{r^2 + h^2}$
- **Total Surface Area ($TSA$):**
  $$TSA = \\text{CSA of Cone} + \\text{CSA of Hemisphere} = \\pi r l + 2\\pi r^2 = \\pi r (l + 2r)$$
- **Total Volume ($V$):**
  $$V = \\frac{1}{3}\\pi r^2 h + \\frac{2}{3}\\pi r^3 = \\frac{1}{3}\\pi r^2 (h + 2r)$$

### Commercial Arithmetic (Compound Interest)
$$A = P\\left(1 + \\frac{R}{100}\\right)^T, \\quad CI = P\\left[\\left(1 + \\frac{R}{100}\\right)^T - 1\\right]$$
- Semi-annual compounding: $A = P\\left(1 + \\frac{R}{200}\\right)^{2T}$`,
    summary_key_points: [
      'Central angle is twice the inscribed angle on the same arc.',
      'Opposite angles of a cyclic quadrilateral sum to 180 degrees.',
      'Combined cone + hemisphere surface area omits the internal circular joint.',
      'Semi-annual compound interest doubles the time exponent and halves the rate.',
    ],
    formula_sheet_latex: `\\angle AOB = 2\\angle ACB \\\\\n\\angle A + \\angle C = 180^\\circ \\\\\nTSA_{\\text{cone+hemi}} = \\pi r (l + 2r) \\\\\nV_{\\text{cone+hemi}} = \\frac{1}{3}\\pi r^2 (h + 2r) \\\\\nCI = P\\left[\\left(1 + \\frac{R}{100}\\right)^T - 1\\right]`,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },

  // ── IELTS Academic & General Resources ──────────────────────────────────────
  {
    id: 'ielts-w2-band9',
    title: 'IELTS Academic Writing Task 2: Band 9 Master Essay Structures & Lexical Resource',
    program: 'ielts',
    subject: 'Academic Writing',
    chapter: 'Task 2 Essay',
    type: 'ielts_pack',
    is_premium: true,
    reading_time_mins: 18,
    download_count: 5120,
    pdf_url: null,
    content: `# IELTS Academic Writing Task 2: Band 9 Blueprint & Templates

## 1. The 4 Official Band Descriptors Explained
1. **Task Achievement (25%):** Fully address all parts of the prompt with a well-developed, sustained position and nuanced supporting ideas.
2. **Coherence & Cohesion (25%):** Clear paragraph progression; topic sentences for each body paragraph; seamless cohesive devices without mechanical overuse.
3. **Lexical Resource (25%):** Sophisticated, natural vocabulary, topic-specific collocations, precision with zero inappropriate academic jargon.
4. **Grammatical Range & Accuracy (25%):** Error-free complex structures, passive forms, cleft sentences, inversion, conditionals.

---

## 2. Band 9 Model Paragraph Structure
### Paragraph 1: Introduction (40-50 words)
- **Sentence 1 (Paraphrase):** Recast prompt topic with synonyms and altered sentence syntax.
- **Sentence 2 (Thesis & Outline):** State unambiguous stance and summarize the two key arguments to follow.

### Paragraphs 2 & 3: Body Paragraphs (90-100 words each)
- **Topic Sentence:** Directly announce the main claim of this paragraph.
- **Explanation:** Elaborate the theoretical justification (2-3 sentences).
- **Concrete Evidence / Exemplification:** Provide a realistic, grounded example.
- **Concluding / Linking Sentence:** Tie back directly to the overarching thesis.

### Paragraph 4: Conclusion (35-45 words)
- Restate thesis in fresh words without introducing any new arguments.

---

## 3. High-Band Academic Vocabulary & Collocations
- *Instead of "A big problem":* A pressing socio-economic dilemma / A profound crisis.
- *Instead of "Make things better":* Ameliorate the adverse ramifications / Foster positive outcomes.
- *Instead of "I think":* It is demonstrably apparent that... / Compelling empirical evidence underscores...
- *Concession connectives:* "While opponents contend that..., this perspective overlooks..."`,
    summary_key_points: [
      'Maintain an unambiguous, sustained stance from the introduction to the conclusion.',
      'Use topic-specific collocations rather than random memorized idioms.',
      'Concession structures demonstrate critical academic nuance required for Band 8.5+.',
      'Never introduce new points in the conclusion paragraph.',
    ],
    formula_sheet_latex: `\\text{Band Score} = \\frac{\\text{TA} + \\text{CC} + \\text{LR} + \\text{GRA}}{4}`,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'ielts-reading-traps',
    title: 'IELTS Academic Reading: True / False / Not Given Elimination & Speed Skimming',
    program: 'ielts',
    subject: 'Academic Reading',
    chapter: 'Question Strategies',
    type: 'notes',
    is_premium: false,
    reading_time_mins: 12,
    download_count: 2790,
    pdf_url: null,
    content: `# IELTS Academic Reading: True / False / Not Given Mastery

## The Definitive Classification Framework
- **TRUE:** The passage contains information that directly matches and confirms the statement in meaning (even if paraphrased).
- **FALSE:** The statement **directly contradicts** information explicitly stated in the passage. You can identify the exact contradictory fact.
- **NOT GIVEN:** The passage neither confirms nor contradicts the statement. The topic might be mentioned, but the specific relationship, comparison, or claim is entirely absent.

---

## The 4 Dangerous Trap Patterns
1. **The Extreme Quantifier Trap:**
   - *Passage:* "Many species of birds migrate annually."
   - *Question:* "**All** bird species migrate annually."
   - *Verdict:* **FALSE** (The word "all" contradicts "many").
2. **The Missing Comparison Trap:**
   - *Passage:* "Solar power is becoming increasingly affordable."
   - *Question:* "Solar power is **cheaper than** wind power."
   - *Verdict:* **NOT GIVEN** (Both may be cheap, but the comparison is never stated).
3. **The Intention vs Fact Trap:**
   - *Passage:* "Researchers aimed to discover a complete cure."
   - *Question:* "Researchers successfully discovered a complete cure."
   - *Verdict:* **FALSE** or **NOT GIVEN** depending on outcome mention.
4. **The Synonym Distortion Trap:**
   - Always trace the exact semantic meaning rather than matching matching identical words. Test creators deliberately place verbatim words in incorrect answer choices.`,
    summary_key_points: [
      'TRUE means 100% agreement with the text meaning.',
      'FALSE requires a verifiable, direct contradiction in the text.',
      'NOT GIVEN means the relationship is unmentioned or unprovable.',
      'Watch out for quantifier shifts: some vs all, frequently vs always.',
    ],
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },

  // ── CEE Zoology: Cardiovascular & Circulation ──────────────────────────────
  {
    id: 'cee-zoo-cardio',
    title: 'CEE Zoology: Cardiac Cycle, ECG Interpretation & Blood Pressure Control',
    program: 'cee',
    subject: 'Zoology',
    chapter: 'Human Physiology',
    type: 'notes',
    is_premium: false,
    reading_time_mins: 15,
    download_count: 3650,
    pdf_url: null,
    content: `# CEE Zoology: Cardiovascular Physiology & ECG Master Capsule

## 1. The Human Cardiac Cycle (0.8 Seconds Total)
Assuming normal resting heart rate of $75 \\text{ beats/min}$, duration of one cycle is:
$$\\text{Duration} = \\frac{60}{75} = 0.8 \\, \\text{seconds}$$

- **Atrial Systole (0.1s):** SA node depolarizes. Atria contract, pushing remaining $30\\%$ of blood into ventricles ($70\\%$ flows passively during joint diastole).
- **Atrial Diastole (0.7s):** Atria relax and refill with venous return.
- **Ventricular Systole (0.3s):**
  - *Isovolumetric Contraction (0.05s):* All valves closed. Intraventricular pressure spikes until it exceeds aortic ($80 \\text{ mmHg}$) and pulmonary pressures ($10 \\text{ mmHg}$).
  - *Rapid & Reduced Ejection (0.25s):* Semilunar valves fling open; $70 \\text{ mL}$ (**Stroke Volume**) ejected.
- **Ventricular Diastole (0.5s):**
  - *Isovolumetric Relaxation (0.04s):* Semilunar valves snap shut, producing the **Second Heart Sound ($S_2$, "DUB")**.
  - *Rapid Filling, Diastasis & Atrial Kick (0.46s):* AV valves open.

---

## 2. Heart Sounds: Clinical Pearls
- **$S_1$ ("LUB"):** Closure of Tricuspid and Bicuspid (Mitral) AV valves at the start of ventricular systole. Low pitch, longer duration ($0.15\\text{s}$).
- **$S_2$ ("DUB"):** Closure of Aortic and Pulmonary semilunar valves at the onset of ventricular diastole. High pitch, sharp, shorter duration ($0.10\\text{s}$).

---

## 3. Electrocardiogram (ECG) Deflections
$$\\text{Standard Lead II Configuration}$$
1. **P Wave:** Atrial depolarization (spread of impulse from SA node through atria).
2. **QRS Complex ($<0.10\\text{s}$):** Ventricular depolarization (disguises atrial repolarization).
3. **T Wave:** Ventricular repolarization.
4. **P-R Interval ($0.12 - 0.20\\text{s}$):** Conduction time through AV node. Prolongation indicates **First-Degree Heart Block**.
5. **ST Segment Elevation:** Pathognomonic indicator of acute **Myocardial Infarction (Heart Attack)**.`,
    summary_key_points: [
      'Normal cardiac cycle duration is 0.8s: Atrial systole 0.1s, Ventricular systole 0.3s.',
      'S1 (LUB) is closure of AV valves; S2 (DUB) is closure of semilunar valves.',
      'QRS complex represents ventricular depolarization; T wave represents repolarization.',
      'Prolonged P-R interval (>0.20s) signifies atrioventricular conduction delay (heart block).',
    ],
    formula_sheet_latex: `\\text{Cardiac Output } (CO) = \\text{Heart Rate } (HR) \\times \\text{Stroke Volume } (SV) = 72 \\times 70\\text{ mL} \\approx 5.04\\text{ L/min} \\\\\n\\text{Pulse Pressure } = \\text{Systolic BP } (120) - \\text{Diastolic BP } (80) = 40\\text{ mmHg} \\\\\n\\text{Mean Arterial Pressure } (MAP) = \\text{Diastolic BP} + \\frac{1}{3}(\\text{Pulse Pressure}) \\approx 93.3\\text{ mmHg}`,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },

  // ── SEE Optional Mathematics ────────────────────────────────────────────────
  {
    id: 'see-opt-coord',
    title: 'SEE Class 10 Optional Mathematics: Pair of Straight Lines & Trigonometric Equations',
    program: 'see',
    subject: 'Optional Mathematics',
    chapter: 'Coordinate Geometry & Trigonometry',
    type: 'formula_sheet',
    is_premium: false,
    reading_time_mins: 14,
    download_count: 2950,
    pdf_url: null,
    content: `# SEE Optional Mathematics: Pair of Straight Lines & Trigonometry

## 1. Homogeneous Equation of Second Degree
$$ax^2 + 2hxy + by^2 = 0$$
Represents a pair of straight lines passing through the origin $(0, 0)$.

### Critical Conditions:
1. **Angle between the two lines ($\\theta$):**
   $$\\tan\\theta = \\pm \\frac{2\\sqrt{h^2 - ab}}{a + b}$$
2. **Lines are Perpendicular ($90^\\circ$):**
   $$a + b = 0 \\implies \\text{Coefficient of } x^2 + \\text{Coefficient of } y^2 = 0$$
3. **Lines are Coincident / Parallel ($0^\\circ$):**
   $$h^2 - ab = 0 \\implies h^2 = ab$$
4. **Real and distinct lines:** $h^2 - ab > 0$.
5. **Imaginary lines:** $h^2 - ab < 0$.

---

## 2. General Second-Degree Equation
$$ax^2 + 2hxy + by^2 + 2gx + 2fy + c = 0$$
Represents a pair of straight lines if and only if:
$$\\Delta = abc + 2fgh - af^2 - bg^2 - ch^2 = 0$$
Or in determinant form:
$$\\begin{vmatrix} a & h & g \\\\ h & b & f \\\\ g & f & c \\end{vmatrix} = 0$$`,
    summary_key_points: [
      'Two lines through origin are perpendicular if a + b = 0.',
      'Two lines through origin are coincident if h^2 = ab.',
      'Angle between pair of lines: tan(theta) = +- 2*sqrt(h^2 - ab) / (a + b).',
      'General equation condition for lines: abc + 2fgh - af^2 - bg^2 - ch^2 = 0.',
    ],
    formula_sheet_latex: `\\tan\\theta = \\pm \\frac{2\\sqrt{h^2 - ab}}{a + b} \\\\\n\\text{Perpendicular: } a + b = 0 \\\\\n\\text{Coincident: } h^2 = ab \\\\\n\\Delta = abc + 2fgh - af^2 - bg^2 - ch^2 = 0`,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },

  // ── NEB Class 12 Physics ────────────────────────────────────────────────────
  {
    id: 'neb-phys-wave',
    title: 'NEB Grade 12 Physics: Wave Optics, Young’s Double Slit & Diffraction Grating',
    program: 'neb',
    subject: 'Physics',
    chapter: 'Wave Optics',
    type: 'notes',
    is_premium: false,
    reading_time_mins: 16,
    download_count: 2200,
    pdf_url: null,
    content: `# NEB Grade 12 Physics: Wave Optics & Interference Derivations

## 1. Young's Double Slit Experiment (YDSE)
Two coherent sources $S_1$ and $S_2$ separated by distance $d$, with a screen at distance $D$ ($D \\gg d$).
- **Path Difference ($\\Delta x$):**
  $$\\Delta x = S_2 P - S_1 P = \\frac{yd}{D}$$

### Fringe Conditions:
- **Constructive Interference (Bright Fringes):**
  $$\\Delta x = n\\lambda \\implies y_n = \\frac{n\\lambda D}{d}, \\quad (n = 0, 1, 2, \\dots)$$
- **Destructive Interference (Dark Fringes):**
  $$\\Delta x = (2n - 1)\\frac{\\lambda}{2} \\implies y_n' = (2n - 1)\\frac{\\lambda D}{2d}, \\quad (n = 1, 2, \\dots)$$
- **Fringe Width ($\\beta$):** Distance between consecutive bright or dark fringes:
  $$\\beta = \\frac{\\lambda D}{d}$$
  - $\\beta$ is independent of the order of the fringe ($n$). All fringes in YDSE are of **equal width**.

---

## 2. Diffraction at a Single Slit (Fraunhofer)
- **Minima condition:** $a \\sin\\theta = n\\lambda \\quad (n = \\pm 1, \\pm 2, \\dots)$
- **Angular width of Central Maximum:**
  $$2\\theta_0 = \\frac{2\\lambda}{a}$$
- **Linear width on screen:** $\\beta_0 = \\frac{2\\lambda D}{a} = 2\\beta$ (Central maximum is twice as wide as secondary maxima).`,
    summary_key_points: [
      'In YDSE, fringe width beta = lambda * D / d; all interference fringes have identical width.',
      'Central bright fringe corresponds to zero path difference (n=0).',
      'In single-slit diffraction, central maximum width is twice the secondary maxima width.',
      'Diffraction grating formula: (a+b) sin(theta) = n * lambda.',
    ],
    formula_sheet_latex: `\\beta = \\frac{\\lambda D}{d} \\\\\ny_n = \\frac{n\\lambda D}{d} \\\\\n2\\theta_0 = \\frac{2\\lambda}{a} \\\\\n(a+b)\\sin\\theta = n\\lambda`,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },

  // ── IOE Engineering Entrance ────────────────────────────────────────────────
  {
    id: 'ioe-math-calculus',
    title: 'IOE Pulchowk CBT: High-Yield Calculus & Definite Integrals Short-Cut Tricks',
    program: 'cee',
    subject: 'Engineering Mathematics',
    chapter: 'Integral Calculus',
    type: 'formula_sheet',
    is_premium: true,
    reading_time_mins: 15,
    download_count: 4890,
    pdf_url: null,
    content: `# IOE Engineering Mathematics: Definite Integrals & Pulchowk Speed Tricks

## 1. King's Property of Definite Integrals
$$\\int_a^b f(x) \\, dx = \\int_a^b f(a + b - x) \\, dx$$
- If $f(x) + f(a + b - x) = C$ (constant), then:
  $$\\int_a^b f(x) \\, dx = \\frac{b - a}{2} \\times C$$

### Classical IOE Pulchowk CBT Trap:
$$\\int_0^{\\pi/2} \\frac{\\sin^n x}{\\sin^n x + \\cos^n x} \\, dx = \\frac{\\pi/2 - 0}{2} = \\frac{\\pi}{4}$$
Works for **any real power $n$** (e.g., $n = 1, 2, 1/2, 2026$).

---

## 2. Wallis' Formula for Fast Evaluation
For $\\int_0^{\\pi/2} \\sin^m x \\cos^n x \\, dx$:
$$\\int_0^{\\pi/2} \\sin^n x \\, dx = \\begin{cases}
\\frac{n-1}{n} \\cdot \\frac{n-3}{n-2} \\dots \\frac{1}{2} \\cdot \\frac{\\pi}{2} & \\text{if } n \\text{ is even} \\\\
\\frac{n-1}{n} \\cdot \\frac{n-3}{n-2} \\dots \\frac{2}{3} \\cdot 1 & \\text{if } n \\text{ is odd}
\\end{cases}$$

---

## 3. Area Enclosed by Conics
- **Parabola $y^2 = 4ax$ and line $y = mx$:**
  $$\\text{Area} = \\frac{8a^2}{3m^3}$$
- **Between two parabolas $y^2 = 4ax$ and $x^2 = 4by$:**
  $$\\text{Area} = \\frac{16ab}{3}$$`,
    summary_key_points: [
      'Kings property enables solving symmetrical trigonometric integrals in under 10 seconds.',
      'Symmetric fraction integral from 0 to pi/2 evaluates directly to pi/4.',
      'Wallis formula evaluates powers of sine and cosine without integration by parts.',
      'Area between y^2 = 4ax and x^2 = 4by is strictly 16ab / 3.',
    ],
    formula_sheet_latex: `\\int_a^b f(x)dx = \\int_a^b f(a+b-x)dx \\\\\n\\int_0^{\\pi/2} \\frac{\\sin^n x}{\\sin^n x + \\cos^n x}dx = \\frac{\\pi}{4} \\\\\n\\text{Area}(y^2=4ax, x^2=4by) = \\frac{16ab}{3}`,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },

  // ── IELTS Speaking ──────────────────────────────────────────────────────────
  {
    id: 'ielts-speak-cue',
    title: 'IELTS Speaking Band 8.5+: Fluency Connectors, Cue Card P.P.F. Formula & Pronunciation',
    program: 'ielts',
    subject: 'Speaking Test',
    chapter: 'Part 2 & Part 3 Strategy',
    type: 'ielts_pack',
    is_premium: false,
    reading_time_mins: 14,
    download_count: 3410,
    pdf_url: null,
    content: `# IELTS Speaking Mastery: Band 8.5+ Frameworks

## 1. The P.P.F. Strategy for Part 2 Cue Cards (2 Minutes Unbroken)
When given 1 minute to plan, never write sentences. Sketch 3 bullet points using the **Past-Present-Future (P.P.F.) Matrix**:
- **Past (30-40s):** How the situation began, early background, childhood recollection, initial impressions.
- **Present (45-55s):** Current significance, what you actually do now, who is involved, emotional resonance.
- **Future (20-30s):** How you intend to continue this habit, anticipated evolution, philosophical reflection.

---

## 2. Discourse Markers to Eliminate Hesitation Fillers
*Avoid "uh", "um", "like", "you know". Replace with high-band fillers:*
- "To be completely candid with you..."
- "Looking at it from a broader sociological perspective..."
- "It never crossed my mind until now, but I would venture to say..."
- "There is no definitive consensus, but on balance..."

---

## 3. Band 9 Idiomatic Phrasal Collocations
- *Instead of "I was very happy":* "I was on cloud nine / absolutely thrilled to bits."
- *Instead of "It happens rarely":* "It happens once in a blue moon."
- *Instead of "A hard task":* "An uphill struggle, yet immensely gratifying."
- *Instead of "Expensive":* "Cost an arm and a leg."`,
    summary_key_points: [
      'Use the Past-Present-Future (P.P.F.) timeline to smoothly speak for the full 2 minutes.',
      'Replace vocal pauses with natural discourse markers to elevate Fluency & Coherence.',
      'Use idiomatic expressions naturally in context without forcing rare idioms.',
      'Vary pitch, intonation and thought grouping to score Band 8+ in Pronunciation.',
    ],
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const program = searchParams.get('program') || 'all';
    const type = searchParams.get('type') || 'all';
    const search = searchParams.get('search')?.toLowerCase().trim() || '';

    // Fetch dynamic notes from Supabase database if available
    let dynamicNotes: AcademicResource[] = [];
    try {
      const supabase = await createClient();
      const { data: dbNotes } = await supabase
        .from('notes')
        .select('id, title, content, content_markdown, summary_key_points, formula_sheet_latex, pdf_url, is_premium, is_active, created_at, subjects(display_name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (dbNotes && dbNotes.length > 0) {
        dynamicNotes = dbNotes.map((n: any) => {
          const rawContent = n.content || n.content_markdown || '';
          const titleLower = (n.title || '').toLowerCase();
          
          let prog: 'cee' | 'see' | 'ielts' | 'neb' = 'cee';
          if (titleLower.includes('see') || titleLower.includes('class 10')) prog = 'see';
          else if (titleLower.includes('ielts') || titleLower.includes('band')) prog = 'ielts';
          else if (titleLower.includes('neb') || titleLower.includes('grade 11') || titleLower.includes('grade 12')) prog = 'neb';

          return {
            id: n.id,
            title: n.title,
            program: prog,
            subject: n.subjects?.display_name || 'General Curriculum',
            chapter: n.title,
            type: (titleLower.includes('formula') ? 'formula_sheet' : titleLower.includes('model') ? 'model_question' : 'notes') as any,
            is_premium: n.is_premium ?? false,
            reading_time_mins: Math.max(5, Math.ceil(rawContent.length / 500)),
            download_count: Math.floor(Math.random() * 500) + 120,
            pdf_url: n.pdf_url,
            content: rawContent,
            summary_key_points: n.summary_key_points || ['Aligned with official exam syllabus', 'Includes key exam pointers'],
            formula_sheet_latex: n.formula_sheet_latex || undefined,
            created_at: n.created_at,
          };
        });
      }
    } catch {}

    // Combine canonical curated resources and dynamic notes
    const combined = [...CANONICAL_ACADEMIC_RESOURCES, ...dynamicNotes];

    // Filter by program
    const filtered = combined.filter((r) => {
      const matchesProgram = program === 'all' || r.program === program;
      const matchesType = type === 'all' || r.type === type;
      const matchesSearch =
        !search ||
        r.title.toLowerCase().includes(search) ||
        r.subject.toLowerCase().includes(search) ||
        r.chapter.toLowerCase().includes(search);

      return matchesProgram && matchesType && matchesSearch;
    });

    return NextResponse.json({
      success: true,
      total: filtered.length,
      resources: filtered,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}
