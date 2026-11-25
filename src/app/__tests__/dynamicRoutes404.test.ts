import { describe, it, expect, vi } from 'vitest';
import BatchDetailPage, { isValidBatchSlug } from '../batches/[slug]/page';
import ChapterDetailPage, { isValidSubjectChapter } from '../subjects/[subjectId]/[chapterId]/page';
import DedicatedSeeSubjectPage, { isValidSeeSubject } from '../see/subject/[subjectId]/page';

// Mock cookies for Server Component execution in testing
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: () => {},
  })),
}));

describe('HTTP 404 Status Correction & Dynamic Route Validation (FIX-002)', () => {
  describe('Batch Slugs (isValidBatchSlug & BatchDetailPage)', () => {
    it('accepts valid static and recognized curriculum batch slugs', async () => {
      expect(await isValidBatchSlug('see-2026-nepali-medium')).toBe(true);
      expect(await isValidBatchSlug('see-2026-english-medium')).toBe(true);
      expect(await isValidBatchSlug('target-cee-2026-full-entrance-batch')).toBe(true);
    });

    it('rejects invalid or fabricated batch slugs', async () => {
      expect(await isValidBatchSlug('unknown-fake-batch')).toBe(false);
      expect(await isValidBatchSlug('non-existent-batch-slug-123')).toBe(false);
      expect(await isValidBatchSlug('')).toBe(false);
    });

    it('triggers notFound() (HTTP 404 digest) when an invalid batch slug is requested', async () => {
      try {
        await BatchDetailPage({ params: Promise.resolve({ slug: 'completely-invalid-slug' }) });
        expect.unreachable('Should have thrown notFound');
      } catch (err: any) {
        expect(err.digest).toMatch(/NEXT_NOT_FOUND|NEXT_HTTP_ERROR_FALLBACK;404/);
      }
    });

    it('successfully renders BatchDetailClient for a valid batch slug without throwing', async () => {
      const result = await BatchDetailPage({ params: Promise.resolve({ slug: 'see-2026-nepali-medium' }) });
      expect(result).toBeDefined();
      expect(result.props.slug).toBe('see-2026-nepali-medium');
    });
  });

  describe('Subject and Chapter Hierarchy (isValidSubjectChapter & ChapterDetailPage)', () => {
    it('accepts valid subject and unit combinations', () => {
      expect(isValidSubjectChapter('science', 'unit-1')).toBe(true);
      expect(isValidSubjectChapter('science', 'unit-6')).toBe(true);
      expect(isValidSubjectChapter('math', 'unit-1')).toBe(true);
      expect(isValidSubjectChapter('opt_math', 'unit-2')).toBe(true);
      expect(isValidSubjectChapter('english', 'unit-1')).toBe(true);
    });

    it('rejects non-existent subjects', () => {
      expect(isValidSubjectChapter('astrology', 'unit-1')).toBe(false);
      expect(isValidSubjectChapter('unknown-subject', 'unit-1')).toBe(false);
    });

    it('rejects non-existent chapters/units for valid subjects', () => {
      expect(isValidSubjectChapter('science', 'unit-99')).toBe(false);
      expect(isValidSubjectChapter('math', 'unit-500')).toBe(false);
      expect(isValidSubjectChapter('science', '')).toBe(false);
      expect(isValidSubjectChapter('', 'unit-1')).toBe(false);
    });

    it('triggers notFound() (HTTP 404 digest) when invalid subject or chapter is requested', async () => {
      try {
        await ChapterDetailPage({ params: Promise.resolve({ subjectId: 'fake-subject', chapterId: 'unit-1' }) });
        expect.unreachable('Should have thrown notFound');
      } catch (err: any) {
        expect(err.digest).toMatch(/NEXT_NOT_FOUND|NEXT_HTTP_ERROR_FALLBACK;404/);
      }

      try {
        await ChapterDetailPage({ params: Promise.resolve({ subjectId: 'science', chapterId: 'unit-9999' }) });
        expect.unreachable('Should have thrown notFound');
      } catch (err: any) {
        expect(err.digest).toMatch(/NEXT_NOT_FOUND|NEXT_HTTP_ERROR_FALLBACK;404/);
      }
    });

    it('successfully renders CanonicalChapterHub for valid subject and unit without throwing', async () => {
      const result = await ChapterDetailPage({ params: Promise.resolve({ subjectId: 'science', chapterId: 'unit-1' }) });
      expect(result).toBeDefined();
      expect(result.props.subjectId).toBe('science');
      expect(result.props.chapterId).toBe('unit-1');
    });
  });

  describe('Dedicated SEE Subject Workspace (isValidSeeSubject & DedicatedSeeSubjectPage)', () => {
    it('accepts valid curriculum subjects', () => {
      expect(isValidSeeSubject('science')).toBe(true);
      expect(isValidSeeSubject('math')).toBe(true);
      expect(isValidSeeSubject('opt_math')).toBe(true);
      expect(isValidSeeSubject('english')).toBe(true);
    });

    it('rejects invalid curriculum subjects', () => {
      expect(isValidSeeSubject('astronomy')).toBe(false);
      expect(isValidSeeSubject('unknown')).toBe(false);
      expect(isValidSeeSubject('')).toBe(false);
    });

    it('triggers notFound() (HTTP 404 digest) when invalid subject is requested', async () => {
      try {
        await DedicatedSeeSubjectPage({ params: Promise.resolve({ subjectId: 'unknown-subject' }) });
        expect.unreachable('Should have thrown notFound');
      } catch (err: any) {
        expect(err.digest).toMatch(/NEXT_NOT_FOUND|NEXT_HTTP_ERROR_FALLBACK;404/);
      }
    });

    it('successfully renders CanonicalSubjectWorkspace for valid subject without throwing', async () => {
      const result = await DedicatedSeeSubjectPage({ params: Promise.resolve({ subjectId: 'science' }) });
      expect(result).toBeDefined();
      expect(result.props.subjectId).toBe('science');
    });
  });
});
