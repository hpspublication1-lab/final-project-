import React from 'react';
import { notFound } from 'next/navigation';
import VisualLessonClient from './client';
import { type VisualAssetManifest } from '@/lib/cee/visual/manifestSchema';
import { type PracticeQuestion } from '@/components/visual/VisualQuizCard';

interface VisualLessonPayload {
  lessonId: string;
  title: string;
  slug: string;
  subject: string;
  chapter: string;
  topic: string;
  objectives: string[];
  manifest: VisualAssetManifest;
  practiceQuestions: PracticeQuestion[];
}

/**
 * Verified Human Heart Pilot Lesson Snapshot
 */
const CANONICAL_PILOT_LESSON: VisualLessonPayload = {
  lessonId: 'les_human_heart',
  title: 'Human Heart: Chamber Anatomy, Valve Mechanics & Cardiac Cycle',
  slug: 'human-heart',
  subject: 'Biology — Zoology',
  chapter: 'Human Physiology',
  topic: 'Circulatory System & Cardiac Dynamics',
  objectives: [
    'Identify the 4 chambers (Right Atrium, Right Ventricle, Left Atrium, Left Ventricle) and great vessels',
    'Trace deoxygenated venous return through pulmonary circulation and systemic ejection into the aorta',
    'Correlate atrioventricular (tricuspid, bicuspid) and semilunar (aortic, pulmonary) valve states across systole and diastole',
    'Identify the anatomical landmarks of the cardiac pacemaker and conduction pathways',
  ],
  manifest: {
    schemaVersion: '1.0',
    assetId: 'ast_heart_visual',
    assetVersionId: 'ast_ver_heart_01',
    kind: 'SIMULATION',
    title: 'Human Heart Anatomy & Hemodynamics Explorer',
    sourceUrl: '/art/heart.png',
    fallbackUrl: '/art/heart.png',
    thumbnailUrl: '/art/heart-thumb.png',
    checksumSha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    model: {
      format: 'glb',
      initialCamera: { position: [0, 0, 4], target: [0, 0, 0] },
      layers: ['myocardium', 'atria', 'ventricles', 'valves', 'great_vessels'],
      animations: ['cardiac_cycle_loop'],
      explodedViewAvailable: true,
      clippingAvailable: true,
    },
    simulation: {
      engine: 'cardiac_cycle',
      playbackModes: ['forward', 'loop'],
      defaultSpeed: 1,
      steps: [
        {
          label: 'Joint Diastole (Passive Ventricular Filling)',
          note: 'Atria and ventricles are relaxed. Deoxygenated and oxygenated blood enter atria and passively flow through open AV valves (70% filling).',
          drift: 'along',
        },
        {
          label: 'Atrial Systole',
          note: 'SA node depolarizes, atria contract, pumping the remaining 30% of blood into ventricles.',
          drift: 'pulse',
        },
        {
          label: 'Isovolumetric Ventricular Contraction',
          note: 'Ventricles contract, pressure rises, AV valves snap shut producing the FIRST heart sound (LUB / S1). All valves temporarily closed.',
          drift: 'pulse',
        },
        {
          label: 'Ventricular Ejection',
          note: 'Ventricular pressure exceeds aortic/pulmonary trunk pressure. Semilunar valves open; blood surges into pulmonary artery and aorta.',
          drift: 'circulation',
        },
        {
          label: 'Isovolumetric Ventricular Relaxation',
          note: 'Ventricles relax, arterial pressure closes semilunar valves producing the SECOND heart sound (DUB / S2).',
          drift: 'along',
        },
      ],
    },
    hotspots: [
      {
        id: 'hp_ra',
        label: 'Right Atrium (RA)',
        explanation: 'Receives deoxygenated venous return from SVC, IVC, and coronary sinus. Houses the Sinoatrial (SA) Node in its anterolateral wall.',
        position: [0.35, 0.25, 0.1],
      },
      {
        id: 'hp_rv',
        label: 'Right Ventricle (RV)',
        explanation: 'Crescent-shaped chamber with moderately thick muscular wall. Ejects deoxygenated blood through the pulmonary valve into the pulmonary trunk.',
        position: [0.2, -0.2, 0.15],
      },
      {
        id: 'hp_la',
        label: 'Left Atrium (LA)',
        explanation: 'Smooth-walled posterior cardiac chamber receiving oxygenated blood directly from four pulmonary veins (two right, two left).',
        position: [-0.3, 0.25, 0.05],
      },
      {
        id: 'hp_lv',
        label: 'Left Ventricle (LV)',
        explanation: 'Conical chamber with 3x thicker myocardium than the RV. Generates systemic systolic pressure (approx 120 mmHg) to pump blood through the aorta.',
        position: [-0.25, -0.3, 0.2],
      },
      {
        id: 'hp_aorta',
        label: 'Aorta (Ascending & Arch)',
        explanation: 'Largest systemic artery in the human body. Arises from the LV, gives off coronary arteries at its base, and distributes blood to systemic circulation.',
        position: [-0.05, 0.45, 0.1],
      },
      {
        id: 'hp_valves',
        label: 'Atrioventricular Valves (Tricuspid & Bicuspid/Mitral)',
        explanation: 'Tricuspid on right (3 cusps), Bicuspid/Mitral on left (2 cusps). Anchored by fibrous chordae tendineae to papillary muscles to prevent valve eversion during systole.',
        position: [0.0, -0.05, 0.1],
      },
    ],
    accessibility: {
      description: 'Detailed anatomical depiction of the human heart showing internal chambers, valve dynamics, and the directional flow of systemic and pulmonary blood.',
      reducedMotionSupported: true,
      screenReaderKeyPoints: [
        'Heart has four muscular chambers: two superior atria and two inferior ventricles',
        'Right side handles deoxygenated blood; Left side handles oxygenated blood',
        'First heart sound (LUB) is caused by closure of AV valves; Second heart sound (DUB) by closure of semilunar valves',
      ],
    },
    tags: ['circulatory_system', 'cardiology', 'human_physiology', 'cee_biology'],
  },
  practiceQuestions: [
    {
      id: 'q_heart_01',
      prompt: 'During ventricular systole in a healthy human heart, which of the following valve states is observed?',
      choices: [
        { id: 'a', text: 'Atrioventricular valves closed, semilunar valves open' },
        { id: 'b', text: 'Atrioventricular valves open, semilunar valves closed' },
        { id: 'c', text: 'Both atrioventricular and semilunar valves remain open' },
        { id: 'd', text: 'Both atrioventricular and semilunar valves remain closed throughout' },
      ],
      correctAnswer: 'a',
      explanation: 'During the ejection phase of ventricular systole, high intraventricular pressure forces the semilunar valves (aortic and pulmonary) open, while the atrioventricular valves (tricuspid and mitral) remain firmly closed to prevent backflow into the atria.',
      linkedHotspotId: 'hp_valves',
    },
    {
      id: 'q_heart_02',
      prompt: 'Which chamber of the human heart has the thickest muscular wall and why?',
      choices: [
        { id: 'a', text: 'Left Ventricle, because it must generate high pressure to pump blood throughout the systemic circulation' },
        { id: 'b', text: 'Right Ventricle, because it must overcome high resistance in the pulmonary capillary bed' },
        { id: 'c', text: 'Left Atrium, because it receives blood from four separate pulmonary veins' },
        { id: 'd', text: 'Right Atrium, because it receives systemic venous return from both venae cavae' },
      ],
      correctAnswer: 'a',
      explanation: 'The myocardium of the Left Ventricle is approximately 3 times thicker than that of the Right Ventricle because it must pump blood against systemic peripheral vascular resistance (mean arterial pressure ~93 mmHg vs pulmonary pressure ~15 mmHg).',
      linkedHotspotId: 'hp_lv',
    },
    {
      id: 'q_heart_03',
      prompt: 'The primary pacemaker of the human heart (Sinoatrial node) is anatomically located in the wall of which structure?',
      choices: [
        { id: 'a', text: 'Right Atrium, near the opening of the superior vena cava' },
        { id: 'b', text: 'Left Ventricle, near the interventricular septum' },
        { id: 'c', text: 'Interatrial septum, near the coronary sinus orifice' },
        { id: 'd', text: 'Left Atrium, between the pulmonary veins' },
      ],
      correctAnswer: 'a',
      explanation: 'The SA node (pacemaker) is situated in the upper posterolateral wall of the right atrium, immediately adjacent to the entrance of the superior vena cava.',
      linkedHotspotId: 'hp_ra',
    },
  ],
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === 'human-heart') {
    return {
      title: 'Human Heart 3D Visual Intelligence — Samyak CEE Mastery',
      description: 'Explore human cardiac anatomy, chambers, valves, and systemic circulation with interactive simulations.',
    };
  }
  return {
    title: 'Visual Lesson — Samyak CEE Mastery',
  };
}

export default async function VisualLessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Currently only approved published pilot lessons are rendered
  if (slug !== 'human-heart') {
    notFound();
  }

  return <VisualLessonClient lesson={CANONICAL_PILOT_LESSON} />;
}
