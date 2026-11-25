# CEE VISUAL INTELLIGENCE — ACADEMIC ASSET PROVENANCE & LICENCE REGISTER
**Target Pull Request**: PR #6 (`origin/feat/cee-visual-foundation`)
**Baseline Commit SHA**: `1a01ca713b7751ac6ae8827984944049e9cf45a6`
**Verification Worktree**: `D:\FR\worktrees\cee-foundation-verification`
**Lead Auditor**: Independent Academic Quality & IP Compliance Auditor
**Audit Date**: November 25, 2026
**Overall Classification**: `ASSET PROVENANCE & IP AUDIT`

---

## 1. Executive Summary & Policy on Unverified Assets

Academic rigor and copyright compliance mandate that no visual, anatomical, or pedagogical media may be served to paying or enrolled students without verified provenance, clear intellectual property ownership, and commercial-use rights.

In accordance with PR #6 policy:
- All assets lacking verified chain-of-title or provenance are classified as **`UNVERIFIED`**.
- All `UNVERIFIED` assets are strictly excluded from public publication.
- Claude Opus moved all pilot lesson JSON payloads to `content/cee-visual-drafts/unreviewed-pilot-lessons.json` and tagged them as `UNREVIEWED_DRAFT` until passing the 6 CMS review gates.

---

## 2. Complete Asset Inventory (`public/art` & `public/images/studio`)

| File Path | Description | Stored Size | Provenance / Original Source | Declared Licence | Commercial Use | Rights Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `public/art/alveoli-card.png` | Alveolar sac diagram card | 160.1 KB | Unknown / Web crawl | Unknown | Prohibited | `UNVERIFIED` |
| `public/art/alveoli-quiz.png` | Gas exchange quiz illustration | 141.8 KB | Unknown / Web crawl | Unknown | Prohibited | `UNVERIFIED` |
| `public/art/alveoli.png` | High-res alveolar diffusion | 308.8 KB | Unknown / Web crawl | Unknown | Prohibited | `UNVERIFIED` |
| `public/art/brain.png` | Human brain lateral diagram | 37.7 KB | Unknown / Icon set | Unknown | Prohibited | `UNVERIFIED` |
| `public/art/droplet.png` | Blood droplet icon | 35.2 KB | Vector icon export | Unknown | Prohibited | `UNVERIFIED` |
| `public/art/excrete.png` | Excretory system overview | 44.6 KB | Unknown / Web crawl | Unknown | Prohibited | `UNVERIFIED` |
| `public/art/eye.png` | Human eye anatomical sagittal | 31.4 KB | Unknown / Web crawl | Unknown | Prohibited | `UNVERIFIED` |
| `public/art/heart-card.png` | Heart card preview graphic | 158.6 KB | Unknown / Web crawl | Unknown | Prohibited | `UNVERIFIED` |
| `public/art/heart-quiz.png` | Cardiac cycle quiz prompt | 111.5 KB | Unknown / Web crawl | Unknown | Prohibited | `UNVERIFIED` |
| `public/art/heart-thumb.png` | Heart thumbnail icon | 48.2 KB | Unknown / Web crawl | Unknown | Prohibited | `UNVERIFIED` |
| `public/art/heart.png` | Anterior heart chambers | 228.9 KB | Unknown / Web crawl | Unknown | Prohibited | `UNVERIFIED` |
| `public/art/kidney.png` | Renal gross morphology | 150.9 KB | Unknown / Web crawl | Unknown | Prohibited | `UNVERIFIED` |
| `public/art/lungs.png` | Bronchial tree & lobes | 55.0 KB | Unknown / Web crawl | Unknown | Prohibited | `UNVERIFIED` |
| `public/art/nephron.png` | Nephron tubule & glomerulus | 267.6 KB | Unknown / Web crawl | Unknown | Prohibited | `UNVERIFIED` |
| `public/art/neuron.png` | Multipolar motor neuron | 39.8 KB | Unknown / Web crawl | Unknown | Prohibited | `UNVERIFIED` |
| `public/art/osmo.png` | Osmoregulation schematic | 41.1 KB | Unknown / Web crawl | Unknown | Prohibited | `UNVERIFIED` |
| `public/art/rbc.png` | Erythrocyte biconcave disc | 38.7 KB | Unknown / Web crawl | Unknown | Prohibited | `UNVERIFIED` |
| `public/art/reflex.png` | Reflex arc spinal cross-section| 31.0 KB | Unknown / Web crawl | Unknown | Prohibited | `UNVERIFIED` |
| `public/art/synapse-quiz.png` | Synaptic cleft quiz illustration| 117.5 KB | Unknown / Web crawl | Unknown | Prohibited | `UNVERIFIED` |
| `public/art/synapse.png` | Neurotransmitter exocytosis | 278.5 KB | Unknown / Web crawl | Unknown | Prohibited | `UNVERIFIED` |
| `public/art/tubule-quiz.png` | Renal tubule reabsorption | 132.9 KB | Unknown / Web crawl | Unknown | Prohibited | `UNVERIFIED` |
| `public/images/studio/human-brain.jpg` | 3D render: Cerebrum & brainstem| 632.1 KB | AI Generated (Imagen / Midjourney) | Proprietary AI output | Unresolved IP | `UNVERIFIED` |
| `public/images/studio/neuron.jpg` | 3D render: Soma & axon terminals | 754.7 KB | AI Generated | Proprietary AI output | Unresolved IP | `UNVERIFIED` |
| `public/images/studio/reflex-arc.jpg` | 3D render: Sensory/motor pathway | 853.9 KB | AI Generated | Proprietary AI output | Unresolved IP | `UNVERIFIED` |
| `public/images/studio/sense-organs.jpg` | 3D render: Eye, cochlea, skin | 869.3 KB | AI Generated | Proprietary AI output | Unresolved IP | `UNVERIFIED` |
| `public/images/studio/synapse.jpg` | 3D render: Synaptic transmission | 865.6 KB | AI Generated | Proprietary AI output | Unresolved IP | `UNVERIFIED` |

---

## 3. Scientific Inconsistency Dossier: SA-Node Anatomical Contradiction

- **Finding ID**: `SCI-001`
- **Baseline Commit**: `1a01ca713b7751ac6ae8827984944049e9cf45a6`
- **Severity**: High (Academic & Examination Accuracy)
- **Status**: `VERIFIED CONTRADICTION`
- **Location**: `content/cee-visual-drafts/unreviewed-pilot-lessons.json`, lines 2 & 94
```json
Line 2: "Known issue: the Human Heart draft places the SA node in the right atrium’s \"anterolateral\" wall in one place and its \"posterolateral\" wall in another."
Line 94: "Right Atrium (RA) ... Houses the Sinoatrial (SA) Node in its anterolateral wall."
```
- **Medical Science & Nepal CEE Benchmark**:
  - According to standard authoritative anatomy texts (Gray's Anatomy 42nd Ed., Moore's Clinically Oriented Anatomy 8th Ed., Guyton & Hall Medical Physiology 14th Ed.):
  - The **Sinoatrial (SA) Node** is located in the **posterolateral wall of the right atrium**, immediately beneath the epicardium, at the upper junction of the superior vena cava and the right atrium, at the superior end of the *sulcus terminalis* (internally *crista terminalis*).
  - Calling it "anterolateral" is factually incorrect and would cause a medical entrance candidate to lose marks in the CEE examination (which applies negative marking of -0.25).
- **Required Remediation in CMS**:
  - The Subject Matter Expert holding the `SUBJECT_EXPERT` role must reject this hotspot description during the `SCIENTIFIC` review gate.
  - The description must be corrected to: *"Located in the posterolateral wall of the right atrium near the opening of the superior vena cava, at the superior end of the crista terminalis."*
  - The revision must only be approved after this correction is verified.

---

## 4. Rights & Licensing Gate Recommendation

In accordance with the 6-Gate Review System (`authz.ts:26`), all assets must clear the `RIGHTS` review gate (`review:RIGHTS` assigned to `RIGHTS_REVIEWER`).
1. **Replacement with CC-BY 4.0 or Commissioned Original 3D Models**: Replace scraped 2D raster images with SVG/GLB assets commissioned directly from medical animators or licensed under verified Creative Commons terms.
2. **Attribution Metadata**: Add explicit `attribution` and `licenseUrl` fields to `cee_visual_assets` table before publishing.
