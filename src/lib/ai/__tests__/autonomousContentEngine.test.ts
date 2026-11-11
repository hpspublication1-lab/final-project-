import { describe, it, expect } from 'vitest';
import {
  AutonomousContentEngine,
  PROGRAM_CURRICULUM_BLUEPRINTS,
} from '../autonomousContentEngine';

describe('Autonomous Content Engine', () => {
  it('should have valid curriculum blueprints for CEE, SEE, and IELTS', () => {
    expect(PROGRAM_CURRICULUM_BLUEPRINTS.cee.subjects).toContain('Physics');
    expect(PROGRAM_CURRICULUM_BLUEPRINTS.see.subjects).toContain('Compulsory Science');
    expect(PROGRAM_CURRICULUM_BLUEPRINTS.ielts.subjects).toContain('Writing Task 2');
  });

  it('should generate high-yield CEE notes with KaTeX equations', async () => {
    const result = await AutonomousContentEngine.generateResource({
      program: 'cee',
      subject: 'Physics',
      chapterOrTopic: 'Thermodynamics & Heat Transfer',
      generationType: 'comprehensive_notes',
    });

    expect(result.program).toBe('cee');
    expect(result.subject).toBe('Physics');
    expect(result.title).toContain('CEE');
    expect(result.markdownContent.length).toBeGreaterThan(100);
    expect(result.summaryKeyPoints.length).toBeGreaterThan(0);
  });

  it('should generate SEE Class 10 CDC notes', async () => {
    const result = await AutonomousContentEngine.generateResource({
      program: 'see',
      subject: 'Compulsory Science',
      chapterOrTopic: 'Force & Gravity',
      generationType: 'comprehensive_notes',
    });

    expect(result.program).toBe('see');
    expect(result.markdownContent).toContain('Newton');
  });

  it('should generate IELTS Band 9 model essays', async () => {
    const result = await AutonomousContentEngine.generateResource({
      program: 'ielts',
      subject: 'Writing Task 2',
      chapterOrTopic: 'Higher Education & Free University',
      generationType: 'ielts_mastery_pack',
    });

    expect(result.program).toBe('ielts');
    expect(result.markdownContent).toContain('Band 9');
    expect(result.markdownContent).toContain('Lexical Resource');
  });

  it('should run autonomous curriculum sweep across CEE, SEE, and IELTS', async () => {
    const sweep = await AutonomousContentEngine.runAutonomousCurriculumSweep({
      program: 'all',
      maxItems: 3,
    });

    expect(sweep.totalProcessed).toBe(3);
    expect(sweep.items.length).toBe(3);
    expect(sweep.durationMs).toBeGreaterThanOrEqual(0);
    expect(sweep.items[0].result.markdownContent.length).toBeGreaterThan(50);
  });
});
