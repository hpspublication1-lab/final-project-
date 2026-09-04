import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';
export const revalidate = 86400; // 24 hours

export default function sitemap(): MetadataRoute.Sitemap {
  // Always canonicalize to production domain https://samyakcee.com
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://samyakcee.com';
  const baseUrl = siteUrl.replace(/\/+$/, '');
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    // 1. Core Landing & Main Programs
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/cee-medical-entrance`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.98,
    },
    {
      url: `${baseUrl}/see-class-10`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.98,
    },
    {
      url: `${baseUrl}/ielts-preparation`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.98,
    },
    {
      url: `${baseUrl}/digital-marketing`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.98,
    },
    {
      url: `${baseUrl}/ai-python-course`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.98,
    },
    {
      url: `${baseUrl}/see`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/prebook`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/batches`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },

    // 2. SEE Class 10 Board Master System
    {
      url: `${baseUrl}/see/question-bank`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/see/checkout`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/batches/see-science-technology`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/batches/see-compulsory-math`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/batches/see-opt-math`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/batches/see-english`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },

    // 3. Learning, Practice & Test Engines
    {
      url: `${baseUrl}/subjects`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/lecture-videos`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/practice`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/mock-tests`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/battle-arena`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/study-plan`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/mistake-analyser`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/mcq-generator`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/ai-tutor`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },

    // 4. IELTS & English Mastery System
    {
      url: `${baseUrl}/english`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/english/syllabus`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/english/speaking`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/english/listening`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/english/cambridge`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/english/duolingo`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/english/it-english`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/english/vocabulary`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/english/band-predictor`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // 5. Digital & AI Systems
    {
      url: `${baseUrl}/digital`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },

    // 6. Public Info & Legal
    {
      url: `${baseUrl}/app-feature`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/refund`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact-us`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/free-cee-biology-mcqs`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // 7. SEO Blog Articles & Guides (50+ High-Yield Articles)
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/blog/cee-2026-syllabus-complete-chapter-wise-breakdown`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/top-50-high-yield-biology-mcqs-cee-nepal`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/organic-chemistry-name-reactions-cheat-sheet-cee`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/physics-numerical-shortcuts-formulas-cee-nepal`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/mat-mental-agility-test-scoring-guide-cee`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/iom-maharajgunj-scholarship-cutoff-analysis-trends`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/negative-marking-management-elimination-tricks-cee`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/mbbs-vs-bds-vs-bsc-nursing-bpharm-nepal-career-guide`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/human-physiology-nervous-system-high-yield-cee`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/plant-physiology-photosynthesis-c3-c4-cam-pathways`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/physical-chemistry-ionic-equilibrium-ph-buffers-cee`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/genetics-dna-replication-transcription-translation-cee`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/inorganic-chemistry-periodic-table-coordination-compounds`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/optics-ray-wave-optics-must-know-derivations-cee`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/last-30-days-revision-plan-cee-medical-nepal`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/medical-colleges-seat-matrix-fees-scholarships-nepal`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/zoology-animal-tissues-epithelial-connective-cee`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/thermodynamics-carnot-engine-entropy-cee-physics`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/see-class-10-neb-science-important-derivations`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/see-class-10-compulsory-math-geometry-theorems-proofs`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/how-to-score-gpa-4-in-see-2082-expert-guide`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/see-class-10-opt-math-trigonometry-proofs-identities`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/see-nepali-vyakaran-shabda-barga-pad-sangati-rules`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/see-social-studies-nepal-map-drawing-tricks`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/see-english-free-writing-essay-letter-rules`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/see-compulsory-math-arithmetic-compound-interest-depreciation`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/see-science-chemistry-laboratory-gas-preparations`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/see-science-biology-heredity-mendel-laws-punnett-squares`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/see-opt-math-vector-geometry-linear-transformations`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/see-compulsory-math-mensuration-cylinder-sphere-cone-formulas`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/see-science-physics-electricity-power-domestic-wiring`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/see-social-studies-constitution-nepal-federalism-institutions`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/see-class-10-model-question-sets-cdc-specification-grid-2082`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/10-common-mistakes-students-make-in-see-board-exams`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/see-science-astronomy-geology-plate-tectonics-minerals`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/see-nepali-nibandha-rachana-essay-writing-frameworks`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/ielts-speaking-band-8-tips-nepali-students`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/ielts-writing-task-1-academic-charts-maps-processes`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/ielts-writing-task-2-band-9-essay-templates-frameworks`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/ielts-reading-true-false-not-given-skimming-scanning`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/ielts-listening-section-1-4-map-labeling-multiple-choice`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/top-100-academic-word-list-vocabulary-ielts-band-8`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/computer-delivered-vs-paper-based-ielts-nepal-comparison`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/ielts-speaking-part-2-cue-cards-latest-topics-2026`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/ielts-band-predictor-score-calculator-raw-marks`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/ielts-general-training-writing-task-1-letter-guide`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/how-to-run-high-converting-facebook-meta-ads-nepal`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/prompt-engineering-python-google-gemini-beginners-guide`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/freelancing-roadmap-nepal-upwork-fiverr-remote-it-jobs`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/seo-fundamentals-for-nepali-websites-rank-google-nepal`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/pomodoro-active-recall-spaced-repetition-exam-success`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/overcoming-exam-anxiety-panic-attacks-mock-test-strategies`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/how-to-maintain-12-hour-study-routine-without-burnout`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/cornell-method-vs-mind-mapping-note-taking-science`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  return routes;
}