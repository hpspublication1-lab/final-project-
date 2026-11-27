import type { LessonContent, VisualAssetManifest } from '@/lib/cee-visual/schemas';

/** Turns the server's "missing" codes into plain instructions for the student. */
export function describeMissing(code: string, content: LessonContent, manifest: VisualAssetManifest | null): string {
  const [kind, key] = code.split(':');
  switch (kind) {
    case 'OPENED':
      return 'Open the lesson.';
    case 'VISUAL_SHOWN':
      return 'Let the visual load.';
    case 'SECTION': {
      const s = content.sections.find((x) => x.key === key);
      return `Read “${s?.heading ?? key}”.`;
    }
    case 'SEQUENCE': {
      const s = manifest?.sequences.find((x) => x.key === key);
      return `Go through every step of “${s?.title ?? key}”.`;
    }
    case 'ATTEMPT':
      return 'Answer the questions.';
    case 'SCORE':
      return `Score at least ${content.completion.minScorePercent ?? 0}% on the questions.`;
    case 'SEQUENCE_MISSING_IN_VISUAL':
      return 'This lesson is set up incorrectly and can’t be completed yet. Your progress is saved.';
    default:
      return code;
  }
}
