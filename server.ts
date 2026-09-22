import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Server-side Gemini initialization
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(apiKey) });
});

// Medical image multimodal diagnostic analysis endpoint
app.post('/api/analyze-medical-image', async (req: Request, res: Response) => {
  try {
    const { image, modality, suspectedCondition, modelArchitecture, language = 'en' } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Extract base64 data and mimeType
    let base64Data = image;
    let mimeType = 'image/jpeg';

    if (image.startsWith('data:')) {
      const parts = image.split(',');
      const match = image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64/);
      if (match) {
        mimeType = match[1];
      }
      base64Data = parts[1] || '';
    }

    if (!ai) {
      return res.json({
        fallback: true,
        message: 'No API key detected. Using scientific simulated inference.',
        data: getSimulatedAnalysis(modality, suspectedCondition, language)
      });
    }

    const systemPrompt = `You are MedVision AI, an expert clinical computer vision and diagnostic radiologist/dermatologist/pathologist assistant.
You specialize in evaluating medical image classifications performed by deep learning convolutional neural networks (CNNs) and transfer learning architectures (ResNet-50, DenseNet-121, EfficientNet, ViT).
Analyze the provided medical image carefully in the context of the user's selected modality: "${modality || 'Auto-detect'}" and model architecture "${modelArchitecture || 'DenseNet-121'}".

CRITICAL INSTRUCTIONS:
1. Provide a rigorous, academic, yet clinically practical diagnostic assessment.
2. Formulate realistic confidence probabilities for the top 4 differential disease classes.
3. Identify visual biomarkers, anatomical landmarks, low/mid/high-level CNN feature patterns, and estimated Grad-CAM focal activation zones.
4. Output language must be ${language === 'fr' ? 'French (Français)' : 'English'}.
5. You MUST return valid JSON adhering exactly to the following JSON schema:
{
  "modalityDetected": "string",
  "anatomicalRegion": "string",
  "primaryDiagnosis": "string",
  "confidence": 94.2,
  "diagnosticSeverity": "Normal" | "Mild" | "Moderate" | "Severe" | "Critical",
  "predictions": [
    {
      "className": "string",
      "probability": 94.2,
      "clinicalSignificance": "string",
      "description": "string"
    }
  ],
  "radiologicalFindings": ["string"],
  "visualBiomarkers": [
    {
      "marker": "string",
      "location": "string",
      "status": "Present" | "Absent" | "Indeterminate",
      "note": "string"
    }
  ],
  "differentialDiagnoses": [
    {
      "condition": "string",
      "likelihood": "High" | "Moderate" | "Low",
      "rationale": "string"
    }
  ],
  "cnnFeatureAnalysis": {
    "lowLevelFeatures": "string describing edges, textures, opacities observed by early Conv layers",
    "midLevelFeatures": "string describing lesion margins, contour regularity, tissue consolidation by intermediate layers",
    "highLevelFeatures": "string describing pathological semantic hallmarks detected by deep bottleneck layers",
    "gradCamFocusArea": "string specifying exact region where high gradient activations concentrate"
  },
  "recommendations": ["string"],
  "clinicalDisclaimer": "string"
}`;

    const promptText = `Conduct a comprehensive medical diagnostic evaluation and deep learning feature interpretation of this image. Suspected context / user note: "${suspectedCondition || 'Routine diagnostic scan'}". Output strictly JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: promptText,
            },
          ],
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = response.text || '';
    try {
      const parsedData = JSON.parse(responseText);
      return res.json({ success: true, data: parsedData });
    } catch (parseError) {
      console.warn('Failed to parse Gemini response as JSON, falling back to simulated analysis', parseError);
      return res.json({
        fallback: true,
        data: getSimulatedAnalysis(modality, suspectedCondition, language),
      });
    }
  } catch (error: any) {
    console.error('Error analyzing medical image:', error);
    return res.status(500).json({
      error: error?.message || 'Medical classification inference failed',
      fallbackData: getSimulatedAnalysis(req.body.modality, req.body.suspectedCondition, req.body.language || 'en'),
    });
  }
});

// Interactive Clinical Assistant / Q&A endpoint
app.post('/api/ask-clinical-assistant', async (req: Request, res: Response) => {
  try {
    const { question, context, language = 'en' } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (!ai) {
      return res.json({
        answer: language === 'fr'
          ? "En mode d'évaluation locale, les réseaux neuronaux convolutifs (CNN) tels que ResNet et DenseNet identifient les biomarqueurs clés par extraction de caractéristiques hiérarchiques. Pour une consultation complète, veuillez configurer une clé API."
          : "In local evaluation mode, Convolutional Neural Networks (CNNs) like ResNet and DenseNet extract hierarchical biomarkers. Configure an active API key for full live consultation."
      });
    }

    const systemPrompt = `You are MedVision AI Clinical Assistant, an expert medical AI researcher, radiologist, and machine learning engineer.
Answer the user's question clearly, scientifically, and accurately.
Context regarding currently loaded medical scan & model: ${JSON.stringify(context || {})}
Language: ${language === 'fr' ? 'French' : 'English'}.
Structure your answer with clear bullet points, clinical rationale, and machine learning context (e.g. transfer learning, Grad-CAM attention, feature representation, data bias). Always include a standard clinical safety disclaimer when discussing medical conditions.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: question }] }],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.4,
      },
    });

    return res.json({ answer: response.text || '' });
  } catch (error: any) {
    console.error('Error in clinical assistant:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to process inquiry',
      answer: 'An error occurred while communicating with the diagnostic assistant. Please try again.'
    });
  }
});

function getSimulatedAnalysis(modality?: string, condition?: string, language: string = 'en') {
  const isFr = language === 'fr';
  const mod = (modality || 'chest-xray').toLowerCase();

  if (mod.includes('derm') || mod.includes('skin')) {
    return {
      modalityDetected: isFr ? 'Dermoscopie (Archive ISIC)' : 'Dermoscopy (ISIC Archive)',
      anatomicalRegion: isFr ? 'Lésion cutanée cutanéo-muqueuse' : 'Cutaneous Skin Lesion',
      primaryDiagnosis: isFr ? 'Mélanome Malin invasif' : 'Malignant Melanoma',
      confidence: 93.8,
      diagnosticSeverity: 'Severe',
      predictions: [
        {
          className: isFr ? 'Mélanome (MEL)' : 'Melanoma (MEL)',
          probability: 93.8,
          clinicalSignificance: isFr ? 'Haute priorité de résection chirurgicale' : 'High urgency for surgical excision',
          description: isFr ? 'Lésion mélanocytaire asymétrique avec réseau pigmentaire atypique' : 'Asymmetric melanocytic lesion with atypical pigment network'
        },
        {
          className: isFr ? 'Naevus bénin (NV)' : 'Benign Nevus (NV)',
          probability: 4.1,
          clinicalSignificance: isFr ? 'Lésion bénigne de référence' : 'Benign reference condition',
          description: isFr ? 'Distribution pigmentaire homogène régulière' : 'Regular homogenous pigment distribution'
        },
        {
          className: isFr ? 'Carcinome Basocellulaire (BCC)' : 'Basal Cell Carcinoma (BCC)',
          probability: 1.6,
          clinicalSignificance: isFr ? 'Néoplasie locale non mélanocytaire' : 'Non-melanocytic local malignancy',
          description: isFr ? 'Télangiectasies arborescentes et nids bleutés' : 'Arborizing telangiectasia and blue-gray ovoid nests'
        },
        {
          className: isFr ? 'Kératose Séborrhéique (BKL)' : 'Seborrheic Keratosis (BKL)',
          probability: 0.5,
          clinicalSignificance: isFr ? 'Pseudotumeur bénigne fréquente' : 'Frequent benign pseudo-tumor',
          description: isFr ? 'Kystes comédoniens et bouchons cornés' : 'Milia-like cysts and comedo-like openings'
        }
      ],
      radiologicalFindings: isFr
        ? ['Asymétrie structurale multiaxe selon la règle ABCDE', 'Bords irréguliers et encoches périphériques', 'Polychromie (brun foncé, noir, voile bleu-blanc focal)', 'Voile blanc bleuâtre caractéristique de prolifération épidermique']
        : ['Structural multiaxial asymmetry complying with ABCDE criteria', 'Irregular jagged border contours with peripheral notches', 'Marked polychromatic variance (dark brown, black, focal blue-white veil)', 'Atypical pigment network with localized regression zones'],
      visualBiomarkers: [
        { marker: isFr ? 'Voile blanc-bleu' : 'Blue-White Veil', location: isFr ? 'Centre de la lésion' : 'Central lesion core', status: 'Present', note: isFr ? 'Signe pathognomonique de néoplasie mélanocytaire invasive' : 'Pathognomonic sign of invasive melanocytic neoplasm' },
        { marker: isFr ? 'Points et globules atypiques' : 'Atypical Dots & Globules', location: isFr ? 'Périphérie radiaire' : 'Radial periphery', status: 'Present', note: isFr ? 'Indique une phase de croissance radiale active' : 'Indicates active radial growth phase' },
        { marker: isFr ? 'Réseau pigmentaire fin régulier' : 'Regular Pigment Network', location: isFr ? 'Bordure externe' : 'Outer margin', status: 'Absent', note: isFr ? 'Réseau absent au profit d une désorganisation totale' : 'Absent in favor of total architectural disarray' }
      ],
      differentialDiagnoses: [
        { condition: isFr ? 'Naevus dysplasique de Clark' : 'Dysplastic Clark Nevus', likelihood: 'Moderate', rationale: isFr ? 'Présente une atypie clinique mais conserve une symétrie globale' : 'Demonstrates clinical atypia but maintains overall architectural symmetry' },
        { condition: isFr ? 'Hématome sous-cornéen' : 'Subcorneal Hematoma', likelihood: 'Low', rationale: isFr ? 'Absence de pattern homogène d extravasation sanguine' : 'Absence of homogenous blood pool extravasation pattern' }
      ],
      cnnFeatureAnalysis: {
        lowLevelFeatures: isFr ? 'Filtres de Gabor et contours de Sobel réagissant aux gradients de forte intensité aux bordures cutanées' : 'Gabor and Sobel early kernels triggered by steep intensity gradients at cutaneous borders',
        midLevelFeatures: isFr ? 'Détection de motifs pigmentaires réticulaires désordonnés et texture granulaire épidermique' : 'Detection of disordered reticular pigment patterns and granular epidermal texture',
        highLevelFeatures: isFr ? 'Cartographie sémantique d atypie mélanocytaire dans les couches résiduelles profondes' : 'Semantic mapping of melanocytic atypia within deep residual feature bottleneck',
        gradCamFocusArea: isFr ? 'Quadrant supérieur droit et centre présentant le voile bleu-blanc' : 'Upper-right quadrant and central core harboring the blue-white veil'
      },
      recommendations: isFr
        ? ['Exérèse chirurgicale complète avec marge de sécurité de 2 mm pour examen histopathologique', 'Revue dermatoscopique numérisée et cartographie corporelle complète', 'Évaluation des ganglions lymphatiques régionaux']
        : ['Urgent complete surgical excisional biopsy with 2mm margin for histopathological staging', 'Full-body dermoscopic digital surveillance & skin mapping', 'Regional lymph node clinical and ultrasound examination'],
      clinicalDisclaimer: isFr
        ? 'Avertissement : Système d aide à la décision à visée expérimentale et pédagogique. Toute suspicion de mélanome requiert une confirmation histologique par un dermatologue qualifié.'
        : 'Disclaimer: Experimental research and educational assistive system. Any suspected melanoma requires urgent biopsy and histopathological confirmation by a licensed dermatologist.'
    };
  } else if (mod.includes('brain') || mod.includes('mri')) {
    return {
      modalityDetected: isFr ? 'IRM Cérébrale Pondérée T1 avec Contraste (Gadolinium)' : 'Brain MRI T1-weighted Post-Contrast (BraTS)',
      anatomicalRegion: isFr ? 'Lobe Temporal Droit / Jonction Pariétale' : 'Right Temporal / Parieto-Occipital Region',
      primaryDiagnosis: isFr ? 'Glioblastome Multiforme (GBM - Grade OMS IV)' : 'Glioblastoma Multiforme (WHO Grade IV)',
      confidence: 96.1,
      diagnosticSeverity: 'Critical',
      predictions: [
        {
          className: isFr ? 'Gliome de Haut Grade / Glioblastome' : 'High-Grade Glioma / Glioblastoma',
          probability: 96.1,
          clinicalSignificance: isFr ? 'Prise en charge neurochirurgicale immédiate' : 'Immediate neurosurgical oncology referral',
          description: isFr ? 'Masse hétérogène avec rehaussement annulaire et nécrose centrale' : 'Heterogeneous ring-enhancing mass with central necrosis and surrounding edema'
        },
        {
          className: isFr ? 'Méningiome atypique' : 'Atypical Meningioma',
          probability: 2.3,
          clinicalSignificance: isFr ? 'Tumeur extra-axiale à rehaussement homogène' : 'Extra-axial tumor with dural tail sign',
          description: isFr ? 'Absence de queue durale nette, localisation intra-axiale dominante' : 'Lacks typical dural tail sign; predominantly intra-axial'
        },
        {
          className: isFr ? 'Adénome hypophysaire' : 'Pituitary Adenoma',
          probability: 0.9,
          clinicalSignificance: isFr ? 'Lésion sellaire / suprasellaire' : 'Sellar/suprasellar mass',
          description: isFr ? 'Incompatible avec la localisation temporo-pariétale' : 'Incompatible with temporoparietal parenchymal epicenter'
        },
        {
          className: isFr ? 'Tissu cérébral sain (Normatif)' : 'Healthy Normal Tissue',
          probability: 0.7,
          clinicalSignificance: isFr ? 'Exclusion de bénignité' : 'Rule out benign normal variant',
          description: isFr ? 'Effet de masse majeur invalidant la normalité' : 'Significant mass effect rules out healthy baseline'
        }
      ],
      radiologicalFindings: isFr
        ? ['Volumineuse lésion expansive intra-axiale temporale droite', 'Prise de contraste annulaire nodulaire et irrégulière en périphérie', 'Importante zone de nécrose centrale non rehaussée', 'Œdème vasogénique péri-lésionnel étendu avec refoulement du ventricule latéral']
        : ['Large intra-axial right temporal space-occupying lesion', 'Thick, nodular, irregular peripheral ring enhancement post-contrast', 'Extensive central non-enhancing core corresponding to tumor necrosis', 'Substantial peritumoral vasogenic vasogenic edema with mass effect and ventricular effacement'],
      visualBiomarkers: [
        { marker: isFr ? 'Rehaussement annulaire épais' : 'Thick Ring Enhancement', location: isFr ? 'Marge tumorale externe' : 'Outer tumor margin', status: 'Present', note: isFr ? 'Signe cardinal de néoangiogenèse tumorale agressive' : 'Cardinal sign of high-grade tumor neoangiogenesis' },
        { marker: isFr ? 'Nécrose centrale' : 'Central Necrosis', location: isFr ? 'Centre de la masse' : 'Core epicenter', status: 'Present', note: isFr ? 'Hypointensité T1 correspondant à une hypoxie tissulaire sévère' : 'T1 hypointensity indicative of severe ischemic cell death' },
        { marker: isFr ? 'Déviation de la ligne médiane' : 'Midline Shift', location: isFr ? 'Faux du cerveau / Septum' : 'Falx / Septum pellucidum', status: 'Present', note: isFr ? 'Déviation mesurée à environ 4 mm vers la gauche' : 'Measurable 4mm shift towards contralateral hemisphere' }
      ],
      differentialDiagnoses: [
        { condition: isFr ? 'Métastase cérébrale unique' : 'Solitary Brain Metastasis', likelihood: 'Moderate', rationale: isFr ? 'Aspect en anneau similaire mais jonction substance blanche/grise moins infiltrante' : 'Similar ring pattern but metastases typically show sharper margins at grey-white junction' },
        { condition: isFr ? 'Abcès cérébral pyogène' : 'Pyogenic Brain Abscess', likelihood: 'Low', rationale: isFr ? 'La paroi de l abcès est classiquement lisse et fine côté ventriculaire' : 'Abscess capsule typically displays smooth thin inner ring without nodular infiltration' }
      ],
      cnnFeatureAnalysis: {
        lowLevelFeatures: isFr ? 'Contraste hyperintense aigu sur la bordure externe révélé par les filtres de convolution initiaux' : 'Sharp hyperintense gradient contrast on outer rim identified by early conv kernels',
        midLevelFeatures: isFr ? 'Différenciation de texture entre œdème vasogénique hypointense et stroma tumoral' : 'Texture discrimination between vasogenic hypointense edema and viable tumor stroma',
        highLevelFeatures: isFr ? 'Reconnaissance du schéma géométrique annulaire caractéristique des gliomes de grade IV' : 'Holistic annular geometry recognition characteristic of WHO Grade IV gliomas',
        gradCamFocusArea: isFr ? 'Bordure antéro-latérale hypervasculaire rehaussée' : 'Anterolateral hypervascular enhanced neoplastic rim'
      },
      recommendations: isFr
        ? ['Concertation pluridisciplinaire urgente en neuro-oncologie (RCP)', 'IRM spectroscopique et perfusionnelle pour cartographie métabolique (pic de choline, baisse de NAA)', 'Évaluation pour craniotomie avec résection guidée par fluorescence 5-ALA']
        : ['Urgent multidisciplinary neuro-oncology tumor board review', 'MR Spectroscopy and Perfusion imaging to map choline/NAA ratios and rCBV', 'Neurosurgical surgical resection planning (5-ALA fluorescence guided craniotomy)'],
      clinicalDisclaimer: isFr
        ? 'Avertissement : Outil de recherche et d analyse algorithmique. Ne remplace pas le diagnostic d un neuro-radiologue certifié.'
        : 'Disclaimer: Deep learning research simulation tool. Does not substitute formal clinical diagnosis by a board-certified neuroradiologist.'
    };
  }

  // Default: Chest X-Ray (NIH / RSNA)
  return {
    modalityDetected: isFr ? 'Radiographie Thoracique Face (PA)' : 'Frontal Chest Radiograph (PA View)',
    anatomicalRegion: isFr ? 'Champs Pulmonaires & Silhouette Cardiaque' : 'Bilateral Lung Fields & Cardiac Silhouette',
    primaryDiagnosis: isFr ? 'Pneumopathie Bactérienne Lobaire Droite' : 'Right Middle/Lower Lobe Bacterial Pneumonia',
    confidence: 94.6,
    diagnosticSeverity: 'Moderate',
    predictions: [
      {
        className: isFr ? 'Pneumonie Bactérienne' : 'Bacterial Pneumonia',
        probability: 94.6,
        clinicalSignificance: isFr ? 'Foyer de condensation alvéolaire nécessitant antibiothérapie' : 'Alveolar consolidation warranting targeted antibiotic regimen',
        description: isFr ? 'Opacité alvéolaire systématisée du lobe moyen et base droite' : 'Systematized alveolar airspace opacity with air bronchograms'
      },
      {
        className: isFr ? 'Épanchement Pleural Associé' : 'Pleural Effusion',
        probability: 3.2,
        clinicalSignificance: isFr ? 'Complication réactionnelle parapneumonique fréquente' : 'Secondary parapneumonic fluid accumulation in sulcus',
        description: isFr ? 'Comblement partiel du cul-de-sac costo-diaphragmatique droit' : 'Blunting of the right costophrenic angle'
      },
      {
        className: isFr ? 'Atélectasie / Collapsus' : 'Atelectasis',
        probability: 1.4,
        clinicalSignificance: isFr ? 'Perte de volume parenchymateux localisée' : 'Localized parenchymal volume loss',
        description: isFr ? 'Absence d attraction médiastinale majeure' : 'Minimal mediastinal shift excluding major lobar collapse'
      },
      {
        className: isFr ? 'Radiographie Normale' : 'Normal / No Finding',
        probability: 0.8,
        clinicalSignificance: isFr ? 'Exclusion de normalité' : 'Rule out healthy chest baseline',
        description: isFr ? 'Infiltrat alvéolaire manifeste invalidant l absence de lésion' : 'Clear consolidation rules out normal baseline'
      }
    ],
    radiologicalFindings: isFr
      ? ['Opacité en verre dépoli et condensation dense de la base pulmonaire droite', 'Présence de bronchogrammes aériques au sein de la condensation', 'Effacement partiel du bord droit de la silhouette cardiaque (signe de la silhouette positif)', 'Index cardiothoracique dans les limites normales (< 0.50)']
      : ['Focal alveolar airspace consolidation in the right middle/lower lung zone', 'Conspicuous air bronchograms traversing the consolidated parenchyma', 'Loss of clear right hemidiaphragmatic and cardiac border (positive silhouette sign)', 'Normal cardiothoracic ratio (< 0.50) without cardiomegaly'],
    visualBiomarkers: [
      { marker: isFr ? 'Bronchogramme Aérique' : 'Air Bronchogram', location: isFr ? 'Lobe moyen droit' : 'Right mid-to-lower zone', status: 'Present', note: isFr ? 'Confirmation directe d un processus alvéolaire infectieux' : 'Definitive confirmation of alveolar airspace filling process' },
      { marker: isFr ? 'Cardiomégalie' : 'Cardiomegaly', location: isFr ? 'Silhouette cardiaque' : 'Cardiac silhouette', status: 'Absent', note: isFr ? 'Index cardioradiographique préservé' : 'Preserved transverse cardiac diameter' },
      { marker: isFr ? 'Pneumothorax' : 'Pneumothorax', location: isFr ? 'Apex bilatéraux' : 'Bilateral apices', status: 'Absent', note: isFr ? 'Trame vasculaire visible jusqu aux plèvres pariétales' : 'Vascular lung markings track cleanly to parietal pleura' }
    ],
    differentialDiagnoses: [
      { condition: isFr ? 'Pneumopathie Virale (ex: COVID-19)' : 'Viral Pneumonia (e.g. COVID-19)', likelihood: 'Low', rationale: isFr ? 'La condensation est unilatérale et focale plutôt que bilatérale périphérique' : 'Presentation is focal and unilateral rather than peripheral bilateral patchy glass' },
      { condition: isFr ? 'Infarctus Pulmonaire / Embolie' : 'Pulmonary Infarction', likelihood: 'Low', rationale: isFr ? 'Pas de coin de Hampton classique en coin pleural' : 'Absence of classic wedge-shaped Hampton hump abutment' }
    ],
    cnnFeatureAnalysis: {
      lowLevelFeatures: isFr ? 'Perte des gradients de netteté vasculaire et estompement des contours costaux' : 'Loss of sharp bronchovascular gradients and attenuation of rib contour contrast',
      midLevelFeatures: isFr ? 'Texture floconneuse d opacité alvéolaire détectée dans les blocs résiduels intermédiaires' : 'Cotton-wool alveolar consolidation texture identified in intermediate Conv blocks',
      highLevelFeatures: isFr ? 'Association spatiale entre la projection pulmonaire lobaire et la signature spectrale d infection' : 'Spatial association between lobar anatomical region and infectious spectral signature',
      gradCamFocusArea: isFr ? 'Champ pulmonaire inférieur droit, centré sur la zone de condensation alvéolaire' : 'Right lower lung zone, centered directly over the alveolar consolidation focus'
    },
    recommendations: isFr
      ? ['Corrélation clinique immédiate (température, auscultation crépitante, saturation SpO2)', 'Mise en route d une antibiothérapie ciblée selon recommandations locales', 'Contrôle radiographique à J+21 pour vérifier la résorption complète de l infiltrat']
      : ['Immediate clinical correlation (fever, auscultatory rales, SpO2 pulse oximetry)', 'Initiation of empiric guideline-concordant antimicrobial therapy', 'Repeat chest radiograph in 4-6 weeks to document complete radiological resolution and rule out underlying endobronchial lesion'],
    clinicalDisclaimer: isFr
      ? 'Avertissement médical : MedVision AI est un système de recherche et de simulation algorithmique. Ne remplace pas l avis clinique d un radiologue ou médecin.'
      : 'Medical Disclaimer: MedVision AI is an educational and algorithmic research system. Does not replace professional diagnostic evaluation by a certified physician.'
  };
}

// Full-stack Vite dev server or static production serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MedVision AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
