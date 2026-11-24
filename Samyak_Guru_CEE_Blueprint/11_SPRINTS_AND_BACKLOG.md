# Engineering Sprints, Dependencies and Roadmap

**Estimates are illustrative** and must be recalibrated after repository audit and team capacity assessment.

## Phase 0 — Discovery (before implementation)
AUD-001 repository audit; AUD-002 inventory and dependency graph; AUD-003 existing-data integrity assessment; AUD-004 stack/architecture decisions; AUD-005 migration and rollback proposal; AUD-006 evidence-backed completion baseline. Outputs: `PROJECT_AUDIT.md`, `CURRENT_ARCHITECTURE.md`, `FEATURE_INVENTORY.md`, `GAP_ANALYSIS.md`, `RISK_REGISTER.md`.

## Foundation — Four one-week planning sprints
### Week 1: Architecture, data, security
- FND-001 Audit existing repository (tech lead; prerequisite all work).
- FND-002 Document architecture decisions and reuse plan.
- FND-003 Implement additive curriculum schema with migrations.
- FND-004 Implement scoped curriculum read APIs.
- FND-005 Define scoped RBAC and server enforcement.
- FND-006 CI, test database and migrations dry-run.
**Exit:** schema/API/RBAC tested; no unrelated data changed.

### Week 2: Asset pipeline and player
- FND-007 Asset identity/version records.
- FND-008 Quarantine uploads, scan, processing workers.
- FND-009 Manifest schema and validators.
- FND-010 VisualPlayerShell and GLB renderer.
- FND-011 Error states and accessible fallback.
- FND-012 Admin asset library and preview.
**Exit:** safe development asset uploaded, validated, previewed, rendered and falls back gracefully.

### Week 3: Academic CMS
- FND-013 Draft lesson editor.
- FND-014 Revision history and immutability.
- FND-015 Expert review queue and decisions.
- FND-016 Transactional publication state machine.
- FND-017 Scoped audit logs and authorization tests.
- FND-018 Curriculum-to-lesson mapping validation.
**Exit:** editor → reviewer → publisher → student flow tested in staging.

### Week 4: Mobile, progress and release
- FND-019 Flutter WebView bridge (if compatible).
- FND-020 Validated progress events.
- FND-021 Integration and E2E suite.
- FND-022 Reference Android benchmarks.
- FND-023 Security and accessibility QA.
- FND-024 Staging deployment, monitoring and rollback plan.
**Exit:** verified Foundation vertical slice, documented limitations and next phase approval.

## Future phases
- **Biology pilot:** Human Heart, Nephron, Mitosis/Meiosis, DNA Replication, Photosynthesis; content production and academic review are independent resource dependencies.
- **Chemistry/Physics:** molecular viewer, organic reactions, equilibrium, circuits, optics, photoelectric effect.
- **Advanced:** AI tutor grounded in approved content, adaptive revision, offline packs, mentor/teacher tools, performance and scale.

## Dependency critical path
Repository audit → architecture/schema → curriculum+RBAC → asset pipeline+manifest → player → CMS+review → publication → mobile+progress → E2E/security → staging pilot. Parallelize only after interface contracts are agreed.

## Backlog record format
`ID | requirement | existing code reference | status | owner | priority | dependencies | acceptance criteria | tests | effort | blocker | PR/commit evidence`.
