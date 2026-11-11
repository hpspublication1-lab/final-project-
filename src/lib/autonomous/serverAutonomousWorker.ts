/**
 * Samyak Educational AI — Server Autonomous Background Worker
 * High-performance autonomous background worker running in the server.
 * Continuously cycles through syllabus curriculum, synthesizes comprehensive notes,
 * creates and auto-posts high-yield MCQs with KaTeX explanations, updates Must-Solve
 * question sets, monitors student study streaks, and preserves activation code pools.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { AutonomousContentEngine, CANONICAL_AUTONOMOUS_TARGETS, TargetProgram } from '@/lib/ai/autonomousContentEngine';
import { generateAlgorithmicMCQs, ExamProgram } from '@/lib/ai/autonomousResearchPipeline';
import { executeAutonomousReminders } from '@/lib/notifications/autonomousReminderEngine';
import { mintBulkActivationCodes } from '@/lib/billing/bulkActivationCodesEngine';

export interface AutonomousWorkerLog {
  id: string;
  timestamp: string;
  cycleNumber: number;
  level: 'info' | 'success' | 'warn' | 'action';
  action: string;
  details: string;
}

export interface AutonomousWorkerState {
  isRunning: boolean;
  frequencyMinutes: number;
  currentCycleIndex: number;
  totalCyclesCompleted: number;
  lastCycleAt: string | null;
  nextCycleAt: string | null;
  totalNotesPosted: number;
  totalQuestionsPosted: number;
  totalRemindersSent: number;
  totalCodesMinted: number;
  activeCurriculumTarget: string;
  logs: AutonomousWorkerLog[];
}

// In-process persistent worker state
class ServerAutonomousWorkerManager {
  private static instance: ServerAutonomousWorkerManager;
  private intervalTimer: NodeJS.Timeout | null = null;
  private isProcessingCycle = false;

  private state: AutonomousWorkerState = {
    isRunning: true, // Default to warm background running
    frequencyMinutes: 30, // Default: every 30 minutes
    currentCycleIndex: 0,
    totalCyclesCompleted: 0,
    lastCycleAt: null,
    nextCycleAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    totalNotesPosted: 0,
    totalQuestionsPosted: 0,
    totalRemindersSent: 0,
    totalCodesMinted: 0,
    activeCurriculumTarget: 'CEE Biology: Plant Physiology & Photosynthesis',
    logs: [
      {
        id: 'sys-init-1',
        timestamp: new Date().toLocaleTimeString(),
        cycleNumber: 0,
        level: 'info',
        action: 'DAEMON_INIT',
        details: 'Autonomous Background Worker initialized. 24/7 server curriculum loop active.',
      },
    ],
  };

  private constructor() {
    this.start(this.state.frequencyMinutes);
  }

  public static getInstance(): ServerAutonomousWorkerManager {
    if (!ServerAutonomousWorkerManager.instance) {
      ServerAutonomousWorkerManager.instance = new ServerAutonomousWorkerManager();
    }
    return ServerAutonomousWorkerManager.instance;
  }

  public getState(): AutonomousWorkerState {
    return {
      ...this.state,
      logs: this.state.logs.slice(-50), // Return last 50 logs
    };
  }

  public addLog(level: 'info' | 'success' | 'warn' | 'action', action: string, details: string) {
    const entry: AutonomousWorkerLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      cycleNumber: this.state.totalCyclesCompleted + 1,
      level,
      action,
      details,
    };
    this.state.logs.push(entry);
    if (this.state.logs.length > 200) {
      this.state.logs = this.state.logs.slice(-100);
    }
  }

  /**
   * Starts or reconfigures the background autonomous interval.
   */
  public start(frequencyMinutes: number = 30) {
    this.stop();
    this.state.isRunning = true;
    this.state.frequencyMinutes = Math.max(5, frequencyMinutes);
    this.state.nextCycleAt = new Date(Date.now() + this.state.frequencyMinutes * 60 * 1000).toISOString();

    this.addLog('info', 'DAEMON_START', `Daemon worker active. Cycle interval set to ${this.state.frequencyMinutes} minutes.`);

    this.intervalTimer = setInterval(() => {
      this.executeCycle();
    }, this.state.frequencyMinutes * 60 * 1000);
  }

  /**
   * Pauses or stops the background autonomous interval.
   */
  public stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.state.isRunning = false;
    this.state.nextCycleAt = null;
    this.addLog('warn', 'DAEMON_PAUSE', 'Autonomous worker paused by administrator.');
  }

  /**
   * Executes a single end-to-end autonomous cycle across all 5 autonomous pillars.
   */
  public async executeCycle(): Promise<{ success: boolean; cycleNumber: number; summary: string }> {
    if (this.isProcessingCycle) {
      this.addLog('warn', 'CYCLE_SKIPPED', 'Previous cycle still running. Skipping overlap.');
      return { success: false, cycleNumber: this.state.totalCyclesCompleted, summary: 'Cycle already in progress.' };
    }

    this.isProcessingCycle = true;
    const cycleNum = this.state.totalCyclesCompleted + 1;
    const nowIso = new Date().toISOString();
    this.state.lastCycleAt = nowIso;
    this.state.nextCycleAt = new Date(Date.now() + this.state.frequencyMinutes * 60 * 1000).toISOString();

    this.addLog('action', 'CYCLE_START', `Starting Autonomous Operations Cycle #${cycleNum}...`);

    try {
      const admin = createAdminClient();

      // ── Step 1: Syllabus Research & Notes Auto-Posting ──────────────────────
      const targetItem = CANONICAL_AUTONOMOUS_TARGETS[this.state.currentCycleIndex % CANONICAL_AUTONOMOUS_TARGETS.length];
      this.state.activeCurriculumTarget = `${targetItem.program.toUpperCase()} ${targetItem.subject}: ${targetItem.chapter}`;
      this.addLog('info', 'RESEARCH_SWEEP', `Researching syllabus node: [${this.state.activeCurriculumTarget}]`);

      // Synthesize comprehensive notes with KaTeX equations
      const generatedNote = await AutonomousContentEngine.generateResource({
        program: targetItem.program,
        subject: targetItem.subject,
        chapterOrTopic: targetItem.chapter,
        generationType: 'comprehensive_notes',
        difficulty: 'medium',
      });

      if (admin) {
        const { data: subjectRow } = await admin
          .from('subjects')
          .select('id')
          .ilike('name', `%${targetItem.subject}%`)
          .maybeSingle();

        const { data: insertedNote, error: noteError } = await admin
          .from('notes')
          .insert({
            title: generatedNote.title,
            content: generatedNote.markdownContent,
            content_markdown: generatedNote.markdownContent,
            summary_key_points: generatedNote.summaryKeyPoints,
            formula_sheet_latex: generatedNote.formulaLatex || null,
            is_premium: false,
            is_active: true,
            subject_id: subjectRow?.id || null,
          })
          .select('id')
          .single();

        if (!noteError && insertedNote) {
          this.state.totalNotesPosted++;
          this.addLog('success', 'NOTE_POSTED', `Auto-posted live note: "${generatedNote.title}" to ${targetItem.program.toUpperCase()} resource vault.`);
        }
      }

      // ── Step 2: High-Yield MCQ Auto-Generation & Ingestion ──────────────────
      this.addLog('info', 'MCQ_SYNTHESIS', `Synthesizing 20 high-yield MCQs with KaTeX explanations for ${targetItem.program.toUpperCase()}...`);
      const mcqs = generateAlgorithmicMCQs(targetItem.program as ExamProgram, 20, targetItem.subject, targetItem.chapter);

      if (admin && mcqs.length > 0) {
        const chunk = mcqs.map((q) => {
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

        const { error: qError } = await admin.from('questions').insert(chunk);
        if (!qError) {
          this.state.totalQuestionsPosted += chunk.length;
          this.addLog('success', 'MCQS_INSERTED', `Auto-posted 20 MCQs with past-year tags into question bank.`);
        }
      }

      // ── Step 3: Autonomous Student Reminders & Streak Sentry ────────────────
      const reminderResult = await executeAutonomousReminders({
        triggerType: 'streak_preservation',
        dryRun: false,
      });
      this.state.totalRemindersSent += reminderResult.totalDispatched;
      this.addLog('success', 'REMINDERS_SENT', `Streak Sentry dispatched ${reminderResult.totalDispatched} student notifications.`);

      // ── Step 4: Activation Code Buffer Sentry ──────────────────────────────
      if (admin) {
        const { count: activeCodesCount } = await admin
          .from('activation_codes')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true)
          .is('used_by', null);

        // If buffer falls below 100 codes, auto-mint 250 backup vouchers
        if ((activeCodesCount || 0) < 100) {
          const bulkCodes = mintBulkActivationCodes({
            batchName: `AUTO-${cycleNum}`,
            count: 250,
            plan: 'pro',
            durationDays: 365,
            notes: 'Autonomous server inventory replenishment',
          });

          const codeChunk = bulkCodes.codes.map((c) => ({
            code: c.code,
            plan: c.plan,
            duration_days: c.duration_days,
            notes: c.notes,
            expires_at: c.expires_at,
            is_active: true,
          }));

          await admin.from('activation_codes').insert(codeChunk);
          this.state.totalCodesMinted += 250;
          this.addLog('success', 'CODES_MINTED', `Replenished code buffer: Minted 250 new cryptographic vouchers (Batch ${bulkCodes.batchId}).`);
        }
      }

      // Increment cycle counters
      this.state.currentCycleIndex++;
      this.state.totalCyclesCompleted++;
      this.addLog('success', 'CYCLE_COMPLETE', `Cycle #${cycleNum} completed successfully.`);

      return {
        success: true,
        cycleNumber: cycleNum,
        summary: `Cycle #${cycleNum} finished. Notes, MCQs, and reminders updated.`,
      };
    } catch (err: any) {
      this.addLog('warn', 'CYCLE_ERROR', `Cycle #${cycleNum} error: ${err.message || 'Unknown failure'}`);
      return {
        success: false,
        cycleNumber: cycleNum,
        summary: err.message || 'Worker failure',
      };
    } finally {
      this.isProcessingCycle = false;
    }
  }
}

// Export singleton worker instance accessor
export const autonomousWorker = ServerAutonomousWorkerManager.getInstance();
