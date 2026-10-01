/**
 * Schema.org Structured Data (JSON-LD) Generators for Samyak Guru
 * Compliant with Google Rich Results & Schema.org standards
 */

const BASE_URL = 'https://samyakcee.com';

/**
 * 1. Master Organization Schema (EducationalOrganization)
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${BASE_URL}/#organization`,
    name: 'Samyak Guru',
    alternateName: ['Samyak CEE Mastery', 'Samyak SEE Class 10', 'Samyak IELTS'],
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/assets/images/app_logo.png`,
      caption: 'Samyak Guru AI Education Platform',
    },
    image: `${BASE_URL}/og-image.png`,
    description:
      "Nepal's premier AI-powered multi-course education platform for SEE Class 10, CEE Medical Entrance, IELTS Band 8.5+ Mastery, Digital Marketing, and AI Tutoring.",
    telephone: '+977-9709066151',
    email: 'support@samyakcee.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Old Baneshwor',
      addressLocality: 'Kathmandu',
      addressRegion: 'Bagmati Province',
      postalCode: '44600',
      addressCountry: 'NP',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 27.7017,
      longitude: 85.3428,
    },
    hasMap: 'https://maps.google.com/?q=Old+Baneshwor,+Kathmandu,+Nepal',
    priceRange: 'NPR 300 - NPR 7990',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '08:00',
        closes: '20:00',
      },
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+977-9709066151',
        contactType: 'customer support',
        areaServed: 'NP',
        availableLanguage: ['English', 'Nepali'],
        contactOption: 'TollFree',
      },
      {
        '@type': 'ContactPoint',
        telephone: '+977-9709066151',
        contactType: 'student admissions & counseling',
        areaServed: 'NP',
        availableLanguage: ['English', 'Nepali'],
      },
    ],
    sameAs: [
      'https://www.facebook.com/samyakguru',
      'https://www.instagram.com/samyakguru',
      'https://www.youtube.com/@samyakguru',
      'https://tiktok.com/@samyakguru',
    ],
  };
}

/**
 * 2. WebSite Schema with SearchAction
 */
export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    name: 'Samyak Guru — AI Education Platform',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/see/question-bank?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * 3. Courses Schema (SEE, CEE, IELTS, Digital Marketing, AI)
 */
export function getFeaturedCoursesSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          '@type': 'Course',
          '@id': `${BASE_URL}/see#course`,
          name: 'SEE Class 10 Board Exam Master Course 2082',
          description:
            'Comprehensive SEE Class 10 preparation covering Compulsory Science, Compulsory Math, Optional Math, English, Nepali, and Social Studies with 10,000+ model questions, video lectures, and AI subjective answer evaluations.',
          provider: {
            '@type': 'EducationalOrganization',
            name: 'Samyak Guru',
            url: BASE_URL,
          },
          educationalCredentialAwarded: 'SEE Grade A+ Completion Certificate',
          inLanguage: ['ne', 'en'],
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'online',
            courseWorkload: 'PT150H',
          },
          offers: {
            '@type': 'Offer',
            price: '4990',
            priceCurrency: 'NPR',
            availability: 'https://schema.org/InStock',
            url: `${BASE_URL}/checkout?plan=see-class-10-board-topper-batch`,
            validFrom: '2026-01-01',
          },
        },
      },
      {
        '@type': 'ListItem',
        position: 2,
        item: {
          '@type': 'Course',
          '@id': `${BASE_URL}/courses?sector=cee#course`,
          name: 'CEE Medical Entrance Complete Mastery Batch',
          description:
            'MEC CEE Medical entrance preparation with 15,000+ topic-wise MCQs, high-yield physics/chemistry/zoology/botany/MAT video lectures, and weekly full-length computer-based mock exams.',
          provider: {
            '@type': 'EducationalOrganization',
            name: 'Samyak Guru',
            url: BASE_URL,
          },
          educationalCredentialAwarded: 'CEE Rank Booster Certificate',
          inLanguage: 'en',
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'online',
            courseWorkload: 'PT300H',
          },
          offers: {
            '@type': 'Offer',
            price: '7990',
            priceCurrency: 'NPR',
            availability: 'https://schema.org/InStock',
            url: `${BASE_URL}/checkout?plan=cee-mbbs-mastery-2026`,
            validFrom: '2026-01-01',
          },
        },
      },
      {
        '@type': 'ListItem',
        position: 3,
        item: {
          '@type': 'Course',
          '@id': `${BASE_URL}/english#course`,
          name: 'IELTS Band 8.5+ Spoken & Academic Mastery',
          description:
            'Interactive IELTS preparation featuring a real-time 3-part AI Speaking simulator, Task 1 & 2 writing rubric grader, and full Cambridge-style listening audio drills.',
          provider: {
            '@type': 'EducationalOrganization',
            name: 'Samyak Guru',
            url: BASE_URL,
          },
          educationalCredentialAwarded: 'IELTS Band 8.5 Preparation Diploma',
          inLanguage: 'en',
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'online',
            courseWorkload: 'PT80H',
          },
          offers: {
            '@type': 'Offer',
            price: '3490',
            priceCurrency: 'NPR',
            availability: 'https://schema.org/InStock',
            url: `${BASE_URL}/checkout?plan=english-ielts-target-8-mastery`,
            validFrom: '2026-01-01',
          },
        },
      },
    ],
  };
}

/**
 * 4. Product & Offer Schema for Course Packages
 */
export function getProductPricingSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Samyak Guru All-Access Learning Pass',
    image: `${BASE_URL}/og-image.png`,
    description:
      'All-in-one access to SEE Class 10, CEE Medical Entrance, IELTS Masterclass, 24/7 AI Doubt Solver, and Mock Exams.',
    brand: {
      '@type': 'Brand',
      name: 'Samyak Guru',
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'SEE Board Topper Batch (Full Year)',
        price: '4990',
        priceCurrency: 'NPR',
        priceValidUntil: '2027-12-31',
        itemCondition: 'https://schema.org/NewCondition',
        availability: 'https://schema.org/InStock',
        url: `${BASE_URL}/checkout?plan=see-class-10-board-topper-batch`,
      },
      {
        '@type': 'Offer',
        name: 'CEE Crash Course Prebooking Reservation Deposit',
        price: '300',
        priceCurrency: 'NPR',
        priceValidUntil: '2027-12-31',
        itemCondition: 'https://schema.org/NewCondition',
        availability: 'https://schema.org/InStock',
        url: `${BASE_URL}/prebook`,
      },
      {
        '@type': 'Offer',
        name: 'CEE 45-Day Intensive Crash Course',
        price: '2299',
        priceCurrency: 'NPR',
        priceValidUntil: '2027-12-31',
        itemCondition: 'https://schema.org/NewCondition',
        availability: 'https://schema.org/InStock',
        url: `${BASE_URL}/checkout?plan=cee-45-day-crash-course`,
      },
      {
        '@type': 'Offer',
        name: 'CEE Medical Entrance Target Batch (180 Days)',
        price: '7990',
        priceCurrency: 'NPR',
        priceValidUntil: '2027-12-31',
        itemCondition: 'https://schema.org/NewCondition',
        availability: 'https://schema.org/InStock',
        url: `${BASE_URL}/checkout?plan=cee-mbbs-mastery-2026`,
      },
    ],
  };
}

/**
 * 5. Testimonials & Student Reviews Schema
 */
export function getTestimonialsReviewsSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Samyak Guru Education Platform',
    review: [
      {
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: 'Prashant Adhikari',
        },
        datePublished: '2026-07-15',
        reviewBody:
          'Samyak CEE was the game changer for my medical entrance preparation. The 15,000+ MCQs with instant step-by-step explanations helped me secure a scholarship seat!',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
          bestRating: '5',
        },
      },
      {
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: 'Sneha Shrestha',
        },
        datePublished: '2026-08-02',
        reviewBody:
          'The SEE Class 10 AI subjective checker graded my science and math answers just like the NEB board examiner. Scoring a 3.95 GPA was possible because of Samyak Guru.',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
          bestRating: '5',
        },
      },
      {
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: 'Bibek Karki',
        },
        datePublished: '2026-08-20',
        reviewBody:
          'The IELTS Speaking Simulator analyzed my pronunciation, vocabulary, and pauses in real-time. I jumped from Band 6.5 to Band 8.0 in just 3 weeks.',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
          bestRating: '5',
        },
      },
    ],
  };
}

/**
 * 6. Homepage FAQPage Schema
 */
export function getHomepageFAQSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What courses are offered on the Samyak Guru platform?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Samyak Guru offers five comprehensive learning programs: SEE Class 10 Board Preparation, CEE Medical Entrance Preparation, IELTS Academic & General English Mastery, Digital Marketing & Content Strategy, and Generative AI & Automation Engineering.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does the 24/7 AI Doubt Solver work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our AI Doubt Solver is trained on the exact CDC Nepal curricula and MEC medical entrance standards. You can type questions, upload photo snapshots of problems, or speak via voice to receive instant, step-by-step verified explanations at any hour of the day.',
        },
      },
      {
        '@type': 'Question',
        name: 'What payment methods are supported in Nepal?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We accept Fonepay Dynamic QR (compatible with 50+ Nepal mobile banking apps) with instant automated course activation, as well as direct bank transfers with manual payment verification.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the refund policy?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We provide a 7-day 100% money-back guarantee for full course enrollments if less than 10% of the video content has been watched and no more than two practice exams have been attempted.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I access study materials on my smartphone?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! The entire Samyak Guru platform is fully responsive and supports offline test caching. You can also install our Progressive Web App (PWA) on your Android or iPhone device.',
        },
      },
    ],
  };
}

/**
 * 7. Dedicated SEE FAQ Schema
 */
export function getSeeFAQSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is this course based on the new CDC Class 10 SEE specification grid?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, 100%. All questions, 4-way structures (Knowledge, Understanding, Application, Higher Ability), mark distributions, and solutions strictly follow the latest Nepal Curriculum Development Centre (CDC) specification grid for 2081/2082.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does the AI Subjective Paper Marker grade my answers?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can upload photos of your handwritten answers or type them in. Our AI analyzes your steps against official NEB marking rubrics, deducts points for missing steps, and provides actionable constructive feedback to maximize your marks.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I access the SEE Question Bank?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can access over 10,000+ chapter-wise and marks-wise questions for Science, Math, Opt Math, English, Nepali, and Social Studies directly from the SEE Question Bank portal.',
        },
      },
    ],
  };
}

/**
 * 8. Comprehensive 20-Question Platform FAQPage Schema
 */
export function getFullFAQSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is Samyak CEE & SEE content aligned with the latest CEE 2026 & NEB CDC syllabus?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, 100%. Every sub-chapter note, formula sheet, derivation, and MCQ is mapped to the updated Medical Education Commission (MEC) CEE syllabus and Curriculum Development Centre (CDC) Class 10 specification grid.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I access notes, mock tests, and lectures offline?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Pro and Premium enrolled students can download official PDF study guides and sub-chapter formula notes for offline reading. In addition, the Samyak Guru mobile app supports offline practice test caching.',
        },
      },
      {
        '@type': 'Question',
        name: 'What happens after my 1-year course subscription expires?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'When your 1-year access period concludes, your account remains active with your historical test attempts, bookmarks, and badges saved. You will have the option to renew at an exclusive 50% returning-student discount or transition to free community mock exams.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does the AI handwritten answer checker (AI Evaluator) work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You take a photo of your handwritten paper (for SEE Science, Opt Math, or IELTS essays) and upload it to the Vision Marker. The OCR neural engine transcribes your handwriting, evaluates each step against the official NEB/Cambridge marking rubrics, assigns exact step marks, and highlights missed derivations with red-pen annotations.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you offer installment payments or flexible tokens?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! You can reserve your seat with a Rs. 300 prebooking token which is 100% credited toward your tuition. We also offer 2-installment milestone payments for 1-year all-access programs upon request via WhatsApp support.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does the 24/7 AI Live Teacher Avatar differ from regular recorded videos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Unlike static YouTube videos, the AI Teacher Avatar is interactive. You can interrupt at any second, ask for a simpler re-explanation in Nepali or English, request step-by-step blackboard diagrams, or ask custom follow-up questions tailored to your confusion.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the 2-Player Real-Time Battle Arena?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The Battle Arena matches you in real-time with another CEE or SEE aspirant across Nepal. Both players answer identical timed questions simultaneously. It builds real entrance exam speed, reduces exam panic, and awards leaderboard rating points.',
        },
      },
      {
        '@type': 'Question',
        name: 'What payment methods are supported in Nepal?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We accept Fonepay Dynamic QR (compatible with 50+ Nepal mobile banking apps) for automated activation, as well as direct bank transfers. Manual verification is available for alternative bank deposits.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the 7-day money-back refund policy?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We offer a 7-day 100% refund policy if less than 10% of the course content has been accessed and fewer than 2 full mock exams have been submitted. Prebooking tokens (Rs. 300) are credited toward course purchases.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I use my account simultaneously on a laptop and mobile phone?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, you can log in on your desktop or laptop for deep study sessions and on your mobile device for on-the-go practice. Your progress, bookmarks, test history, and AI tutor memory sync instantly across all devices.',
        },
      },
      {
        '@type': 'Question',
        name: 'How is the IELTS AI Speaking & Writing evaluated?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our IELTS examiner model uses the official Cambridge Band Descriptors across 4 criteria: Fluency & Coherence (FC), Lexical Resource (LR), Grammatical Range & Accuracy (GRA), and Pronunciation (PR) with native audio feedback and instant band predictions.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are previous years past questions (PYQs) included?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Samyak Guru includes over 10+ years of solved past questions (MEC CEE, IOM, MOE, BPKIHS, KU, and NEB Class 10 Board exams) with step-by-step conceptual explanations and trap-option warnings.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does the Weakness Detection & Mistake Analyser work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The platform tags every question by subject, chapter, and micro-topic. As you solve questions, the AI monitors your accuracy and response times, identifying sub-topics where you consistently lose marks and recommending targeted revision exercises.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is personal 1-on-1 human doubt support available?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. In addition to 24/7 instant AI tutor support, Pro & Master plan students can submit complex doubts to our faculty board (Dr. Samyak Shrestha, Pradeep Poudel Sir, Er. Bishal Adhikari, Er. Ramesh Karki) during weekly live doubt-clearing sessions.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can parents monitor their student preparation progress?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! The Parent Portal dashboard allows parents to track daily study hours, mock test scores, national percentile ranks, and attendance without needing the student personal login credentials.',
        },
      },
      {
        '@type': 'Question',
        name: 'How frequently are new mock exams and model tests added?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Every Saturday, a full-length 200-mark CEE Mock Exam and NEB SEE Model Exam are published under strict exam-timed conditions with live national rank percentiles published on Sunday morning.',
        },
      },
      {
        '@type': 'Question',
        name: 'What internet speed is required to stream live classes and videos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our video infrastructure is powered by Bunny.net Adaptive HLS CDN, automatically adjusting stream quality from 1080p Full HD down to 240p for smooth playback even on 3G mobile connections.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I switch between courses (e.g. from SEE to CEE or IELTS)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. You can switch your active portal anytime using the Program Switcher in the top navigation bar. All-Access Pass subscribers have simultaneous unlimited access to all 5 programs.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you provide certificates upon course completion?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Students who complete the Digital Marketing, Python & AI Specialization, or IELTS Masterclass with passing grades receive a verified, downloadable digital Certificate of Completion with a unique QR verification code.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I contact customer support if I face an issue?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our support team is available via WhatsApp (+977 9709066151), email (support@samyakcee.com), and at our physical office in Old Baneshwor, Kathmandu, Sunday through Friday from 6:00 AM to 9:00 PM NPT.',
        },
      },
    ],
  };
}
