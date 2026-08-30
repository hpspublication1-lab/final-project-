export interface SeeDigestItem {
  id: string;
  title: string;
  titleNepali: string;
  subject: 'science' | 'math' | 'opt_math' | 'english' | 'nepali' | 'social';
  subjectName: string;
  category: 'Formula Sheet' | 'Revision Capsule' | 'Model Set & Solution' | 'Summary Notes';
  fileSize: string;
  pageCount: number;
  downloadCount: string;
  downloadUrl: string;
  description: string;
  isPopular?: boolean;
  uploadDate: string;
  tags: string[];
}

export const SEE_DIGEST_LIST: SeeDigestItem[] = [
  {
    id: 'digest-sci-01',
    title: 'Compulsory Science Master Formula & Reaction Digest 2082',
    titleNepali: 'कक्षा १० विज्ञान: सम्पूर्ण सूत्र, समीकरण र नियमहरूको विशेष डाइजेस्ट',
    subject: 'science',
    subjectName: 'Compulsory Science & Tech',
    category: 'Formula Sheet',
    fileSize: '3.4 MB',
    pageCount: 18,
    downloadCount: '24.8k',
    downloadUrl: '/documents/see_science_formula_capsule.pdf',
    description: 'Comprehensive compilation of all physics formulas (Mechanics, Optics, Electricity), chemistry gas preparation reactions, and biology cell diagrams.',
    isPopular: true,
    uploadDate: '2026-08-25',
    tags: ['Physics Formulas', 'Chemical Equations', 'NEB Top 50 Diagrams'],
  },
  {
    id: 'digest-math-01',
    title: 'Compulsory Math Theorem Proofs & Mensuration Master Capsule',
    titleNepali: 'अनिवार्य गणित: साध्य प्रमाणित, क्षेत्रमिति र अंकगणित फर्मुला बूक',
    subject: 'math',
    subjectName: 'Compulsory Mathematics',
    category: 'Formula Sheet',
    fileSize: '4.1 MB',
    pageCount: 24,
    downloadCount: '31.2k',
    downloadUrl: '/documents/see_compulsory_math_theorems.pdf',
    description: 'All 7 compulsory geometry theoretical proofs with statement-reason tables, mensuration 3D formulas (cylinder, sphere, cone, pyramid), and compound interest formulas.',
    isPopular: true,
    uploadDate: '2026-08-26',
    tags: ['Geometry Proofs', 'Mensuration 3D', 'Compound Interest'],
  },
  {
    id: 'digest-opt-01',
    title: 'Optional Math Trigonometry, Matrix & Vector Quick Reference',
    titleNepali: 'ऐच्छिक गणित: त्रिकोणमिति, म्याट्रिक्स र भेक्टर फर्मुला डाइजेस्ट',
    subject: 'opt_math',
    subjectName: 'Optional Mathematics',
    category: 'Formula Sheet',
    fileSize: '2.8 MB',
    pageCount: 16,
    downloadCount: '19.4k',
    downloadUrl: '/documents/see_opt_math_trigonometry.pdf',
    description: 'All compound and multiple-angle trigonometric transformations, Cramer\'s rule matrix inversion formulas, coordinate geometry straight line formulas, and vector products.',
    isPopular: true,
    uploadDate: '2026-08-27',
    tags: ['Trig Formulas', 'Cramer Rule', 'Coordinate Geometry'],
  },
  {
    id: 'digest-eng-01',
    title: 'SEE English Ready-Made Formats & Free Writing Templates',
    titleNepali: 'अंग्रेजी: ब्याकरण, औपचारिक पत्र, कथा र निबन्ध लेखन ढाँचा',
    subject: 'english',
    subjectName: 'English Language',
    category: 'Revision Capsule',
    fileSize: '2.2 MB',
    pageCount: 14,
    downloadCount: '18.1k',
    downloadUrl: '/documents/see_english_writing_templates.pdf',
    description: 'Guaranteed scoring templates for formal applications, emails, book/movie reviews, newspaper reports, dialogue writing, and grammar error checklists.',
    isPopular: false,
    uploadDate: '2026-08-28',
    tags: ['Formal Letter', 'Grammar Cheat Sheet', 'Report Writing'],
  },
  {
    id: 'digest-nep-01',
    title: 'नेपाली व्याकरण तथा अभिव्यक्ति संकलन (कक्षा १० डाइजेस्ट)',
    titleNepali: 'नेपाली व्याकरण (पदवर्ग, कारक, समास) र विवेचनात्मक उत्तर संकलन',
    subject: 'nepali',
    subjectName: 'Nepali (नेपाली)',
    category: 'Revision Capsule',
    fileSize: '2.5 MB',
    pageCount: 15,
    downloadCount: '16.5k',
    downloadUrl: '/documents/see_nepali_grammar_capsule.pdf',
    description: 'पदवर्ग, नामयोगी, उपसर्ग/प्रत्यय, समास र विग्रह, काल र पक्ष, वाच्य परिवर्तन, र ४ अंकका विवेचनात्मक उत्तर लेख्ने विधि।',
    isPopular: false,
    uploadDate: '2026-08-28',
    tags: ['पदवर्ग', 'समास र विग्रह', 'विवेचनात्मक उत्तर'],
  },
  {
    id: 'digest-soc-01',
    title: 'Social Studies 10-Year High-Yield Maps & Civic Notes',
    titleNepali: 'सामाजिक अध्ययन: नेपालको नक्सा, संविधान र समसामयिक डाइजेस्ट',
    subject: 'social',
    subjectName: 'Social Studies & Life Skills',
    category: 'Summary Notes',
    fileSize: '3.0 MB',
    pageCount: 20,
    downloadCount: '21.0k',
    downloadUrl: '/documents/see_social_map_and_constitution.pdf',
    description: 'Step-by-step Nepal map drawing grid guidelines, symbols for physical/economic resources, constitutional organs summary, and model long questions.',
    isPopular: true,
    uploadDate: '2026-08-29',
    tags: ['Nepal Map Drawing', 'Constitution Points', 'Long Questions'],
  },
];
