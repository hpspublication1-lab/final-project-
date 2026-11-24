import { describe, it, expect } from 'vitest';
import {
  validateVisualManifest,
  isAllowedAssetOrigin,
  type VisualAssetManifest,
} from '../manifestSchema';
import { ROLE_PERMISSIONS } from '@/lib/auth/rbac';

describe('CEE Visual Asset Manifest Schema (FND-005)', () => {
  const valid3DManifest: VisualAssetManifest = {
    schemaVersion: '1.0',
    assetId: 'ast_heart_3d',
    assetVersionId: 'ast_ver_01',
    kind: 'MODEL_3D',
    title: 'Human Heart 3D Anatomical Explorer',
    sourceUrl: 'https://assets.samyakcee.com/models/heart_v1_opt.glb',
    fallbackUrl: '/art/heart.png',
    thumbnailUrl: '/art/heart-thumb.png',
    checksumSha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    model: {
      format: 'glb',
      initialCamera: {
        position: [0, 0, 4],
        target: [0, 0, 0],
      },
      layers: ['external_vessels', 'atria', 'ventricles', 'valves'],
      animations: ['cardiac_cycle_loop'],
      explodedViewAvailable: true,
      clippingAvailable: true,
    },
    hotspots: [
      {
        id: 'hp_ra',
        label: 'Right Atrium',
        targetNode: 'Chamber_RA',
        position: [0.4, 0.2, 0.1],
        explanation: 'Receives deoxygenated blood from venae cavae.',
      },
      {
        id: 'hp_lv',
        label: 'Left Ventricle',
        targetNode: 'Chamber_LV',
        position: [-0.3, -0.4, 0.2],
        explanation: 'Pumps oxygenated blood to the aorta at systemic arterial pressure.',
      },
    ],
    accessibility: {
      description: 'Interactive 3D model of human heart demonstrating systemic circulation and valve dynamics.',
      reducedMotionSupported: true,
      screenReaderKeyPoints: [
        'Four chambers: two atria and two ventricles',
        'Tricuspid and bicuspid (mitral) atrioventricular valves prevent backflow',
      ],
    },
    tags: ['circulatory_system', 'human_physiology', 'cardiology'],
  };

  it('should successfully validate a complete, canonical 3D model manifest', () => {
    const result = validateVisualManifest(valid3DManifest);
    expect(result.success).toBe(true);
    expect(result.data?.title).toBe('Human Heart 3D Anatomical Explorer');
    expect(result.data?.hotspots).toHaveLength(2);
  });

  it('should validate a 2D biological simulation manifest', () => {
    const simulationManifest: VisualAssetManifest = {
      schemaVersion: '1.0',
      assetId: 'ast_gas_exchange_2d',
      assetVersionId: 'ast_ver_01',
      kind: 'SIMULATION',
      title: 'Alveolar Gas Exchange Simulation',
      sourceUrl: '/art/alveoli.png',
      fallbackUrl: '/art/alveoli.png',
      checksumSha256: '1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
      simulation: {
        engine: 'stage_drift',
        playbackModes: ['forward', 'loop'],
        defaultSpeed: 1,
        steps: [
          {
            label: 'Oxygenation',
            note: 'Oxygen drifts from alveolus into deoxygenated capillary blood.',
            drift: 'to-blood',
          },
          {
            label: 'Decarboxylation',
            note: 'Carbon dioxide leaves the plasma and diffuses into alveolar air.',
            drift: 'to-air',
          },
        ],
      },
      hotspots: [
        {
          id: 'hp_capillary',
          label: 'Pulmonary Capillary',
          explanation: 'Thin-walled capillary with single-cell endothelial boundary.',
        },
      ],
      accessibility: {
        description: 'Simulation showing diffusion of O2 and CO2 across the alveolar-capillary membrane.',
        reducedMotionSupported: true,
        screenReaderKeyPoints: [],
      },
      tags: ['respiration', 'pulmonology'],
    };

    const result = validateVisualManifest(simulationManifest);
    expect(result.success).toBe(true);
    expect(result.data?.kind).toBe('SIMULATION');
    expect(result.data?.simulation?.steps).toHaveLength(2);
  });

  it('should reject manifest with invalid schemaVersion', () => {
    const invalid = { ...valid3DManifest, schemaVersion: '2.0' };
    const result = validateVisualManifest(invalid);
    expect(result.success).toBe(false);
    expect(result.errors?.some((e) => e.includes('schemaVersion'))).toBe(true);
  });

  it('should reject manifest with checksum length not equal to 64', () => {
    const invalid = { ...valid3DManifest, checksumSha256: 'too-short-hash' };
    const result = validateVisualManifest(invalid);
    expect(result.success).toBe(false);
    expect(result.errors?.some((e) => e.includes('checksumSha256'))).toBe(true);
  });

  it('should validate allowed asset origins', () => {
    // Relative paths are always allowed
    expect(isAllowedAssetOrigin('/art/heart.png')).toBe(true);
    // Allowed CDNs
    expect(isAllowedAssetOrigin('https://assets.samyakcee.com/models/heart.glb')).toBe(true);
    expect(isAllowedAssetOrigin('https://zqkmrrckuvabtdfyrywm.supabase.co/storage/v1/object/public/models/heart.glb')).toBe(true);
    // Disallowed external origins
    expect(isAllowedAssetOrigin('https://evil-untrusted-cdn.com/malicious.glb')).toBe(false);
    expect(isAllowedAssetOrigin('javascript:alert(1)')).toBe(false);
  });
});

describe('CEE Visual Intelligence RBAC Scopes (FND-002)', () => {
  it('should grant visual:read to all student tiers', () => {
    expect(ROLE_PERMISSIONS.student_free.has('visual:read')).toBe(true);
    expect(ROLE_PERMISSIONS.student_paid_cee.has('visual:read')).toBe(true);
    expect(ROLE_PERMISSIONS.student_all_access.has('visual:read')).toBe(true);
  });

  it('should deny visual authoring and review to students', () => {
    expect(ROLE_PERMISSIONS.student_free.has('visual:author')).toBe(false);
    expect(ROLE_PERMISSIONS.student_paid_cee.has('visual:author')).toBe(false);
    expect(ROLE_PERMISSIONS.student_free.has('visual:publish')).toBe(false);
  });

  it('should grant visual authoring to content managers and teachers', () => {
    expect(ROLE_PERMISSIONS.content_manager.has('visual:author')).toBe(true);
    expect(ROLE_PERMISSIONS.teacher.has('visual:author')).toBe(true);
  });

  it('should grant visual review to teachers', () => {
    expect(ROLE_PERMISSIONS.teacher.has('visual:review')).toBe(true);
  });

  it('should restrict visual publishing to admins and super admins', () => {
    expect(ROLE_PERMISSIONS.teacher.has('visual:publish')).toBe(false);
    expect(ROLE_PERMISSIONS.content_manager.has('visual:publish')).toBe(false);
    expect(ROLE_PERMISSIONS.admin.has('visual:publish')).toBe(true);
    expect(ROLE_PERMISSIONS.super_admin.has('visual:publish')).toBe(true);
  });
});
