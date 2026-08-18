'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PublicNav from '@/components/PublicNav';
import SubjectivePracticeList from '@/components/subjective/SubjectivePracticeList';
import SubjectiveAnswerEvaluator from '@/components/subjective/SubjectiveAnswerEvaluator';
import { SubjectiveQuestion } from '@/components/subjective/types';
import { useProgram } from '@/contexts/ProgramContext';
import { LanguageProvider } from '@/lib/i18n/LanguageProvider';

export default function SubjectivePageClient() {
  const { program } = useProgram();
  const [isDark, setIsDark] = useState(false);
  const [questions, setQuestions] = useState<SubjectiveQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<SubjectiveQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    fetch(`/api/subjective/questions?program=${program}`)
      .then((res) => (res.ok ? res.json() : { questions: [] }))
      .then((data) => {
        if (!active) return;
        setQuestions(data.questions || []);
      })
      .catch((err) => {
        console.error('Failed to fetch subjective questions:', err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [program]);

  return (
    <LanguageProvider>
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          {selectedQuestion ? (
            <SubjectiveAnswerEvaluator
              question={selectedQuestion}
              onBack={() => setSelectedQuestion(null)}
            />
          ) : (
            <SubjectivePracticeList
              questions={questions}
              onSelectQuestion={(q) => setSelectedQuestion(q)}
              isLoading={isLoading}
            />
          )}
        </div>
      </DashboardLayout>
    </LanguageProvider>
  );
}
