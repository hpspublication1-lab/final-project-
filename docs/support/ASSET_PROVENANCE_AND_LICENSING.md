# Samyak Guru — Academic Asset Provenance & Licensing Register (Sprint 2)
**Branch:** `support/asset-provenance`  
**Baseline Commit SHA:** `f9fad548480db61b2e2d53bfceab43b6758ce6fe`  
**Classification:** Legal & Provenance Audit  
**Author:** Independent Quality Assurance & Security Specialist  

---

## 1. Executive Summary & Legal Framework

Under the **Copyright Act of Nepal, 2059 (2002)** and the **Berne Convention for the Protection of Literary and Artistic Works**, commercial educational technology platforms must hold verifiable, written intellectual property assignments, explicit commercial licenses, or operate strictly within clear Open Access (CC-BY / CC0 / Public Domain) terms.

Because Samyak Guru charges tuition for CEE preparation (via Fonepay, subscription plans, and premium course enrollments), the platform cannot rely on fair-use or non-commercial educational exceptions (`-NC` Creative Commons clauses). 

This investigation:
1. Formally catalogs all **26 static media assets** currently residing in `public/art` and `public/images/studio`.
2. Evaluates their legal status, finding all 26 **UNVERIFIED** (AI-generated without chain of title, or uncredited web clip art).
3. Analyzes open-access 3D Human Heart models suitable for the upcoming Human Heart Pilot in PR #6 / Sprint 2.
4. Provides a concrete, commercially cleared asset pipeline for Claude Opus.

---

## 2. Inventory of Current 26 Unverified Assets

| Asset Path | File Type | Apparent Origin | Current Classification | Commercial Risk | Mandatory Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `public/art/cardiac-cycle.png` | PNG | AI-generated | `UNVERIFIED` | Moderate | Replace with verified CC-BY diagram |
| `public/art/heart-conduction.png` | PNG | AI-generated | `UNVERIFIED` | Moderate | Replace / Verify SA/AV node anatomy |
| `public/art/human-heart-cross-section.png` | PNG | AI-generated | `UNVERIFIED` | Moderate | Replace with CC-BY anatomical plate |
| `public/art/human-heart-overview.png` | PNG | AI-generated | `UNVERIFIED` | Moderate | Replace with rendered 3D model frame |
| `public/art/human-heart-valves.png` | PNG | AI-generated | `UNVERIFIED` | Moderate | Replace with verified valve diagram |
| `public/art/internal-chambers.png` | PNG | AI-generated | `UNVERIFIED` | Moderate | Replace with verified chamber diagram |
| `public/art/coronary-circulation.png` | PNG | AI-generated | `UNVERIFIED` | Moderate | Replace with coronary anatomy plate |
| `public/art/neuron.png` | PNG | AI-generated | `UNVERIFIED` | Moderate | Replace with CC0 / CC-BY histology |
| `public/art/synapse.png` | PNG | AI-generated | `UNVERIFIED` | Moderate | Replace with CC-BY synapse diagram |
| `public/art/reflex-arc.png` | PNG | AI-generated | `UNVERIFIED` | Moderate | Replace with CC-BY reflex arc |
| `public/art/human-brain.png` | PNG | AI-generated | `UNVERIFIED` | Moderate | Replace with BodyParts3D render |
| `public/art/sense-organs.png` | PNG | AI-generated | `UNVERIFIED` | Moderate | Replace with CC-BY sensory plate |
| `public/art/eye-anatomy.png` | PNG | AI-generated | `UNVERIFIED` | Moderate | Replace with OpenStax anatomy plate |
| `public/art/ear-anatomy.png` | PNG | AI-generated | `UNVERIFIED` | Moderate | Replace with OpenStax anatomy plate |
| `public/art/dna-replication.png` | PNG | AI-generated | `UNVERIFIED` | Moderate | Replace with CC-BY molecular diagram |
| `public/art/mitosis-phases.png` | PNG | AI-generated | `UNVERIFIED` | Moderate | Replace with CC0 cytology plates |
| `public/art/meiosis-stages.png` | PNG | AI-generated | `UNVERIFIED` | Moderate | Replace with CC0 cytology plates |
| `public/art/kidney-nephron.png` | PNG | AI-generated | `UNVERIFIED` | Moderate | Replace with OpenStax nephron diagram |
| `public/art/respiratory-system.png` | PNG | AI-generated | `UNVERIFIED` | Moderate | Replace with CC-BY respiratory model |
| `public/art/digestive-system.png` | PNG | AI-generated | `UNVERIFIED` | Moderate | Replace with CC-BY gastrointestinal plate |
| `public/art/endocrine-glands.png` | PNG | AI-generated | `UNVERIFIED` | Moderate | Replace with CC-BY endocrine diagram |
| `public/images/studio/hero-preview.png` | PNG | Studio mockup | `UNVERIFIED` | Low | Replace with authenticated player UI screenshot |
| `public/images/studio/heart-anatomy.png` | PNG | Studio mockup | `UNVERIFIED` | Low | Replace with verified heart GLB render |
| `public/images/studio/neural-conduction.png` | PNG | Studio mockup | `UNVERIFIED` | Low | Replace with verified neuron render |
| `public/images/studio/cell-division.png` | PNG | Studio mockup | `UNVERIFIED` | Low | Replace with verified mitosis render |
| `public/images/studio/placeholder-model.png` | PNG | Wireframe icon | `UNVERIFIED` | Minimal | Replace with SVG placeholder |

---

## 3. Human Heart 3D Model Sourcing Analysis

To support Claude Opus's upcoming **Human Heart 3D Pilot Lesson**, four open-source / open-access scientific 3D anatomical repositories were systematically benchmarked against commercial licensing, pedagogical fidelity, and technical Three.js constraints:

### Option 1: BodyParts3D / Anatomography (DBCLS, Japan) — **RECOMMENDED TIER 2**
- **Repository:** Database Center for Life Science (DBCLS), Research Organization of Information and Systems (ROIS), Japan.
- **License:** **Creative Commons Attribution 4.0 International (CC BY 4.0)** (for modern release releases).
- **Commercial Use:** **Permitted** without restrictions, provided mandatory attribution is displayed.
- **Copyleft (ShareAlike):** None in the CC BY 4.0 distribution.
- **Anatomical Accuracy:** Gold standard for academic and medical visualizers. Generated directly from segmented CT/MRI scans of an adult human male according to the Federative Committee on Anatomical Terminology (*Terminologia Anatomica*).
- **Structures Available:** Left/right ventricles, left/right atria, ascending aorta, pulmonary trunk, superior/inferior vena cava, tricuspid/mitral/aortic/pulmonary valves, coronary arteries, cardiac veins, and fibrous skeleton.
- **Attribution Obligation:**
  > *"BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International."*

### Option 2: NIH 3D Print Exchange / NIH 3D (US National Institutes of Health) — **RECOMMENDED TIER 2**
- **Repository:** National Institute of Allergy and Infectious Diseases (NIAID) / National Institutes of Health (NIH).
- **License:** Individual models vary; multiple high-fidelity cardiac models are in the **Public Domain (CC0 / US Government Work)** or licensed under **CC-BY 4.0**.
- **Commercial Use:** **Permitted** for models tagged Public Domain or CC-BY (excluding those with `-NC` tags).
- **Candidate Models:**
  - `3DPX-000424` (Normal Adult Human Heart with internal chamber segmentation, derived from cardiac CT).
  - `3DPX-013289` (Human Heart Anatomy with Great Vessels and Pericardium).
- **Verification Rule:** Must verify the uploader institution tag (e.g., NIH intramural researchers vs. external clinical contributors) to ensure no `-NC` restrictions apply.

### Option 3: Z-Anatomy (Open Source Human Anatomy Project) — **CAUTION (COPYLEFT)**
- **License:** **Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0)**.
- **Commercial Viability:** Permitted, BUT **strictly triggers copyleft obligations**. Incorporating Z-Anatomy GLB meshes directly into a proprietary LMS application could require Samyak Guru to license derivative assets and lesson models under CC-BY-SA 4.0.
- **Recommendation:** Do **not** bundle Z-Anatomy assets into proprietary bundles. Treat as reference geometry only.

### Option 4: Sketchfab Creative Commons Models — **HIGH CAUTION**
- **Risks:** The vast majority of medical heart scans on Sketchfab from university collections (e.g., Visible Heart Laboratories, Dundee University) are explicitly licensed under **CC BY-NC 4.0 (NonCommercial)** or **CC BY-NC-SA 4.0**.
- **Rule:** Never download Sketchfab models without explicit verification that the filter is set to **"Deals for commercial use: CC-BY"** without the `-NC` suffix.

---

## 4. Technical Constraints for the Heart Pilot GLB

To comply with the Blueprint and ensure 60fps rendering on mid-range Android devices (e.g., Redmi Note / Samsung Galaxy A-series over 4G networks in Nepal):

1. **Polygon Budget:**
   - Target: $\le 60,000$ to $90,000$ triangles (tris) for the complete heart assembly.
   - Max Draw Calls: $\le 12$ draw calls per scene.
2. **Texture Constraints:**
   - Max resolution: $2048 \times 2048$ pixels (2K) PBR (BaseColor, Normal, Roughness, Metalness, AO packed in ORM map).
   - Formats: JPEG / PNG packed within GLB container, or Basis Universal (KTX2) where possible.
3. **Geometry Compression:**
   - Draco mesh compression or ExtMeshopt compression enabled (`gltf-pipeline --draco.compressionLevel 7`).
   - Target file size: $\le 12.5\text{ MB}$ uncompressed; $\le 4.5\text{ MB}$ Draco-compressed.
4. **Anatomical Verification Check (`SCI-001` Resolution):**
   - The Sinoatrial (SA) node hotspot annotation must be placed at the junction of the **superior vena cava** and the **posterolateral** wall of the right atrium (upper border of the sulcus terminalis), correcting the pilot text contradiction.

---

## 5. Mandatory Platform Attribution Template

For any CC-BY 4.0 asset integrated into the Visual Intelligence Studio, the following metadata must be included in the lesson manifest and rendered in the lesson info modal:

```json
{
  "provenance": {
    "asset_id": "cee-model-human-heart-v1",
    "source_title": "Human Heart Anatomical Model (Adult)",
    "creator": "Database Center for Life Science (DBCLS) / NIH 3D",
    "license": "CC-BY-4.0",
    "license_url": "https://creativecommons.org/licenses/by/4.0/",
    "modifications": "Remeshed to 75k tris, Draco compression applied, PBR textures optimized for WebGL",
    "attribution_notice": "Heart model adapted from BodyParts3D, © The Database Center for Life Science, licensed under CC BY 4.0."
  }
}
```

---

## 6. Actionable Recommendations for Claude Opus

1. **Quarantine Static Files:** Keep the 26 files in `public/art/` and `public/images/studio/` marked as draft fixtures; do not promote them to production marketing or student-facing production courses without replacement.
2. **Heart Model Selection:** Source the initial pilot geometry from **BodyParts3D (CC BY 4.0)** or **NIH 3D Public Domain**.
3. **Pre-flight glTF Validation:** Every asset added to `cee_visual_assets` must pass `validateGlbBuffer()` (enforced by `gltf-validator` as repaired in Workstream A).
4. **Anatomical Alignment:** During SME review (`SCIENTIFIC_REVIEW`), verify all hotspot coordinates against standard anatomical landmarks.
