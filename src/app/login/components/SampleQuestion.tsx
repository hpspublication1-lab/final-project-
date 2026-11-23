'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

/**
 * A real exam question on the sign-in page (desktop only). It shows what
 * Samyak is in one glance, and answering it is a ten-second taste of practice.
 * Rotates daily; "Next question" cycles through the set.
 */

interface Question {
  subject: string;
  prompt: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  why: string;
}

const QUESTIONS: Question[] = [
  {
    subject: 'CEE Biology',
    prompt: 'What is the functional unit of the kidney?',
    options: ['Neuron', 'Nephron', 'Alveolus', 'Villus'],
    answer: 1,
    why: 'Each human kidney has about a million nephrons. They filter the blood and form urine.',
  },
  {
    subject: 'CEE Chemistry',
    prompt: 'Which gas is released when zinc reacts with dilute hydrochloric acid?',
    options: ['Oxygen', 'Hydrogen', 'Chlorine', 'Carbon dioxide'],
    answer: 1,
    why: 'Zn + 2HCl → ZnCl₂ + H₂. Metals above hydrogen in the reactivity series displace it from dilute acids.',
  },
  {
    subject: 'CEE Physics',
    prompt: 'What is the SI unit of electric charge?',
    options: ['Ampere', 'Volt', 'Coulomb', 'Ohm'],
    answer: 2,
    why: 'One coulomb is the charge carried by a current of one ampere in one second (Q = It).',
  },
  {
    subject: 'SEE Mathematics',
    prompt: 'If 2x + 3 = 11, what is x?',
    options: ['3', '4', '5', '7'],
    answer: 1,
    why: 'Subtract 3 from both sides to get 2x = 8, then divide by 2.',
  },
  {
    subject: 'CEE Biology',
    prompt: 'Which blood cells start the clotting process at a wound?',
    options: ['Red blood cells', 'White blood cells', 'Platelets', 'Plasma cells'],
    answer: 2,
    why: 'Platelets gather at the injury and release clotting factors that turn fibrinogen into fibrin.',
  },
  {
    subject: 'IELTS Vocabulary',
    prompt: 'Which word is closest in meaning to “reluctant”?',
    options: ['Eager', 'Unwilling', 'Curious', 'Tired'],
    answer: 1,
    why: '“Reluctant” means unwilling or hesitant: “She was reluctant to speak first.”',
  },
  {
    subject: 'CEE Chemistry',
    prompt: 'What is the pH of pure water at 25 °C?',
    options: ['0', '1', '7', '14'],
    answer: 2,
    why: 'At 25 °C pure water has equal H⁺ and OH⁻ concentrations of 10⁻⁷ mol/L, so its pH is 7.',
  },
];

const LETTERS = ['A', 'B', 'C', 'D'] as const;

export default function SampleQuestion() {
  const [index, setIndex] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);

  // Chosen on the client so the server render and the visitor's date never disagree.
  useEffect(() => {
    setIndex(Math.floor(Date.now() / 86_400_000) % QUESTIONS.length);
  }, []);

  if (index === null) return <div className="h-[420px]" aria-hidden="true" />;

  const q = QUESTIONS[index];
  const answered = picked !== null;
  const correct = picked === q.answer;

  const next = () => {
    setPicked(null);
    setIndex((i) => ((i ?? 0) + 1) % QUESTIONS.length);
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-[18px] bg-white p-6 text-[#101828] shadow-[0_24px_60px_-20px_rgba(10,6,40,0.55)] dark:bg-[#151233] dark:text-white"
      >
        <p className="text-sm font-semibold text-[#3B2DB8] dark:text-[#B4AEFF]">{q.subject}</p>
        <p className="mt-2 text-lg font-bold leading-snug" id="sample-q">
          {q.prompt}
        </p>

        <div role="radiogroup" aria-labelledby="sample-q" className="mt-5 space-y-2.5">
          {q.options.map((opt, i) => {
            const isAnswer = i === q.answer;
            const isPicked = i === picked;
            let tone =
              'border-[#E4E7EC] hover:border-[#3B2DB8] hover:bg-[#F4F3FF] dark:border-white/15 dark:hover:border-[#B4AEFF] dark:hover:bg-white/5';
            if (answered && isAnswer)
              tone = 'border-[#079455] bg-[#ECFDF3] text-[#05603A] dark:border-[#47CD89] dark:bg-[#053321] dark:text-[#ABEFC6]';
            else if (answered && isPicked)
              tone = 'border-[#D92D20] bg-[#FEF3F2] text-[#912018] dark:border-[#F97066] dark:bg-[#3D0C0A] dark:text-[#FECDCA]';
            else if (answered) tone = 'border-[#E4E7EC] opacity-60 dark:border-white/10';

            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={isPicked}
                disabled={answered}
                onClick={() => setPicked(i)}
                className={`flex w-full items-center gap-3 rounded-[12px] border-[1.5px] px-3.5 py-2.5 text-left text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3B2DB8]/30 disabled:cursor-default ${tone}`}
              >
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border border-black/10 bg-black/[0.04] dark:border-white/15 text-sm font-bold dark:bg-white/10"
                >
                  {answered && isAnswer ? <Check size={16} /> : answered && isPicked ? <X size={16} /> : LETTERS[i]}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        <div aria-live="polite">
          {answered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="mt-4 text-[15px] font-bold">{correct ? 'Correct.' : `Not quite — it’s ${q.options[q.answer]}.`}</p>
              <p className="mt-1 text-sm leading-relaxed text-[#475467] dark:text-white/70">{q.why}</p>
              <button
                type="button"
                onClick={next}
                className="mt-4 text-sm font-semibold text-[#3B2DB8] underline-offset-4 hover:underline dark:text-[#B4AEFF]"
              >
                Try another question
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
