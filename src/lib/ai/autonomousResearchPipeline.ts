/**
 * Samyak AI Autonomous Research & 10,000+ Question Ingestion Pipeline
 * Server-side ingestion runner that re-exports pure data structures from autonomousQuestionBank
 * and handles chunked database writes and CSV exports.
 */

export * from './autonomousQuestionBank';
import {
  BulkGenerationOptions,
  BulkGenerationResult,
  generateAlgorithmicMCQs,
} from './autonomousQuestionBank';

// ── High-Performance Bulk Database Ingestion & CSV Export ────────────────
export async function executeBulkQuestionIngestion(
  options: BulkGenerationOptions
): Promise<BulkGenerationResult> {
  const startTime = Date.now();
  const batchId = `QMB-${Date.now().toString(36).toUpperCase()}`;
  const targetCount = Math.min(10000, Math.max(1, options.targetCount || 100));

  // 1. Generate questions
  const questions = generateAlgorithmicMCQs(
    options.program,
    targetCount,
    options.subject,
    options.topic
  );

  let insertedCount = 0;

  // 2. Insert into PostgreSQL questions table if autoPublish is true and DB is active
  if (options.autoPublish) {
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const admin = createAdminClient();
      if (admin) {
        const CHUNK_SIZE = 100;
        for (let i = 0; i < questions.length; i += CHUNK_SIZE) {
          const chunk = questions.slice(i, i + CHUNK_SIZE).map((q) => {
            const pastYearMatch = q.past_year_tag ? q.past_year_tag.match(/\b(20\d\d)\b/) : null;
            const yearNum = pastYearMatch ? parseInt(pastYearMatch[1], 10) : null;
            return {
              question_text: q.question_text,
              options: [q.option_a, q.option_b, q.option_c, q.option_d],
              correct_answer: q.correct_option.toUpperCase(),
              explanation: q.explanation,
              difficulty: q.difficulty,
              is_published: true,
              is_active: true,
              is_pyq: !!q.past_year_tag,
              exam_name: q.program_type.toUpperCase(),
              exam_year: yearNum,
              high_yield_priority: q.is_high_yield ? 'high' : 'medium',
            };
          });

          const { error: insertError } = await admin.from('questions').insert(chunk);
          if (!insertError) {
            insertedCount += chunk.length;
          } else {
            console.warn(`[BulkQuestions] Chunk ${i} insertion error:`, insertError.message);
          }
        }
      }
    } catch (err: any) {
      console.warn('[BulkQuestions] Dynamic DB insert notice:', err.message);
    }
  }

  // 3. Serialize to CSV for offline book publishing, test printing, or bulk review
  const csvHeaders = ['Serial #', 'Program', 'Subject', 'Topic', 'Question Text', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Option', 'Difficulty', 'Explanation'];
  const csvRows = questions.map((q, idx) => [
    idx + 1,
    q.program_type.toUpperCase(),
    `"${q.subject.replace(/"/g, '""')}"`,
    `"${q.topic.replace(/"/g, '""')}"`,
    `"${q.question_text.replace(/"/g, '""')}"`,
    `"${q.option_a.replace(/"/g, '""')}"`,
    `"${q.option_b.replace(/"/g, '""')}"`,
    `"${q.option_c.replace(/"/g, '""')}"`,
    `"${q.option_d.replace(/"/g, '""')}"`,
    q.correct_option.toUpperCase(),
    q.difficulty.toUpperCase(),
    `"${q.explanation.replace(/"/g, '""')}"`,
  ].join(','));
  const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

  const topicsCovered = Array.from(new Set(questions.map((q) => `${q.subject}: ${q.topic}`)));

  return {
    batchId,
    program: options.program,
    totalGenerated: questions.length,
    totalInserted: insertedCount,
    questions,
    csvContent,
    topicsCovered,
    executionTimeMs: Date.now() - startTime,
  };
}
