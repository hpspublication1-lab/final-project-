import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/supabase/route-auth';

export const dynamic = 'force-dynamic';

function cleanAndCategorize(rawTitle: string) {
  let title = (rawTitle || '').replace(/\.mp4$/i, '').trim();
  const lower = title.toLowerCase();

  let subjectSlug = 'physics';
  let unit = 'Unit 1: Force & Gravitation';
  let part = 1;
  let unitOrder = 1;

  // 1. OPTIONAL MATHEMATICS
  if (
    lower.includes('see-om') ||
    lower.includes('om-em') ||
    lower.includes('opt math') ||
    lower.includes('continuity') ||
    lower.includes('polynomial') ||
    lower.includes('matrix') ||
    lower.includes('determinant') ||
    lower.includes('trig') ||
    lower.includes('vector') ||
    lower.includes('transformation') ||
    lower.includes('inversion') ||
    lower.includes('dispersion') ||
    lower.includes('standard deviation')
  ) {
    subjectSlug = 'opt_math';
    if (lower.includes('continuity') || lower.includes('limit')) {
      unit = 'Unit 2: Limits & Continuity';
      unitOrder = 2;
    } else if (lower.includes('matrix') || lower.includes('determinant')) {
      unit = 'Unit 3: Matrices & Determinants';
      unitOrder = 3;
    } else if (lower.includes('trig') || lower.includes('compound angle') || lower.includes('multiple angle') || lower.includes('height and distance')) {
      unit = 'Unit 5: Trigonometry';
      unitOrder = 5;
    } else if (lower.includes('vector') || lower.includes('scalar product')) {
      unit = 'Unit 6: Vector Geometry';
      unitOrder = 6;
    } else if (lower.includes('transformation') || lower.includes('inversion')) {
      unit = 'Unit 7: Transformation';
      unitOrder = 7;
    } else if (lower.includes('statistic') || lower.includes('dispersion') || lower.includes('deviation')) {
      unit = 'Unit 8: Statistics & Probability';
      unitOrder = 8;
    } else {
      unit = 'Unit 1: Functions, Polynomials & Sequences';
      unitOrder = 1;
    }
  }

  // 2. COMPULSORY MATHEMATICS
  else if (
    lower.includes('see-cm') ||
    lower.includes('compound interest') ||
    lower.includes('money exchange') ||
    lower.includes('currency') ||
    lower.includes('pyramid') ||
    lower.includes('cone') ||
    lower.includes('cylinder') ||
    lower.includes('sphere') ||
    lower.includes('prism') ||
    lower.includes('solid') ||
    lower.includes('mensuration') ||
    lower.includes('quadratic') ||
    lower.includes('indices') ||
    lower.includes('surds') ||
    lower.includes('probability') ||
    lower.includes('u1 set') ||
    lower.startsWith('u1 p') ||
    lower.startsWith('u2 arithmetic') ||
    lower.includes('u2 l2')
  ) {
    subjectSlug = 'math';
    if (lower.includes('set') || lower.startsWith('u1 p') || lower.startsWith('u1 set')) {
      unit = 'Unit 1: Sets (Samuha)';
      unitOrder = 1;
    } else if (lower.includes('pyramid') || lower.includes('cone') || lower.includes('cylinder') || lower.includes('sphere') || lower.includes('mensuration') || lower.includes('solid')) {
      unit = 'Unit 3: Mensuration & Solids';
      unitOrder = 3;
    } else if (lower.includes('quadratic') || lower.includes('algebra') || lower.includes('indices') || lower.includes('surds')) {
      unit = 'Unit 4: Algebra & Equations';
      unitOrder = 4;
    } else if (lower.includes('probability')) {
      unit = 'Unit 6: Probability & Statistics';
      unitOrder = 6;
    } else {
      unit = 'Unit 2: Arithmetic & Money Exchange';
      unitOrder = 2;
    }
  }

  // 3. ENGLISH LANGUAGE
  else if (
    lower.startsWith('q') ||
    lower.includes('grammar') ||
    lower.includes('adjective') ||
    lower.includes('adverb') ||
    lower.includes('modals') ||
    lower.includes('pronoun') ||
    lower.includes('preposition') ||
    lower.includes('tense') ||
    lower.includes('writing') ||
    lower.includes('story') ||
    lower.includes('poem') ||
    lower.includes('passage') ||
    lower.includes('unseen') ||
    lower.includes('driverless') ||
    lower.includes('olmypic') ||
    lower.includes('olympic') ||
    lower.includes('cabbage') ||
    lower.includes('wisdom')
  ) {
    subjectSlug = 'english';
    if (lower.includes('writing') || lower.includes('essay') || lower.includes('letter') || lower.includes('news report') || lower.includes('story')) {
      unit = 'Section B: Free Writing & Composition';
      unitOrder = 2;
    } else if (lower.includes('passage') || lower.includes('unseen') || lower.includes('driverless') || lower.includes('olympic') || lower.includes('olmypic')) {
      unit = 'Section C: Reading Comprehension & Passages';
      unitOrder = 3;
    } else if (lower.includes('poem') || lower.includes('cabbage') || lower.includes('wisdom') || lower.includes('literature')) {
      unit = 'Section D: Literature, Poems & Stories';
      unitOrder = 4;
    } else {
      unit = 'Section A: Grammar & Language Structures';
      unitOrder = 1;
    }
  }

  // 4. SOCIAL STUDIES & LIFE SKILLS
  else if (
    lower.startsWith('so') ||
    lower.includes('social') ||
    lower.includes('civic') ||
    lower.includes('constitution') ||
    lower.includes('governance') ||
    lower.includes('geography') ||
    lower.includes('international')
  ) {
    subjectSlug = 'social';
    if (lower.includes('civic') || lower.includes('constitution') || lower.includes('governance') || lower.includes('u5')) {
      unit = 'Unit 5: Civic Awareness & Governance';
      unitOrder = 5;
    } else if (lower.includes('economic') || lower.includes('u6')) {
      unit = 'Unit 6: Economic Development & Finance';
      unitOrder = 6;
    } else if (lower.includes('international') || lower.includes('u7')) {
      unit = 'Unit 7: International Affairs & Peace';
      unitOrder = 7;
    } else if (lower.includes('geography') || lower.includes('earth') || lower.includes('climate') || lower.includes('u8')) {
      unit = 'Unit 8: Geography & Earth Environment';
      unitOrder = 8;
    } else {
      unit = 'Unit 1: We, Our Society & Values';
      unitOrder = 1;
    }
  }

  // 5. SCIENCE & TECHNOLOGY
  else {
    subjectSlug = 'physics';
    if (lower.includes('mitosis') || lower.includes('cell') || lower.includes('dna') || lower.includes('genetics') || lower.includes('heredity') || lower.includes('u4')) {
      unit = 'Unit 4: Heredity & Cell Biology';
      unitOrder = 4;
    } else if (lower.includes('blood') || lower.includes('physiological') || lower.includes('circulation') || lower.includes('gland') || lower.includes('u5')) {
      unit = 'Unit 5: Physiological Structure & Life Processes';
      unitOrder = 5;
    } else if (lower.includes('transformer') || lower.includes('electricity') || lower.includes('magnetism') || lower.includes('u7') || lower.includes('hrt u4')) {
      unit = 'Unit 7: Current Electricity & Magnetism';
      unitOrder = 7;
    } else if (lower.includes('periodic') || lower.includes('block') || lower.includes('u14') || lower.includes('hrt u5')) {
      unit = 'Unit 14: Modern Periodic Table & Classification';
      unitOrder = 14;
    } else if (lower.includes('radical') || lower.includes('reaction') || lower.includes('chemical') || lower.includes('u15')) {
      unit = 'Unit 15: Chemical Reactions & Radicals';
      unitOrder = 15;
    } else if (lower.includes('gas') || lower.includes('ammonia') || lower.includes('carbon dioxide') || lower.includes('u16')) {
      unit = 'Unit 16: Atmospheric Gases (CO₂, NH₃)';
      unitOrder = 16;
    } else if (lower.includes('metal') || lower.includes('iron') || lower.includes('aluminium') || lower.includes('copper') || lower.includes('u17')) {
      unit = 'Unit 17: Metals & Metallurgy';
      unitOrder = 17;
    } else if (lower.includes('daily life') || lower.includes('soap') || lower.includes('detergent') || lower.includes('cement') || lower.includes('chemical used') || lower.includes('u19')) {
      unit = 'Unit 19: Applied Chemicals in Daily Life';
      unitOrder = 19;
    } else {
      unit = 'Unit 1: Force & Gravitation';
      unitOrder = 1;
    }
  }

  // Format clean human-readable title
  let cleanTitle = title;
  cleanTitle = cleanTitle.replace(/^chain of learning video/i, 'Orientation: Concept Mastery & Learning Framework');
  cleanTitle = cleanTitle.replace(/^chain of learning/i, 'Orientation: SEE Preparation Strategy & Chain of Learning');
  cleanTitle = cleanTitle.replace(/^website video/i, 'Orientation: Navigating Video Lectures & AI Marker');
  cleanTitle = cleanTitle.replace(/^gridsheet/i, 'Specification Grid: Board Exam Mark Distribution & Blueprint');
  cleanTitle = cleanTitle.replace(/^SEE-S&T-[A-Z]+-U(\d+)-P(\d+)-?/i, 'Unit $1 Part $2: ');
  cleanTitle = cleanTitle.replace(/^SEE-S&T-EM-[A-Z]+-U(\d+)-P(\d+)\(?/i, 'Unit $1 Part $2: ');
  cleanTitle = cleanTitle.replace(/^SEE-OM-EM-[A-Z]+-U(\d+)-L(\d+)-V(\d+)-?/i, 'Unit $1 Lesson $2 Part $3: ');
  cleanTitle = cleanTitle.replace(/^SEE-OM-EM-[A-Z]+-U(\d+)-V(\d+)-?/i, 'Unit $1 Part $2: ');
  cleanTitle = cleanTitle.replace(/^SEE-OM-EM-[A-Z]+-U(\d+)-P(\d+)-?/i, 'Unit $1 Part $2: ');
  cleanTitle = cleanTitle.replace(/^SEE-OM-EM-\s*[A-Z]+-U(\d+)-P(\d+)-?/i, 'Unit $1 Part $2: ');
  cleanTitle = cleanTitle.replace(/^SEE-CM-[A-Z]+-U(\d+)-L(\d+)-V(\d+)-?/i, 'Unit $1 Lesson $2 Part $3: ');
  cleanTitle = cleanTitle.replace(/^SO\s+U(\d+)\s+L(\d+)\s+/i, 'Unit $1 Lesson $2: ');
  cleanTitle = cleanTitle.replace(/^SO\s+U(\d+)\s+P(\d+)\s+/i, 'Unit $1 Part $2: ');
  cleanTitle = cleanTitle.replace(/^SO\s+L(\d+)\s+V(\d+)\s*/i, 'Lesson $1 Part $2: ');
  cleanTitle = cleanTitle.replace(/^HRT\s+U(\d+)\s+P(\d+)\s*(V\d+)?/i, 'Unit $1 Part $2: ');
  cleanTitle = cleanTitle.replace(/^U(\d+)\s+Set\s*(\d+)?\s*P(\d+)/i, 'Unit $1 Part $3: Sets Problem Solving');
  cleanTitle = cleanTitle.replace(/^U(\d+)\s+P(\d+)/i, 'Unit $1 Part $2');
  cleanTitle = cleanTitle.replace(/^U(\d+)\s+Arithmetic\s+P(\d+)/i, 'Unit $1 Part $2: Arithmetic & Money Exchange');
  cleanTitle = cleanTitle.replace(/^U(\d+)\s+L(\d+)\s+Compound\s+Interest/i, 'Unit $1 Part $2: Compound Interest');
  cleanTitle = cleanTitle.replace(/^compound interest part 1 and part 2/i, 'Unit 2 Part 1: Compound Interest Fundamentals');
  cleanTitle = cleanTitle.replace(/^Unit 15 Radical -p1 and p2/i, 'Unit 15 Part 1: Radicals & Electrovalency');
  cleanTitle = cleanTitle.replace(/^Unit 7 part 2_p1p2p3p4/i, 'Unit 7 Part 2: Current Electricity & Resistance');
  cleanTitle = cleanTitle.replace(/^Genetics Made Easy/i, 'Unit 4 Part 1: Genetics & DNA Structure');
  cleanTitle = cleanTitle.replace(/^Organic Reaction Mechanisms/i, 'Unit 19 Part 1: Organic Reaction Mechanisms');
  cleanTitle = cleanTitle.replace(/^Kinematics\s*—?\s*Full Concept/i, 'Unit 1 Part 1: Kinematics & Laws of Motion');
  cleanTitle = cleanTitle.replace(/^Q\.?\s*NO\s*(\d+)\s*/i, 'Q$1: ');
  cleanTitle = cleanTitle.replace(/^Q(\d+)\s*-\s*EM\s*-\s*[A-Z]+\s*-\s*/i, 'Q$1: ');
  cleanTitle = cleanTitle.replace(/^Q(\d+)\s*-\s*STORY\s*-\s*V\s*(\d+)\s*-\s*/i, 'Q$1 Story Part $2: ');
  cleanTitle = cleanTitle.replace(/_1$|_new$|_001_new$|_002_new$|_NEW01$/i, '');
  cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
  cleanTitle = cleanTitle.replace(/\s*:\s*$/, '');

  const pMatch = cleanTitle.match(/Part\s*(\d+)|Lesson\s*(\d+)|V(\d+)|P(\d+)/i);
  if (pMatch) {
    part = parseInt(pMatch[1] || pMatch[2] || pMatch[3] || pMatch[4] || '1', 10);
  }

  return { subjectSlug, unit, unitOrder, cleanTitle, part };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await context.params;
    if (!lessonId) {
      return NextResponse.json({ error: 'Missing lesson ID' }, { status: 400 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const user = await getSessionUser();

    // 1. Fetch lesson details from see_lessons or video_lectures
    let lesson: any = null;
    const { data: seeLesson } = await admin
      .from('see_lessons')
      .select('*')
      .eq('id', lessonId)
      .maybeSingle();

    if (seeLesson) {
      lesson = seeLesson;
    } else {
      const { data: vid } = await admin
        .from('video_lectures')
        .select('*')
        .eq('id', lessonId)
        .maybeSingle();

      if (vid) {
        const res = cleanAndCategorize(vid.title);
        const guidMatch = (vid.video_url || '').match(/([0-9a-fA-F-]{36})/);
        const guid = guidMatch ? guidMatch[1] : '';

        lesson = {
          id: vid.id,
          course_id: 'see_class_10',
          subject_slug: res.subjectSlug,
          chapter_name: res.unit,
          title: res.cleanTitle,
          description: vid.description || `HD Video Lecture (${Math.round((vid.duration_sec || 0) / 60)} mins)`,
          video_url: vid.video_url,
          embed_url: guid ? `https://iframe.mediadelivery.net/embed/379737/${guid}?autoplay=true&loop=false&muted=false&preload=true&responsive=true` : '',
          thumbnail_url: vid.thumbnail_url || (guid ? `https://vz-11253e6e-275.b-cdn.net/${guid}/thumbnail.jpg` : ''),
          duration_sec: vid.duration_sec || 900,
          lesson_order: res.unitOrder * 100 + res.part,
          is_free: true,
          is_published: true,
        };
      }
    }

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found or unavailable' }, { status: 404 });
    }

    // 2. Retrieve user watch progress if logged in
    let progress = {
      watched_seconds: 0,
      total_duration_sec: lesson.duration_sec || 900,
      percentage: 0,
      is_completed: false,
    };

    if (user?.id) {
      const { data: userProg } = await admin
        .from('user_video_progress')
        .select('watched_seconds, total_duration_sec, percentage, is_completed')
        .eq('user_id', user.id)
        .eq('lesson_id', lesson.id)
        .maybeSingle();

      if (userProg) {
        progress = {
          watched_seconds: userProg.watched_seconds || 0,
          total_duration_sec: userProg.total_duration_sec || lesson.duration_sec || 900,
          percentage: userProg.percentage || 0,
          is_completed: userProg.is_completed || false,
        };
      }
    }

    return NextResponse.json({
      lesson: {
        ...lesson,
        is_free: true,
      },
      isLocked: false,
      progress,
      navigation: {
        prevLesson: null,
        nextLesson: null,
      },
    });
  } catch (err: any) {
    console.error('API /api/see/lessons/[id] error:', err);
    return NextResponse.json({ error: 'Failed to load lesson', details: err?.message }, { status: 500 });
  }
}
