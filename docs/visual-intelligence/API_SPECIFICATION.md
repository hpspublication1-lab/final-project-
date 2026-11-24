# Samyak Guru — CEE Visual Intelligence: API Specification (AUD-005)

**API Prefix**: `/api/v1/cee` (or `/api/cee/*` Next.js route handlers)  
**Security**: Scoped RBAC, Session Validation, Token-Bucket Rate Limiter, Idempotency  
**Date**: November 23, 2026

---

## 1. Response Standard

### Standard Success Response (200 / 201)
```json
{
  "data": {},
  "meta": {
    "requestId": "req_01HA89Z...",
    "timestamp": "2026-11-23T16:00:00Z"
  }
}
```

### Standard Error Response (4xx / 5xx)
```json
{
  "error": {
    "code": "ACADEMIC_APPROVAL_REQUIRED",
    "message": "Lesson revision cannot be published without Director approval.",
    "details": {}
  },
  "meta": {
    "requestId": "req_01HA89Z...",
    "timestamp": "2026-11-23T16:00:00Z"
  }
}
```

---

## 2. Curriculum & Syllabus Endpoints

### 1. `GET /api/v1/cee/syllabi/:id/tree`
- **Scope**: Student (`content:read`)
- **Description**: Returns verified subject/chapter/topic hierarchy for active syllabus snapshot.
- **Response**:
```json
{
  "data": {
    "syllabusId": "syl_cee_2082",
    "label": "CEE Medical Entrance Syllabus 2082/2083",
    "subjects": [
      {
        "id": "sub_bio",
        "code": "BIO",
        "name": "Biology (Zoology & Botany)",
        "chapters": [
          {
            "id": "chap_human_phys",
            "title": "Human Physiology",
            "topics": [
              {
                "id": "top_circulatory",
                "title": "Circulatory System",
                "publishedLessonsCount": 4
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### 2. `POST /api/v1/cee/admin/curriculum/nodes`
- **Scope**: Content Manager / Admin (`content:create`)
- **Body**: `{ "syllabusVersionId": "...", "subjectId": "...", "parentId": "...", "nodeType": "TOPIC", "title": "..." }`

---

## 3. Lessons & Revisions Endpoints

### 1. `GET /api/v1/cee/lessons/:slug`
- **Scope**: Student (`content:read`)
- **Description**: Returns active published snapshot of lesson including pinned asset manifests and objectives.
- **Response**:
```json
{
  "data": {
    "lessonId": "les_heart",
    "title": "Human Heart & Cardiac Dynamics",
    "slug": "human-heart",
    "publicationId": "pub_heart_v1",
    "revisionNumber": 1,
    "objectives": [
      "Identify the 4 chambers and major cardiac vessels",
      "Trace systemic and pulmonary blood flow pathways",
      "Correlate valve states during systolic and diastolic phases"
    ],
    "assets": [
      {
        "assetId": "ast_heart_3d",
        "kind": "MODEL_3D",
        "manifestUrl": "/api/v1/cee/assets/ast_heart_3d/manifest"
      }
    ],
    "practiceSetId": "qset_heart_01"
  }
}
```

### 2. `POST /api/v1/cee/admin/lesson-revisions/:id/submit`
- **Scope**: Content Manager / Teacher (`content:edit`)
- **Description**: Transitions revision state from `DRAFT` to `IN_REVIEW`.

### 3. `POST /api/v1/cee/admin/lesson-revisions/:id/publish`
- **Scope**: Academic Director / Super Admin (`content:publish`)
- **Description**: Executes transactional publication snapshot and invalidates student caches.

---

## 4. Visual Asset & Manifest Endpoints

### 1. `GET /api/v1/cee/assets/:id/manifest`
- **Scope**: Student (`content:read` - published only) / Admin (draft preview with token)
- **Description**: Delivers validated runtime manifest for 3D/2D visual player.
- **Response**:
```json
{
  "schemaVersion": "1.0",
  "assetId": "ast_heart_3d",
  "assetVersionId": "ast_ver_01",
  "kind": "MODEL_3D",
  "title": "Human Heart 3D Anatomical Explorer",
  "sourceUrl": "https://assets.samyakcee.com/models/heart_v1_opt.glb",
  "fallbackUrl": "/art/heart.png",
  "checksumSha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
  "model": {
    "format": "glb",
    "initialCamera": { "position": [0, 0, 4], "target": [0, 0, 0] },
    "layers": ["external_vessels", "atria", "ventricles", "valves"],
    "animations": ["cardiac_cycle_loop", "coronary_flow"]
  },
  "hotspots": [
    { "id": "hp_ra", "label": "Right Atrium", "targetNode": "Chamber_RA", "position": [0.4, 0.2, 0.1], "explanation": "Receives deoxygenated blood from superior and inferior venae cavae." },
    { "id": "hp_lv", "label": "Left Ventricle", "targetNode": "Chamber_LV", "position": [-0.3, -0.4, 0.2], "explanation": "Thick muscular wall pumps oxygenated blood into aorta at high pressure." }
  ],
  "accessibility": {
    "description": "High-definition 3D model of human heart demonstrating systemic circulation and valve dynamics.",
    "reducedMotionSupported": true
  }
}
```

---

## 5. Progress & Telemetry Endpoints

### 1. `POST /api/v1/cee/me/lessons/:id/events`
- **Scope**: Student (`tests:attempt`)
- **Headers**: `Idempotency-Key: <UUID>`
- **Body**:
```json
{
  "eventId": "evt_01HA89...",
  "publicationId": "pub_heart_v1",
  "assetVersionId": "ast_ver_01",
  "type": "HOTSPOT_INSPECTED",
  "occurredAt": "2026-11-23T16:05:00Z",
  "metadata": { "hotspotId": "hp_lv", "dwellMs": 3400 }
}
```
- **Response**: `{ "data": { "recorded": true, "eventsReceived": 1 } }`
