'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';
import { SUPPORT_CONFIG } from '@/lib/config/support';
import {
  HelpCircle,
  Search,
  ChevronDown,
  BookOpen,
  Brain,
  CreditCard,
  Smartphone,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Mail,
  RotateCcw,
} from 'lucide-react';

interface FAQItem {
  id: string;
  category: 'curriculum' | 'ai' | 'payment' | 'access';
  categoryLabel: string;
  question: string;
  answer: string;
  badge?: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'curriculum',
    categoryLabel: 'Curriculum & Syllabus',
    question: 'Is this aligned with the latest CEE 2026 syllabus?',
    answer:
      'Yes, 100%. Every single sub-chapter note, formula sheet, derivation, and MCQ is rigorously mapped to the updated Medical Education Commission (MEC) CEE syllabus. When MEC or CDC releases syllabus modifications, our academic faculty updates study materials within 48 hours.',
    badge: 'CEE 2026 MEC',
  },
  {
    id: 'faq-2',
    category: 'access',
    categoryLabel: 'Access & Offline',
    question: 'Can I access content offline?',
    answer:
      'Yes. Enrolled students can download official PDF formula sheets, high-yield chapter notes, and past paper derivation sheets for offline study. Furthermore, the Samyak Guru Mobile App (available for Android & iOS) supports offline practice test caching, allowing you to practice MCQs without an active internet connection.',
    badge: 'Offline Mode',
  },
  {
    id: 'faq-3',
    category: 'payment',
    categoryLabel: 'Subscriptions & Renewals',
    question: 'What happens after my 1-year subscription expires?',
    answer:
      'When your 1-year access period concludes, your account remains active with your historical test attempts, bookmarks, weakness logs, and achievement badges permanently preserved. You will receive an exclusive 50% returning-student renewal discount, or you can transition to free community mock exams.',
    badge: '1-Year Validity',
  },
  {
    id: 'faq-4',
    category: 'ai',
    categoryLabel: 'AI Features',
    question: 'How does the AI handwritten answer checker work?',
    answer:
      'Our AI Evaluator (Vision Marker) uses advanced neural OCR to read your handwritten exam answers from photos. It parses your work step-by-step against official NEB CDC / Cambridge marking rubrics, assigns exact step marks, identifies missed formula substitutions, and generates red-pen annotations showing where you lost points and how to gain full marks.',
    badge: 'Vision Marker',
  },
  {
    id: 'faq-5',
    category: 'payment',
    categoryLabel: 'Subscriptions & Renewals',
    question: 'Do you offer installment payments?',
    answer:
      'Yes! We provide flexible payment options. You can reserve your seat with a Rs. 300 prebooking token that is 100% credited toward your tuition. For full-year all-access programs, we also offer a 2-installment payment structure upon request via our WhatsApp support team.',
    badge: 'Flexible Tokens',
  },
  {
    id: 'faq-6',
    category: 'ai',
    categoryLabel: 'AI Features',
    question: 'How does the 24/7 AI Live Teacher Avatar differ from recorded videos?',
    answer:
      'Unlike static YouTube or prerecorded videos where you are a passive viewer, the AI Teacher Avatar is fully interactive. You can pause the teacher at any timestamp, ask for a simpler breakdown in Nepali or English, request blackboard diagrams, or get instant answers to custom doubts with real-time lip-synced video output.',
    badge: 'Interactive Avatar',
  },
  {
    id: 'faq-7',
    category: 'ai',
    categoryLabel: 'AI Features',
    question: 'What is the 2-Player Real-Time Battle Arena?',
    answer:
      'The Battle Arena connects you live with another CEE or SEE aspirant in Nepal for timed 1-on-1 MCQ matches. Both players answer identical randomized questions simultaneously with server-synchronized timers. It trains your speed under real entrance exam pressure and boosts your national competitive ranking.',
    badge: 'Multiplayer Arena',
  },
  {
    id: 'faq-8',
    category: 'payment',
    categoryLabel: 'Subscriptions & Renewals',
    question: 'What payment methods are supported in Nepal?',
    answer:
      'We support all major Nepalese payment methods: Fonepay Dynamic QR (scan directly with any mobile banking app like Global IME, Nabil, NIC Asia, Siddhartha, etc.), eSewa, Khalti, IME Pay, ConnectIPS, and direct bank transfers. Course access is automated and unlocks instantly upon payment.',
    badge: 'Instant Fonepay',
  },
  {
    id: 'faq-9',
    category: 'payment',
    categoryLabel: 'Subscriptions & Renewals',
    question: 'What is your refund policy?',
    answer:
      'We offer a 7-day 100% money-back guarantee. If you are not satisfied within 7 days of purchase, and you have accessed less than 10% of the course content and attempted no more than 2 mock exams, we will issue a full refund to your original payment account. Rs. 300 prebooking tokens are credited toward course purchases.',
    badge: '7-Day Guarantee',
  },
  {
    id: 'faq-10',
    category: 'access',
    categoryLabel: 'Access & Offline',
    question: 'Can I use my account simultaneously on multiple devices?',
    answer:
      'Yes! You can study on your laptop or desktop browser during deep study hours and switch seamlessly to your mobile phone or tablet on the go. Your bookmarks, test records, AI conversation memory, and completed chapters sync in real-time across all your devices.',
    badge: 'Cloud Sync',
  },
  {
    id: 'faq-11',
    category: 'curriculum',
    categoryLabel: 'Curriculum & Syllabus',
    question: 'How is the IELTS AI Speaking & Writing evaluated?',
    answer:
      'Our IELTS scoring engine evaluates your responses using official Cambridge Band Descriptors across 4 criteria: Fluency & Coherence (FC), Lexical Resource (LR), Grammatical Range & Accuracy (GRA), and Pronunciation (PR). It provides instant band score estimates (from 5.0 to 9.0) with detailed constructive feedback.',
    badge: 'Cambridge Band 8.5+',
  },
  {
    id: 'faq-12',
    category: 'curriculum',
    categoryLabel: 'Curriculum & Syllabus',
    question: 'Are past exam questions (PYQs) with solutions included?',
    answer:
      'Yes. The platform includes 10+ years of solved past questions from MEC CEE, IOM, MOE, BPKIHS, KU, and NEB Class 10 Board exams. Each question includes step-by-step conceptual derivations, common trap options to avoid, and chapter cross-references.',
    badge: '10+ Years PYQs',
  },
  {
    id: 'faq-13',
    category: 'ai',
    categoryLabel: 'AI Features',
    question: 'How does Weakness Detection & Mistake Analyser work?',
    answer:
      'Every question in our bank is indexed with micro-topic tags. When you practice, the AI algorithm monitors your incorrect attempts and reaction speeds. It generates a personalized weakness diagnostic heatmap and dynamically schedules targeted revision tests to turn weak areas into strengths.',
    badge: 'Adaptive ML',
  },
  {
    id: 'faq-14',
    category: 'curriculum',
    categoryLabel: 'Curriculum & Syllabus',
    question: 'Is 1-on-1 human doubt support available alongside AI?',
    answer:
      'Yes! In addition to 24/7 instant AI tutor support, enrolled students have access to weekly live doubt-clearing webinars and Q&A sessions with our faculty leads: Dr. Samyak Shrestha (Medical Lead), Pradeep Poudel Sir (NEB Lead), and our senior educators.',
    badge: 'Faculty Q&A',
  },
  {
    id: 'faq-15',
    category: 'access',
    categoryLabel: 'Access & Offline',
    question: 'Can parents monitor their child’s preparation progress?',
    answer:
      'Yes. Through our dedicated Parent Portal, parents can view weekly study hours, completed chapters, Saturday mock test scores, and national percentile ranks via a secure parental access PIN without needing the student’s personal account login.',
    badge: 'Parent Portal',
  },
  {
    id: 'faq-16',
    category: 'curriculum',
    categoryLabel: 'Curriculum & Syllabus',
    question: 'How often are full-length mock exams conducted?',
    answer:
      'Every Saturday morning, a full-length 200-mark CEE Mock Exam and Class 10 Board Model Exam are held under real-time exam conditions. Official answer keys, video solutions, and Nepal-wide rank percentiles are published Sunday morning.',
    badge: 'Weekly Saturday Mocks',
  },
  {
    id: 'faq-17',
    category: 'access',
    categoryLabel: 'Access & Offline',
    question: 'What internet speed is required to stream live classes and videos?',
    answer:
      'Our video infrastructure is delivered via Bunny.net Adaptive Bitrate HLS CDN. The player dynamically adjusts stream quality from 1080p Full HD down to 240p based on your connection, ensuring smooth, uninterrupted playback even on 3G mobile data connections in remote Nepal regions.',
    badge: 'Adaptive HLS CDN',
  },
  {
    id: 'faq-18',
    category: 'access',
    categoryLabel: 'Access & Offline',
    question: 'Can I switch between programs (e.g. from SEE to CEE or IELTS)?',
    answer:
      'Yes. You can switch your active portal anytime using the Program Switcher in the top header navigation. Students with an All-Access Pass can learn across all 5 programs simultaneously under a single subscription.',
    badge: '5-in-1 Portal',
  },
  {
    id: 'faq-19',
    category: 'curriculum',
    categoryLabel: 'Curriculum & Syllabus',
    question: 'Do you provide verified completion certificates?',
    answer:
      'Yes. Students completing the Digital Marketing Specialization, Python & Generative AI program, or IELTS Fluency Masterclass with passing grades receive an official, verifiable Digital Certificate of Completion with a unique QR authentication link.',
    badge: 'Verified Certificates',
  },
  {
    id: 'faq-20',
    category: 'access',
    categoryLabel: 'Access & Offline',
    question: 'How do I contact customer support if I encounter an issue?',
    answer:
      'Our student support team is available 6 days a week (Sunday to Friday, 6:00 AM – 9:00 PM NPT) via WhatsApp (+977 9709066151), direct phone, email (support@samyakcee.com), or in person at our Kathmandu office in Old Baneshwor.',
    badge: 'Kathmandu Support',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Questions', count: 20, icon: HelpCircle },
  { id: 'curriculum', label: 'Curriculum & Syllabus', count: 6, icon: BookOpen },
  { id: 'ai', label: 'AI Tools & Grading', count: 5, icon: Brain },
  { id: 'payment', label: 'Pricing & Refunds', count: 4, icon: CreditCard },
  { id: 'access', label: 'Apps & Offline Access', count: 5, icon: Smartphone },
];

export default function FAQPageClient() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(['faq-1', 'faq-2', 'faq-3', 'faq-4', 'faq-5']));

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        (item.badge && item.badge.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const toggleFaq = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setOpenIds(new Set(FAQ_DATA.map((f) => f.id)));
  };

  const collapseAll = () => {
    setOpenIds(new Set());
  };

  return (
    <PageTransitionWrapper>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <PublicNav />

        <main className="flex-1 pt-12 pb-24">
          {/* Breadcrumb */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <nav className="flex items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-foreground font-bold">Frequently Asked Questions</span>
            </nav>
          </div>

          {/* Hero Header */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black border border-primary/20">
              <Sparkles size={14} /> Help &amp; Knowledge Center
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Find clear answers regarding the CEE 2026 syllabus, AI paper grading, offline study, Fonepay payments,
              and 7-day money-back guarantee.
            </p>

            {/* Search Input */}
            <div className="max-w-2xl mx-auto pt-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions (e.g., CEE syllabus, offline, refund, AI marker)..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
                  aria-label="Search frequently asked questions"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-muted"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <div className="flex items-center justify-between gap-4 pb-2 flex-wrap">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shrink-0 transition-all border ${
                        active
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-card text-muted-foreground hover:text-foreground border-border hover:border-primary/30'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{cat.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          active ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Expand / Collapse buttons */}
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground ml-auto">
                <button onClick={expandAll} className="hover:text-primary transition-colors">
                  Expand all
                </button>
                <span>•</span>
                <button onClick={collapseAll} className="hover:text-primary transition-colors">
                  Collapse all
                </button>
              </div>
            </div>
          </div>

          {/* FAQ Accordion List */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-3xl p-8 space-y-3">
                <HelpCircle size={40} className="text-muted-foreground mx-auto" />
                <h3 className="text-base font-black text-foreground">No questions found matching &ldquo;{searchQuery}&rdquo;</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Try searching with different keywords or contact our student support desk directly on WhatsApp.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="btn-primary text-xs font-bold px-4 py-2 mt-2"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isOpen = openIds.has(faq.id);
                return (
                  <div
                    key={faq.id}
                    className={`bg-card border rounded-2xl sm:rounded-3xl p-5 sm:p-6 transition-all ${
                      isOpen ? 'border-primary/40 shadow-md bg-card' : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-start justify-between gap-4 text-left group"
                      aria-expanded={isOpen}
                    >
                      <div className="space-y-1.5 flex-1">
                        {faq.badge && (
                          <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                            {faq.badge}
                          </span>
                        )}
                        <h2 className="text-base sm:text-lg font-black text-foreground group-hover:text-primary transition-colors leading-snug">
                          {faq.question}
                        </h2>
                      </div>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-transform duration-200 mt-1 ${
                          isOpen
                            ? 'bg-primary text-white border-primary rotate-180'
                            : 'bg-muted text-muted-foreground border-border group-hover:border-primary/40'
                        }`}
                      >
                        <ChevronDown size={16} />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="mt-4 pt-4 border-t border-border text-xs sm:text-sm text-muted-foreground leading-relaxed animate-fade-in space-y-2">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Still Have Questions Banner */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
            <div className="bg-gradient-to-tr from-primary/15 via-card to-emerald-500/10 border border-primary/20 rounded-3xl p-8 sm:p-10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary uppercase tracking-wider">
                  <MessageSquare size={14} /> Direct Student Support
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  Still have questions before enrolling?
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Our academic counselors are available to review your course goals, syllabus plans, and answer any
                  payment questions directly.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
                <a
                  href="https://wa.me/9779709066151?text=Hello%20Samyak%20Guru%2C%20I%20have%20a%20question%20about%20the%20courses."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full sm:w-auto justify-center px-6 py-3.5 text-xs font-black shadow-lg shadow-primary/20"
                >
                  <MessageSquare size={15} /> Chat on WhatsApp
                </a>
                <Link
                  href="/contact"
                  className="px-5 py-3.5 rounded-2xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted transition-all w-full sm:w-auto text-center"
                >
                  Visit Contact Page →
                </Link>
              </div>
            </div>
          </div>
        </main>

        <HomepageFooter />
      </div>
    </PageTransitionWrapper>
  );
}
