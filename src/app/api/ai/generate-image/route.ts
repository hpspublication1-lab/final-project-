import { NextRequest, NextResponse } from 'next/server';

// 100% Free, High-Definition Scientific & Medical Textbook Diagrams (Zero OpenAI API Cost)
const HIGH_DEF_SCIENCE_DIAGRAMS: Record<string, { title: string; url: string }> = {
  heart: {
    title: 'Human Heart Anatomy Diagram',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Diagram_of_the_human_heart_%28cropped%29.svg/1200px-Diagram_of_the_human_heart_%28cropped%29.svg.png',
  },
  brain: {
    title: 'Human Brain Structure & Regions',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Diagram_showing_the_brain_regions_that_are_affected_by_depression_CRUK_167.svg/1200px-Diagram_showing_the_brain_regions_that_are_affected_by_depression_CRUK_167.svg.png',
  },
  nephron: {
    title: 'Physiology & Structure of Nephron',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Physiology_of_Nephron.svg/1200px-Physiology_of_Nephron.svg.png',
  },
  kidney: {
    title: 'Human Kidney Internal Anatomy',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Physiology_of_Nephron.svg/1200px-Physiology_of_Nephron.svg.png',
  },
  eye: {
    title: 'Schematic Diagram of Human Eye Anatomy',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Schematic_diagram_of_the_human_eye_en.svg/1200px-Schematic_diagram_of_the_human_eye_en.svg.png',
  },
  ear: {
    title: 'Anatomy of Human Ear & Hearing Path',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Anatomy_of_the_Human_Ear.svg/1200px-Anatomy_of_the_Human_Ear.svg.png',
  },
  plant_cell: {
    title: 'Plant Cell Organelles & Structure',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Plant_cell_structure_svg_labels.svg/1200px-Plant_cell_structure_svg_labels.svg.png',
  },
  animal_cell: {
    title: 'Animal Cell Organelles & Structure',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Animal_cell_structure_en.svg/1200px-Animal_cell_structure_en.svg.png',
  },
  photosynthesis: {
    title: 'Photosynthesis Process & Leaf Anatomy Diagram',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Photosynthesis_in_a_leaf.svg/1200px-Photosynthesis_in_a_leaf.svg.png',
  },
  mitosis: {
    title: 'Stages of Cell Mitosis',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Major_events_in_mitosis.svg/1200px-Major_events_in_mitosis.svg.png',
  },
  dna: {
    title: 'DNA Double Helix Structure',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/DNA_simple_structure.svg/1200px-DNA_simple_structure.svg.png',
  },
  periodic_table: {
    title: 'Periodic Table of Chemical Elements',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Simple_Periodic_Table_Chart-en.svg/1200px-Simple_Periodic_Table_Chart-en.svg.png',
  },
  projectile: {
    title: 'Physics Projectile Motion Angles & Trajectory',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Ideal_projectile_motion_for_different_angles.svg/1200px-Ideal_projectile_motion_for_different_angles.svg.png',
  },
  prism: {
    title: 'Prism Light Dispersion Spectrum',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Light_dispersion_conceptual_waves.svg/1200px-Light_dispersion_conceptual_waves.svg.png',
  },
  mitochondria: {
    title: 'Mitochondria Organelle Internal Structure',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Mitochondrion_structure.svg/1200px-Mitochondrion_structure.svg.png',
  },
  chloroplast: {
    title: 'Chloroplast Anatomy & Thylakoid Structure',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Chloroplast_diagram.svg/1200px-Chloroplast_diagram.svg.png',
  },
};

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const lowerPrompt = prompt.toLowerCase();

    // 1. High-Precision Match with Free Academic Knowledge Base (Zero API Cost)
    for (const [key, item] of Object.entries(HIGH_DEF_SCIENCE_DIAGRAMS)) {
      const matchKey = key.replace('_', ' ');
      if (lowerPrompt.includes(key) || lowerPrompt.includes(matchKey)) {
        return NextResponse.json({
          ok: true,
          provider: 'academic-textbook-free',
          url: item.url,
          revised_prompt: item.title,
        });
      }
    }

    // 2. Free Open Engine (Zero OpenAI API Cost)
    const cleanPrompt = encodeURIComponent(
      `clean_3d_vector_medical_illustration_of_${prompt.replace(/[^a-zA-Z0-9]+/g, '_')}_isolated_white_background_8k`
    );
    const freeUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&nologo=true`;

    return NextResponse.json({
      ok: true,
      provider: 'free-open-engine',
      url: freeUrl,
      revised_prompt: prompt,
    });
  } catch (error: any) {
    console.error('Generate image route error:', error);
    return NextResponse.json({ error: 'Failed to generate image', details: error?.message }, { status: 500 });
  }
}
