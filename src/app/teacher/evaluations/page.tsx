import React from 'react';
import TeacherEvaluationsClient from './components/TeacherEvaluationsClient';

export const metadata = {
  title: 'Subjective Evaluations Queue | Teacher Dashboard | Samyak Tutor',
  description: 'Teacher queue for verifying AI-drafted rubric evaluations and publishing final scores for SEE subjective papers.',
};

export default function TeacherEvaluationsPage() {
  return <TeacherEvaluationsClient />;
}
