import { SampleImage } from '../types';

// Helper to encode SVG string to data URI
function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// 1. Normal Chest X-ray SVG
const normalChestSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <rect width="400" height="400" fill="#0b0f17"/>
  <defs>
    <radialGradient id="lungBg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#141c28"/>
      <stop offset="100%" stop-color="#070a0e"/>
    </radialGradient>
    <radialGradient id="heartGrad" cx="40%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#4a5568"/>
      <stop offset="60%" stop-color="#2d3748"/>
      <stop offset="100%" stop-color="#1a202c"/>
    </radialGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Thoracic Cage Outline -->
  <path d="M 80,40 Q 200,20 320,40 Q 360,180 340,340 Q 200,370 60,340 Q 40,180 80,40 Z" fill="url(#lungBg)" stroke="#2d3748" stroke-width="2"/>

  <!-- Spinal Column -->
  <g opacity="0.45">
    <rect x="192" y="30" width="16" height="320" rx="3" fill="#cbd5e1"/>
    ${Array.from({ length: 14 }, (_, i) => `<rect x="188" y="${50 + i * 20}" width="24" height="12" rx="2" fill="#94a3b8" opacity="0.6"/>`).join('')}
  </g>

  <!-- Left Lung Field (anatomical right, viewer's left) -->
  <path d="M 180,60 Q 110,90 95,180 Q 90,280 110,320 Q 150,310 175,260 Q 185,150 180,60 Z" fill="#040608" opacity="0.85"/>

  <!-- Right Lung Field (anatomical left, viewer's right) -->
  <path d="M 220,60 Q 290,90 305,180 Q 310,280 290,320 Q 240,300 225,230 Q 215,150 220,60 Z" fill="#040608" opacity="0.85"/>

  <!-- Vascular Markings (Fine Branching Lines) -->
  <g stroke="#475569" stroke-width="1.2" opacity="0.5" stroke-linecap="round">
    <path d="M 175,180 Q 140,190 120,210 M 175,170 Q 130,160 115,150 M 175,190 Q 145,230 130,260"/>
    <path d="M 225,180 Q 260,190 280,210 M 225,170 Q 270,160 285,150 M 225,190 Q 255,230 270,260"/>
  </g>

  <!-- Clavicles -->
  <path d="M 80,60 Q 140,75 195,65" fill="none" stroke="#e2e8f0" stroke-width="9" stroke-linecap="round" opacity="0.75"/>
  <path d="M 320,60 Q 260,75 205,65" fill="none" stroke="#e2e8f0" stroke-width="9" stroke-linecap="round" opacity="0.75"/>

  <!-- Ribs (Bilateral arches) -->
  <g fill="none" stroke="#94a3b8" stroke-width="5" opacity="0.32">
    ${[90, 120, 150, 185, 220, 255, 290].map((y, idx) => `
      <path d="M 195,${y - 20} Q 130,${y} 90,${y + 25}"/>
      <path d="M 205,${y - 20} Q 270,${y} 310,${y + 25}"/>
    `).join('')}
  </g>

  <!-- Cardiac Silhouette & Aortic Arch -->
  <!-- Aortic Knob -->
  <ellipse cx="218" cy="125" rx="18" ry="12" fill="#718096" opacity="0.65"/>
  <!-- Cardiac outline (shifted to viewer's right/anatomical left) -->
  <path d="M 185,140 C 180,180 180,250 160,275 C 190,285 240,285 265,260 C 275,230 260,180 220,150 Z" fill="url(#heartGrad)" opacity="0.82" filter="url(#softGlow)"/>

  <!-- Diaphragms & Sharp Costophrenic Angles -->
  <path d="M 85,320 Q 140,290 190,300" fill="none" stroke="#e2e8f0" stroke-width="6" opacity="0.75"/>
  <path d="M 315,320 Q 260,295 210,300" fill="none" stroke="#e2e8f0" stroke-width="6" opacity="0.75"/>
  <!-- Sharp Costophrenic Sulci -->
  <circle cx="95" cy="320" r="4" fill="#38bdf8" opacity="0.4"/>
  <circle cx="305" cy="320" r="4" fill="#38bdf8" opacity="0.4"/>

  <!-- Text Annotations -->
  <text x="25" y="45" fill="#94a3b8" font-family="monospace" font-size="14" font-weight="bold">R (PA)</text>
  <text x="25" y="65" fill="#64748b" font-family="monospace" font-size="10">EXP: CLEAR</text>
</svg>
`;

// 2. Bacterial Lobar Pneumonia Chest X-ray
const pneumoniaChestSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <rect width="400" height="400" fill="#0b0f17"/>
  <defs>
    <radialGradient id="consolidationGlow" cx="45%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#f8fafc" stop-opacity="0.95"/>
      <stop offset="35%" stop-color="#cbd5e1" stop-opacity="0.8"/>
      <stop offset="70%" stop-color="#64748b" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Base chest x-ray background -->
  <path d="M 80,40 Q 200,20 320,40 Q 360,180 340,340 Q 200,370 60,340 Q 40,180 80,40 Z" fill="#111827" stroke="#374151" stroke-width="2"/>

  <!-- Spine -->
  <rect x="192" y="30" width="16" height="320" rx="3" fill="#cbd5e1" opacity="0.4"/>

  <!-- Left Lung (Normal) -->
  <path d="M 220,60 Q 290,90 305,180 Q 310,280 290,320 Q 240,300 225,230 Q 215,150 220,60 Z" fill="#05070a" opacity="0.9"/>

  <!-- Right Lung with massive alveolar infiltration -->
  <path d="M 180,60 Q 110,90 95,180 Q 90,280 110,320 Q 150,310 175,260 Q 185,150 180,60 Z" fill="#0a0f16" opacity="0.9"/>

  <!-- Massive Alveolar Consolidation in Right Mid/Lower Lobe -->
  <ellipse cx="138" cy="235" rx="55" ry="48" fill="url(#consolidationGlow)"/>
  <path d="M 105,210 Q 130,195 165,225 Q 180,260 145,280 Q 100,270 105,210 Z" fill="#e2e8f0" opacity="0.75" filter="blur(6px)"/>

  <!-- Air Bronchograms (Dark branching lucencies through white consolidation) -->
  <g stroke="#090d16" stroke-width="2.5" stroke-linecap="round" opacity="0.95">
    <path d="M 148,205 L 140,230 L 125,250"/>
    <path d="M 140,230 L 148,255 L 144,270"/>
    <path d="M 148,205 L 160,235 L 168,260"/>
  </g>

  <!-- Ribs -->
  <g fill="none" stroke="#94a3b8" stroke-width="5" opacity="0.25">
    ${[90, 120, 150, 185, 220, 255, 290].map((y) => `
      <path d="M 195,${y - 20} Q 130,${y} 90,${y + 25}"/>
      <path d="M 205,${y - 20} Q 270,${y} 310,${y + 25}"/>
    `).join('')}
  </g>

  <!-- Clavicles -->
  <path d="M 80,60 Q 140,75 195,65" fill="none" stroke="#cbd5e1" stroke-width="8" opacity="0.7"/>
  <path d="M 320,60 Q 260,75 205,65" fill="none" stroke="#cbd5e1" stroke-width="8" opacity="0.7"/>

  <!-- Heart Silhouette (Partially obscured by right infiltrate - silhouette sign) -->
  <path d="M 185,140 C 180,180 180,250 160,275 C 190,285 240,285 265,260 C 275,230 260,180 220,150 Z" fill="#334155" opacity="0.8"/>

  <!-- Partially blunted right costophrenic angle -->
  <path d="M 90,315 Q 135,285 185,295" fill="none" stroke="#e2e8f0" stroke-width="5" opacity="0.4"/>
  <path d="M 315,320 Q 260,295 210,300" fill="none" stroke="#e2e8f0" stroke-width="6" opacity="0.75"/>

  <text x="25" y="45" fill="#f87171" font-family="monospace" font-size="14" font-weight="bold">R (PA) - ABNORMAL</text>
  <text x="25" y="65" fill="#cbd5e1" font-family="monospace" font-size="10">LOBAR CONSOLIDATION</text>
</svg>
`;

// 3. ISIC Malignant Melanoma Dermoscopy SVG
const melanomaDermSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <!-- Skin Tone Background -->
    <radialGradient id="skinBase" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#f5d0b5"/>
      <stop offset="60%" stop-color="#e8b594"/>
      <stop offset="100%" stop-color="#c98c69"/>
    </radialGradient>
    <!-- Dermatoscope Vignette Ring -->
    <radialGradient id="dermaLens" cx="50%" cy="50%" r="50%">
      <stop offset="78%" stop-color="#000" stop-opacity="0"/>
      <stop offset="92%" stop-color="#0f172a" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0.98"/>
    </radialGradient>
    <filter id="lesionTexture">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="9" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>

  <!-- Skin Surface -->
  <rect width="400" height="400" fill="url(#skinBase)"/>

  <!-- Skin Micro-relief and Fine Reticular Lines -->
  <g stroke="#d49b78" stroke-width="0.8" opacity="0.45">
    ${Array.from({ length: 15 }, (_, i) => `<line x1="0" y1="${i * 30}" x2="400" y2="${i * 30 + 15}"/>`).join('')}
    ${Array.from({ length: 15 }, (_, i) => `<line x1="${i * 30}" y1="0" x2="${i * 30 + 20}" y2="400"/>`).join('')}
  </g>

  <!-- Asymmetric, Irregular Melanoma Lesion Border -->
  <path d="M 130,120 C 180,85 270,95 295,140 C 320,185 310,250 275,285 C 240,320 180,315 135,280 C 90,245 95,160 130,120 Z"
        fill="#3b1f14" filter="url(#lesionTexture)"/>

  <!-- Deep Black/Brown Hypopigmented & Hyperpigmented islands -->
  <!-- Dark Black nodular core -->
  <path d="M 160,145 C 200,130 250,140 260,185 C 270,230 230,260 185,255 C 140,250 130,190 160,145 Z"
        fill="#120805" opacity="0.95"/>

  <!-- Blue-White Veil (Pathognomonic for Invasive Melanoma) -->
  <path d="M 180,165 C 220,150 240,170 235,210 C 230,240 190,235 175,210 C 160,185 170,170 180,165 Z"
        fill="#8fa3bf" opacity="0.65" filter="blur(4px)"/>

  <!-- Focal Pigment Blotches & Regression Zones -->
  <circle cx="210" cy="180" r="14" fill="#ffffff" opacity="0.25" filter="blur(3px)"/>
  <ellipse cx="255" cy="225" rx="16" ry="10" fill="#78350f" opacity="0.85"/>
  <ellipse cx="145" cy="245" rx="14" ry="18" fill="#451a03" opacity="0.9"/>

  <!-- Radial Streaks and Atypical Peripheral Globules -->
  ${[
    [105, 175], [115, 230], [285, 130], [295, 170], [280, 260], [245, 305], [175, 300]
  ].map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="3.5" fill="#1f1105"/>`).join('')}

  <!-- Millimeter Dermatoscope Calibration Grid (Crosshairs) -->
  <circle cx="200" cy="200" r="170" fill="none" stroke="#38bdf8" stroke-width="1" opacity="0.35" stroke-dasharray="4,6"/>
  <line x1="190" y1="200" x2="210" y2="200" stroke="#38bdf8" stroke-width="1.5" opacity="0.6"/>
  <line x1="200" y1="190" x2="200" y2="210" stroke="#38bdf8" stroke-width="1.5" opacity="0.6"/>

  <!-- Circular Dermatoscope Vignette Cover -->
  <rect width="400" height="400" fill="url(#dermaLens)"/>

  <text x="30" y="45" fill="#f87171" font-family="monospace" font-size="13" font-weight="bold">ISIC: MELANOMA</text>
  <text x="30" y="65" fill="#cbd5e1" font-family="monospace" font-size="10">ASYMMETRY + BLUE-WHITE VEIL</text>
</svg>
`;

// 4. ISIC Benign Melanocytic Nevus Dermoscopy SVG
const nevusDermSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="skinBase2" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#f8dfcb"/>
      <stop offset="60%" stop-color="#e2ba9e"/>
      <stop offset="100%" stop-color="#c99572"/>
    </radialGradient>
    <radialGradient id="nevusGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#582f1b"/>
      <stop offset="60%" stop-color="#804a29"/>
      <stop offset="90%" stop-color="#a4683d"/>
      <stop offset="100%" stop-color="#c48a5e" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="dermaLens2" cx="50%" cy="50%" r="50%">
      <stop offset="78%" stop-color="#000" stop-opacity="0"/>
      <stop offset="95%" stop-color="#020617" stop-opacity="0.95"/>
    </radialGradient>
  </defs>

  <rect width="400" height="400" fill="url(#skinBase2)"/>

  <!-- Perfectly Symmetric, Regular Oval Nevus -->
  <ellipse cx="200" cy="200" rx="65" ry="55" fill="url(#nevusGrad)"/>

  <!-- Regular Pigment Network (Uniform Delicate Honeycomb) -->
  <g stroke="#3a1c0d" stroke-width="0.8" opacity="0.6">
    ${Array.from({ length: 10 }, (_, i) => `<line x1="150" y1="${160 + i * 8}" x2="250" y2="${160 + i * 8}"/>`).join('')}
    ${Array.from({ length: 12 }, (_, i) => `<line x1="${155 + i * 8}" y1="155" x2="${155 + i * 8}" y2="245"/>`).join('')}
  </g>

  <!-- Homogeneous light brown center with fadeout at borders -->
  <circle cx="200" cy="200" r="30" fill="#4a2414" opacity="0.45" filter="blur(8px)"/>

  <!-- Vignette -->
  <rect width="400" height="400" fill="url(#dermaLens2)"/>

  <text x="30" y="45" fill="#34d399" font-family="monospace" font-size="13" font-weight="bold">ISIC: BENIGN NEVUS</text>
  <text x="30" y="65" fill="#cbd5e1" font-family="monospace" font-size="10">SYMMETRIC REGULAR NETWORK</text>
</svg>
`;

// 5. BraTS Glioblastoma Brain MRI T1ce SVG
const brainGbmSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <rect width="400" height="400" fill="#040608"/>
  <defs>
    <radialGradient id="cortexGrad" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="70%" stop-color="#334155"/>
      <stop offset="92%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#090d16"/>
    </radialGradient>
    <radialGradient id="ringEnhance" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="45%" stop-color="#1e293b"/>
      <stop offset="70%" stop-color="#f8fafc"/>
      <stop offset="85%" stop-color="#cbd5e1"/>
      <stop offset="100%" stop-color="#334155" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Skull Contour (Oval Calvarium) -->
  <ellipse cx="200" cy="200" rx="140" ry="165" fill="none" stroke="#e2e8f0" stroke-width="4.5" opacity="0.85"/>
  <!-- Subcutaneous Fat layer -->
  <ellipse cx="200" cy="200" rx="136" ry="160" fill="none" stroke="#94a3b8" stroke-width="3" opacity="0.5"/>

  <!-- Brain Parenchyma -->
  <ellipse cx="200" cy="200" rx="130" ry="155" fill="url(#cortexGrad)"/>

  <!-- Cortical Sulci & Gyri Pattern -->
  <g fill="none" stroke="#1e293b" stroke-width="2" opacity="0.75">
    <path d="M 120,110 Q 140,140 130,170 Q 150,210 120,240"/>
    <path d="M 280,110 Q 260,140 270,170 Q 250,210 280,240"/>
    <path d="M 150,80 Q 170,110 160,140"/>
    <path d="M 250,80 Q 230,110 240,140"/>
  </g>

  <!-- Longitudinal Interhemispheric Fissure -->
  <line x1="200" y1="55" x2="200" y2="345" stroke="#090d16" stroke-width="2.5" opacity="0.9"/>

  <!-- Lateral Ventricles (Compressed on tumor side - mass effect) -->
  <!-- Left Ventricle (anatomical left, viewer's right: normal horn) -->
  <path d="M 206,160 C 218,175 220,205 210,225 C 205,210 204,180 206,160 Z" fill="#04070c"/>
  <!-- Right Ventricle (effaced/compressed by mass) -->
  <path d="M 194,170 C 190,185 190,200 193,215 C 195,200 196,185 194,170 Z" fill="#04070c"/>

  <!-- Peritumoral Vasogenic Edema (T1 hypointense dark halo in right hemisphere) -->
  <ellipse cx="145" cy="195" rx="55" ry="50" fill="#0f172a" opacity="0.9" filter="blur(8px)"/>

  <!-- GLIOBLASTOMA TUMOR: Heterogeneous Ring-Enhancement post-Gadolinium -->
  <ellipse cx="145" cy="195" rx="38" ry="34" fill="url(#ringEnhance)"/>
  <!-- Central Necrotic Cavity (Non-enhancing core) -->
  <ellipse cx="144" cy="194" rx="20" ry="17" fill="#090d16"/>

  <!-- Nodular irregular enhancements on the rim -->
  <circle cx="165" cy="180" r="6" fill="#f8fafc" opacity="0.9"/>
  <circle cx="130" cy="215" r="5" fill="#f8fafc" opacity="0.85"/>
  <circle cx="125" cy="180" r="4.5" fill="#cbd5e1" opacity="0.8"/>

  <text x="25" y="45" fill="#f87171" font-family="monospace" font-size="13" font-weight="bold">BraTS: GLIOBLASTOMA</text>
  <text x="25" y="65" fill="#cbd5e1" font-family="monospace" font-size="10">T1+Gd: RING ENHANCEMENT</text>
</svg>
`;

// 6. Diabetic Retinopathy Fundus Photograph SVG
const retinopathySvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <rect width="400" height="400" fill="#000"/>
  <defs>
    <radialGradient id="retinaGrad" cx="45%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#dc2626"/>
      <stop offset="50%" stop-color="#b91c1c"/>
      <stop offset="85%" stop-color="#7f1d1d"/>
      <stop offset="100%" stop-color="#450a0a"/>
    </radialGradient>
    <radialGradient id="opticDisc" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="70%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </radialGradient>
  </defs>

  <!-- Circular Fundus Base -->
  <circle cx="200" cy="200" r="170" fill="url(#retinaGrad)"/>

  <!-- Optic Disc (Nasal side) -->
  <circle cx="130" cy="200" r="22" fill="url(#opticDisc)"/>

  <!-- Retinal Vascular Arcades branching from Optic Disc -->
  <g fill="none" stroke="#7f1d1d" stroke-linecap="round">
    <!-- Superior temporal arcade -->
    <path d="M 135,190 Q 160,130 220,110 Q 280,105 320,130" stroke-width="4.5"/>
    <path d="M 220,110 Q 250,90 280,85" stroke-width="2.5"/>
    <!-- Inferior temporal arcade -->
    <path d="M 135,210 Q 160,270 220,290 Q 280,295 320,270" stroke-width="4.5"/>
    <path d="M 220,290 Q 250,310 280,315" stroke-width="2.5"/>
  </g>

  <!-- Fovea & Macula (Avascular zone, darker red central spot) -->
  <circle cx="235" cy="200" r="24" fill="#581c1c" opacity="0.8"/>
  <circle cx="235" cy="200" r="4" fill="#450a0a"/>

  <!-- PROLIFERATIVE DIABETIC RETINOPATHY LESIONS -->
  <!-- Hard Exudates (bright yellow lipid deposits around macula) -->
  <g fill="#fef08a">
    <circle cx="220" cy="165" r="3.5"/><circle cx="228" cy="160" r="3"/>
    <circle cx="245" cy="168" r="4"/><circle cx="255" cy="175" r="3"/>
    <circle cx="215" cy="235" r="3.5"/><circle cx="225" cy="242" r="4"/>
    <circle cx="248" cy="232" r="3"/>
  </g>

  <!-- Microaneurysms (tiny punctate deep red dots) -->
  <g fill="#450a0a">
    ${[[180, 150], [195, 175], [210, 190], [260, 210], [270, 185], [190, 230], [205, 260], [275, 240]].map(([cx, cy]) => `
      <circle cx="${cx}" cy="${cy}" r="2.5"/>
    `).join('')}
  </g>

  <!-- Flame-shaped & Blot Hemorrhages -->
  <ellipse cx="265" cy="155" rx="9" ry="5" fill="#450a0a" transform="rotate(-25, 265, 155)"/>
  <ellipse cx="195" cy="225" rx="8" ry="4" fill="#450a0a" transform="rotate(35, 195, 225)"/>
  <circle cx="270" cy="225" r="7" fill="#581c1c"/>

  <!-- Cotton Wool Spots (Soft fluffy ischemic nerve fiber layer infarcts) -->
  <ellipse cx="205" cy="140" rx="8" ry="6" fill="#ffffff" opacity="0.65" filter="blur(2px)"/>
  <ellipse cx="280" cy="195" rx="10" ry="7" fill="#ffffff" opacity="0.6" filter="blur(2px)"/>

  <text x="30" y="45" fill="#facc15" font-family="monospace" font-size="13" font-weight="bold">MESSIDOR: SEVERE PDR</text>
  <text x="30" y="65" fill="#cbd5e1" font-family="monospace" font-size="10">EXUDATES + HEMORRHAGES</text>
</svg>
`;

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'cxr-pneumonia',
    name: 'Bacterial Lobar Pneumonia',
    nameFr: 'Pneumonie Bactérienne Lobaire',
    modality: 'chest-xray',
    groundTruth: 'Bacterial Pneumonia (Dense Consolidation)',
    groundTruthFr: 'Pneumopathie Bactérienne (Condensation)',
    difficulty: 'Standard',
    sourceDataset: 'NIH ChestX-ray14 & RSNA Pneumonia Challenge',
    previewSvg: svgToDataUri(pneumoniaChestSvg),
    gradCamCoords: [
      { x: 138, y: 235, radius: 45, intensity: 0.96 },
      { x: 120, y: 220, radius: 32, intensity: 0.82 },
      { x: 155, y: 250, radius: 28, intensity: 0.74 },
    ],
    description: 'Posteroanterior chest radiograph demonstrating dense airspace consolidation in the right mid-to-lower pulmonary zone with patent air bronchograms.',
    descriptionFr: 'Radiographie thoracique face montrant une condensation dense systématisée de la base et du lobe moyen droit avec bronchogrammes aériques.',
    patientAge: 58,
    patientGender: 'M',
    clinicalHistory: 'Productive cough with purulent sputum, fever of 39.2°C, acute dyspnea, and right-sided pleuritic chest pain.',
    clinicalHistoryFr: 'Toux productive avec crachats purulents, fièvre à 39,2°C, dyspnée aiguë et douleur thoracique pleurale droite.',
  },
  {
    id: 'cxr-normal',
    name: 'Healthy Normal Thorax',
    nameFr: 'Radiographie Thoracique Saine',
    modality: 'chest-xray',
    groundTruth: 'Normal / No Pathological Finding',
    groundTruthFr: 'Normale / Absence de Pathologie',
    difficulty: 'Standard',
    sourceDataset: 'NIH ChestX-ray14 Benchmark',
    previewSvg: svgToDataUri(normalChestSvg),
    gradCamCoords: [
      { x: 200, y: 200, radius: 80, intensity: 0.15 },
    ],
    description: 'Bilateral lung fields are completely clear and well-expanded. Costophrenic sulci are sharp and cardiac silhouette exhibits normal transverse ratio (<0.50).',
    descriptionFr: 'Champs pulmonaires clairs et symétriques. Culs-de-sac costo-diaphragmatiques libres et index cardiothoracique normal (< 0,50).',
    patientAge: 34,
    patientGender: 'F',
    clinicalHistory: 'Pre-operative clearance for elective orthopedic procedure; non-smoker, no cardiopulmonary complaints.',
    clinicalHistoryFr: 'Bilan préopératoire pour chirurgie orthopédique réglée ; non-fumeur, asymptomatique sur le plan cardiopulmonaire.',
  },
  {
    id: 'derm-melanoma',
    name: 'Invasive Cutaneous Melanoma',
    nameFr: 'Mélanome Cutané Invasif',
    modality: 'dermoscopy',
    groundTruth: 'Malignant Melanoma (MEL)',
    groundTruthFr: 'Mélanome Malin (MEL)',
    difficulty: 'Complex',
    sourceDataset: 'ISIC 2020 Challenge Archive',
    previewSvg: svgToDataUri(melanomaDermSvg),
    gradCamCoords: [
      { x: 195, y: 185, radius: 42, intensity: 0.98 },
      { x: 235, y: 210, radius: 34, intensity: 0.88 },
      { x: 145, y: 245, radius: 28, intensity: 0.76 },
    ],
    description: 'Dermoscopy revealing marked multiaxial asymmetry, notched scalloped borders, atypical pigment network, focal dark blotches, and central blue-white veil.',
    descriptionFr: 'Dermoscopie révélant une asymétrie marquée, des bords crantés irréguliers, un réseau pigmentaire atypique et un voile bleu-blanc pathognomonique.',
    patientAge: 52,
    patientGender: 'M',
    clinicalHistory: 'Rapidly evolving pigmented macule on upper back with recent bleeding and pruritus over past 3 months.',
    clinicalHistoryFr: 'Lésion pigmentée du haut du dos d évolution rapide avec prurit et saignements occasionnels depuis 3 mois.',
  },
  {
    id: 'derm-nevus',
    name: 'Benign Melanocytic Nevus',
    nameFr: 'Naevus Mélanocytaire Bénin',
    modality: 'dermoscopy',
    groundTruth: 'Melanocytic Nevus (NV)',
    groundTruthFr: 'Naevus Bénin (NV)',
    difficulty: 'Standard',
    sourceDataset: 'ISIC 2019 / HAM10000',
    previewSvg: svgToDataUri(nevusDermSvg),
    gradCamCoords: [
      { x: 200, y: 200, radius: 48, intensity: 0.35 },
    ],
    description: 'Homogeneous, symmetrically distributed melanocytic nevus displaying regular peripheral reticular network and uniform pigmentation fading out gracefully.',
    descriptionFr: 'Naevus mélanocytaire symétrique et homogène avec réseau réticulaire régulier en périphérie et centre harmonieux.',
    patientAge: 29,
    patientGender: 'F',
    clinicalHistory: 'Stable lesion on forearm present since childhood; routine total-body skin examination.',
    clinicalHistoryFr: 'Lésion stable de l avant-bras présente depuis l enfance ; dépistage dermatologique systématique.',
  },
  {
    id: 'mri-glioblastoma',
    name: 'Glioblastoma Multiforme (GBM)',
    nameFr: 'Glioblastome Multiforme (Grade IV)',
    modality: 'brain-mri',
    groundTruth: 'Glioblastoma (WHO Grade IV Glioma)',
    groundTruthFr: 'Glioblastome (Gliome Grade IV OMS)',
    difficulty: 'Complex',
    sourceDataset: 'BraTS 2023 Challenge Benchmark',
    previewSvg: svgToDataUri(brainGbmSvg),
    gradCamCoords: [
      { x: 145, y: 195, radius: 38, intensity: 0.99 },
      { x: 165, y: 180, radius: 24, intensity: 0.92 },
      { x: 130, y: 215, radius: 22, intensity: 0.85 },
    ],
    description: 'Axial T1-weighted post-contrast MRI demonstrating an aggressive heterogeneous ring-enhancing lesion in the right temporal lobe with core necrosis and surrounding vasogenic edema.',
    descriptionFr: 'IRM axiale T1 injectée montrant une volumineuse masse temporale droite à rehaussement annulaire épais, nécrose centrale et œdème vasogénique.',
    patientAge: 64,
    patientGender: 'M',
    clinicalHistory: 'Progressive morning headaches, left hemiparesis, personality alterations, and new-onset focal seizure with secondary generalization.',
    clinicalHistoryFr: 'Céphalées matinales progressives, hémiparésie gauche, troubles du comportement et crise comitiale inaugurale.',
  },
  {
    id: 'retina-pdr',
    name: 'Proliferative Diabetic Retinopathy',
    nameFr: 'Rétinopathie Diabétique Proliférante',
    modality: 'retinopathy',
    groundTruth: 'Severe PDR (Grade 4)',
    groundTruthFr: 'Rétinopathie Proliférante Sévère (Grade 4)',
    difficulty: 'Subtle',
    sourceDataset: 'Messidor-2 & EyePACS Diabetic Retinopathy',
    previewSvg: svgToDataUri(retinopathySvg),
    gradCamCoords: [
      { x: 235, y: 180, radius: 36, intensity: 0.94 },
      { x: 265, y: 155, radius: 28, intensity: 0.88 },
      { x: 205, y: 140, radius: 24, intensity: 0.75 },
    ],
    description: 'Digital color fundus photograph illustrating multiple intraretinal flame hemorrhages, clusters of hard yellow exudates circinating around the macula, and cotton-wool spots.',
    descriptionFr: 'Rétinophotographie montrant de nombreuses hémorragies intra-rétiniennes, des exsudats lipidiques jaunâtres péri-maculaires et des nodules cotonneux.',
    patientAge: 61,
    patientGender: 'F',
    clinicalHistory: 'Type 2 Diabetes Mellitus for 18 years, HbA1c 9.4%, reporting blurred vision, floaters, and difficulty reading fine print.',
    clinicalHistoryFr: 'Diabète de type 2 évoluant depuis 18 ans, HbA1c à 9,4 %, baisse d acuité visuelle bilatérale et myodésopsies.',
  },
];
