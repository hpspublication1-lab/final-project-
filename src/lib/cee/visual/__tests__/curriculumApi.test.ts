import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getCurriculum } from '@/app/api/cee/curriculum/route';
import { GET as getLesson } from '@/app/api/cee/lessons/[slug]/route';

describe('CEE Visual Intelligence Curriculum & Isolation API (FND-003)', () => {
  it('CEE-001: should return verified CEE curriculum hierarchy with zero fabricated lessons', async () => {
    const req = new NextRequest('http://localhost:4028/api/cee/curriculum?program=cee');
    const res = await getCurriculum(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.program).toBe('cee');
    expect(json.data.subjects).toBeDefined();

    const zoology = json.data.subjects.find((s: { code: string }) => s.code === 'BIO_ZOO');
    expect(zoology).toBeDefined();
    expect(zoology.name).toContain('Zoology');

    const physiology = zoology.chapters.find((c: { id: string }) => c.id === 'chap_human_phys');
    expect(physiology).toBeDefined();

    const circulatory = physiology.topics.find((t: { id: string }) => t.id === 'top_circulatory');
    expect(circulatory).toBeDefined();
    expect(circulatory.publishedLessonsCount).toBe(1); // Human Heart pilot
  });

  it('CEE-002: should reject cross-program queries (IELTS or SEE cannot query CEE visual nodes)', async () => {
    const req = new NextRequest('http://localhost:4028/api/cee/curriculum?program=ielts');
    const res = await getCurriculum(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.error.code).toBe('CROSS_PROGRAM_ISOLATION_VIOLATION');
    expect(json.error.message).toContain('ielts');
  });

  it('CEE-004: should deliver approved published lesson snapshot for human-heart', async () => {
    const req = new NextRequest('http://localhost:4028/api/cee/lessons/human-heart');
    const res = await getLesson(req, { params: Promise.resolve({ slug: 'human-heart' }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.slug).toBe('human-heart');
    expect(json.data.status).toBe('PUBLISHED');
    expect(json.data.manifest.hotspots.length).toBeGreaterThanOrEqual(4);
    expect(json.data.practiceQuestions.length).toBeGreaterThanOrEqual(3);
  });

  it('CEE-004: should return HTTP 404 for unapproved or draft lesson slugs', async () => {
    const req = new NextRequest('http://localhost:4028/api/cee/lessons/draft-unapproved-lesson');
    const res = await getLesson(req, { params: Promise.resolve({ slug: 'draft-unapproved-lesson' }) });
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.error.code).toBe('LESSON_NOT_PUBLISHED');
  });
});
