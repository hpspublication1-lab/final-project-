# Editable System Flowcharts (Mermaid)

## Master architecture
```mermaid
flowchart TB
 subgraph CLIENT[Clients]
  WEB[Student Web] & MOB[Mobile] & ADM[Admin CMS] & TCH[Teacher]
 end
 subgraph ACCESS[Access]
  API[API Gateway] --> AUTH[Auth and Scoped RBAC]
 end
 subgraph CORE[Academic Core]
  SYL[Program and Syllabus] --> CUR[Curriculum] --> LES[Lesson Revisions]
  REV[Academic Review] --> PUB[Immutable Publishing]
 end
 subgraph VIS[Visual Intelligence]
  PLAYER[Universal Player] --> THREE[3D Anatomy]
  PLAYER --> SVG[2D Diagrams]
  PLAYER --> SIM[Simulations]
  PLAYER --> TIME[Timeline and Hotspots]
 end
 subgraph ASSET[Asset Factory]
  UP[Quarantine Upload] --> SCAN[Security Scan] --> OPT[Optimize] --> MAN[Manifest and Versions]
 end
 subgraph DATA[Persistence]
  DB[(Database)]
  STORE[(Object Storage)]
  Q[Job Queue]
 end
 WEB --> API
 MOB --> API
 ADM --> API
 TCH --> API
 AUTH --> CUR
 AUTH --> REV
 CUR --> DB
 LES --> REV
 REV --> PUB
 PUB --> PLAYER
 UP --> Q
 MAN --> STORE
 STORE --> PLAYER
 PLAYER --> PROG[Validated Progress]
 PROG --> DB
```

## Curriculum isolation
```mermaid
flowchart TD
 SG[Samyak Guru] --> CEE[CEE]
 SG --> IELTS[IELTS]
 SG --> IOE[IOE]
 SG --> SEE[SEE]
 SG --> NEB[NEB]
 CEE --> SYL[Verified CEE Syllabus]
 SYL --> BIO[Biology]
 SYL --> CHEM[Chemistry]
 SYL --> PHY[Physics]
 SYL --> MAT[Mental Agility]
 BIO --> HUMAN[Human Physiology] --> HEART[Heart Lesson]
 HEART --> MODEL[Approved Asset Version]
 HEART --> QUIZ[Approved Question Revisions]
 IELTS --> IONLY[Separate IELTS Content]
 IOE --> EONLY[Separate IOE Content]
```

## Scientific asset factory
```mermaid
flowchart TD
 A[Verified Topic] --> B[Learning Objectives] --> C[Scientific Research] --> D[Storyboard]
 D --> E{Asset Type}
 E -->|3D| F[Blender GLB]
 E -->|2D| G[SVG Rive]
 E -->|Simulation| H[Equation Engine]
 F --> I[Scientific Review]
 G --> I
 H --> I
 I --> J[Hotspots Timeline Captions Fallback]
 J --> K[Quarantine Upload] --> L[Scan and Validate]
 L --> M{Safe and Valid}
 M -->|No| J
 M -->|Yes| N[Optimize and Manifest]
 N --> O[Expert and Rights Review]
 O --> P{Approved}
 P -->|No| D
 P -->|Yes| Q[Immutable Publication]
 Q --> R[Student Player] --> S[Learning Analytics]
```

## Asset upload sequence
```mermaid
sequenceDiagram
 participant E as Editor
 participant A as API
 participant S as Quarantine
 participant W as Worker
 participant D as Database
 participant R as Reviewer
 E->>A: Initialize upload
 A->>A: Check scope and quota
 A-->>E: Expiring upload authorization
 E->>S: Upload bytes
 E->>A: Complete upload
 A->>S: Verify size and checksum
 A->>W: Queue scan and optimization
 W->>W: Scan, parse, compress, fallback
 W->>D: Record immutable asset version
 R->>A: Review exact version
 A->>D: Save approval decision
 Note over A,D: Publication requires lesson, rights and accessibility approval too
```

## Review state machine
```mermaid
stateDiagram-v2
 [*] --> Draft
 Draft --> InReview: Submit
 InReview --> ChangesRequested: Reject
 ChangesRequested --> Draft: Revise
 InReview --> Approved: All gates pass
 Approved --> Published: Authorized publisher
 Published --> Superseded: Publish replacement
 Published --> Archived: Archive
```

## Student learning pipeline
```mermaid
flowchart TD
 A[Select CEE Program] --> B[Subject Topic Lesson] --> C{Authorized and Published}
 C -->|No| D[Access or Empty State]
 C -->|Yes| E[Load Manifest] --> F{3D Supported}
 F -->|Yes| G[Interactive Visual]
 F -->|No| H[Accessible Fallback]
 G --> I[Guided Explanation]
 H --> I
 I --> J[Visual Practice] --> K[Approved MCQs]
 K --> L[Server Scoring] --> M[Feedback and Revision]
 M --> N[Validated Progress]
```

## Sprint critical path
```mermaid
flowchart LR
 AUD[Audit] --> ARCH[Architecture and RBAC] --> DB[Curriculum Schema]
 DB --> ASSET[Upload and Manifest] --> PLAYER[Visual Player]
 DB --> CMS[Lesson CMS]
 PLAYER --> REVIEW[Review and Publication]
 CMS --> REVIEW
 REVIEW --> MOB[Mobile and Progress] --> TEST[Security E2E Performance] --> STAGE[Staging Pilot]
```
