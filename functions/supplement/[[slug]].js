/**
 * Cloudflare Pages Function: /supplement/:slug
 *
 * SSR Worker that renders programmatic SEO pages for individual supplements.
 * Example: /supplement/melatonin, /supplement/vitamin-d, /supplement/ashwagandha
 *
 * - Queries D1 `benda-ingredients` database for supplement data
 * - Renders bilingual Hebrew+English HTML with JSON-LD structured data
 * - FAQPage, ChemicalSubstance, BreadcrumbList schemas
 * - Consistent design with iherbchecker.com landing page
 */

// ── Top 30 supplements with Hebrew names and metadata ──────────
const SUPPLEMENTS = {
  'melatonin': {
    en: 'Melatonin', he: 'מלטונין',
    category: 'שינה ומנוחה', categoryEn: 'Sleep & Relaxation',
    isPrescription: true,
    prescriptionNote: 'מלטונין מוגדר בישראל כתרופת מרשם בלבד. התכשיר היחיד המאושר הוא Circadin 2mg (מלטונין בשחרור מושהה), הנמכר בבתי מרקחת עם מרשם רופא.',
    prescriptionNoteEn: 'Melatonin is classified as a prescription-only drug in Israel. The only approved product is Circadin 2mg (prolonged-release melatonin), sold in pharmacies with a doctor\'s prescription.',
    extraContent: {
      he: `<h2>חקירת כאן חדשות - דצמבר 2025</h2>
<p>בדצמבר 2025 שידרה כאן חדשות חקירה מקיפה על יבוא מלטונין לישראל דרך אתרי אינטרנט כמו iHerb. החקירה חשפה כי אלפי ישראלים מזמינים מלטונין מ-iHerb במינונים של 5-10mg - פי 2.5 עד 5 מהמינון המאושר בישראל (2mg). משרד הבריאות הוציא אזהרה רשמית בעקבות החקירה.</p>
<h2>אזהרות משרד הבריאות</h2>
<p>משרד הבריאות מזהיר כי שימוש במלטונין ללא פיקוח רפואי עלול לגרום לתופעות לוואי כגון: כאבי ראש, סחרחורת, בחילות, ונמנום ביום. בילדים, מלטונין עלול להשפיע על התפתחות הורמונלית. המשרד מדגיש כי יש להתייעץ עם רופא לפני נטילת מלטונין.</p>`,
      en: `<h2>Kan News Investigation - December 2025</h2>
<p>In December 2025, Kan News aired a comprehensive investigation into melatonin imports to Israel via websites like iHerb. The investigation revealed that thousands of Israelis order melatonin from iHerb at doses of 5-10mg - 2.5 to 5 times the approved Israeli dose (2mg). The Ministry of Health issued an official warning following the investigation.</p>
<h2>Ministry of Health Warnings</h2>
<p>The Ministry of Health warns that using melatonin without medical supervision may cause side effects including: headaches, dizziness, nausea, and daytime drowsiness. In children, melatonin may affect hormonal development. The Ministry emphasizes consulting a doctor before taking melatonin.</p>`
    }
  },
  'vitamin-d': {
    en: 'Vitamin D', he: 'ויטמין D',
    category: 'ויטמינים', categoryEn: 'Vitamins',
    isPrescription: false,
    dbAliases: ['vitamin d', 'vitamin d3', 'cholecalciferol']
  },
  'ashwagandha': {
    en: 'Ashwagandha', he: 'אשוואגנדה',
    category: 'צמחי מרפא', categoryEn: 'Herbal Supplements',
    isPrescription: false,
    dbAliases: ['ashwagandha', 'withania somnifera']
  },
  'magnesium': {
    en: 'Magnesium', he: 'מגנזיום',
    category: 'מינרלים', categoryEn: 'Minerals',
    isPrescription: false,
    dbAliases: ['magnesium', 'magnesium glycinate', 'magnesium citrate']
  },
  'zinc': {
    en: 'Zinc', he: 'אבץ',
    category: 'מינרלים', categoryEn: 'Minerals',
    isPrescription: false,
  },
  'omega-3': {
    en: 'Omega-3', he: 'אומגה 3',
    category: 'שומנים חיוניים', categoryEn: 'Essential Fatty Acids',
    isPrescription: false,
    dbAliases: ['omega-3', 'fish oil', 'EPA', 'DHA']
  },
  'vitamin-b12': {
    en: 'Vitamin B12', he: 'ויטמין B12',
    category: 'ויטמינים', categoryEn: 'Vitamins',
    isPrescription: false,
    dbAliases: ['vitamin b12', 'methylcobalamin', 'cyanocobalamin']
  },
  'iron': {
    en: 'Iron', he: 'ברזל',
    category: 'מינרלים', categoryEn: 'Minerals',
    isPrescription: false,
  },
  'collagen': {
    en: 'Collagen', he: 'קולגן',
    category: 'עור ויופי', categoryEn: 'Skin & Beauty',
    isPrescription: false,
  },
  'probiotics': {
    en: 'Probiotics', he: 'פרוביוטיקה',
    category: 'עיכול', categoryEn: 'Digestive Health',
    isPrescription: false,
    dbAliases: ['probiotics', 'lactobacillus', 'bifidobacterium']
  },
  'vitamin-c': {
    en: 'Vitamin C', he: 'ויטמין C',
    category: 'ויטמינים', categoryEn: 'Vitamins',
    isPrescription: false,
    dbAliases: ['vitamin c', 'ascorbic acid']
  },
  'biotin': {
    en: 'Biotin', he: 'ביוטין',
    category: 'ויטמינים', categoryEn: 'Vitamins',
    isPrescription: false,
  },
  '5-htp': {
    en: '5-HTP', he: '5-HTP',
    category: 'מצב רוח ושינה', categoryEn: 'Mood & Sleep',
    isPrescription: false,
    dbAliases: ['5-htp', '5-hydroxytryptophan']
  },
  'coq10': {
    en: 'CoQ10', he: 'קו-אנזים Q10',
    category: 'אנרגיה ולב', categoryEn: 'Energy & Heart',
    isPrescription: false,
    dbAliases: ['coq10', 'coenzyme q10', 'ubiquinone']
  },
  'curcumin': {
    en: 'Curcumin (Turmeric)', he: 'כורכומין',
    category: 'צמחי מרפא', categoryEn: 'Herbal Supplements',
    isPrescription: false,
    dbAliases: ['curcumin', 'turmeric', 'curcuma longa']
  },
  'creatine': {
    en: 'Creatine', he: 'קראטין',
    category: 'ספורט וכושר', categoryEn: 'Sports & Fitness',
    isPrescription: false,
  },
  'glutathione': {
    en: 'Glutathione', he: 'גלוטתיון',
    category: 'נוגדי חמצון', categoryEn: 'Antioxidants',
    isPrescription: false,
  },
  'dhea': {
    en: 'DHEA', he: 'DHEA',
    category: 'הורמונים', categoryEn: 'Hormones',
    isPrescription: true,
    prescriptionNote: 'DHEA הוא הורמון סטרואידי שמוגדר בישראל כתרופת מרשם. יבוא ושימוש ללא מרשם רופא אסורים על פי חוק.',
    prescriptionNoteEn: 'DHEA is a steroid hormone classified as a prescription drug in Israel. Import and use without a doctor\'s prescription is prohibited by law.',
  },
  'same': {
    en: 'SAMe', he: 'SAMe',
    category: 'מצב רוח', categoryEn: 'Mood Support',
    isPrescription: false,
    dbAliases: ['same', 's-adenosylmethionine']
  },
  'st-johns-wort': {
    en: 'St. John\'s Wort', he: 'סנט ג\'ון וורט',
    category: 'צמחי מרפא', categoryEn: 'Herbal Supplements',
    isPrescription: false,
    dbAliases: ['st. john\'s wort', 'hypericum perforatum']
  },
  'folic-acid': {
    en: 'Folic Acid', he: 'חומצת פולית',
    category: 'ויטמינים', categoryEn: 'Vitamins',
    isPrescription: false,
    dbAliases: ['folic acid', 'folate', 'methylfolate']
  },
  'calcium': {
    en: 'Calcium', he: 'סידן',
    category: 'מינרלים', categoryEn: 'Minerals',
    isPrescription: false,
  },
  'potassium': {
    en: 'Potassium', he: 'אשלגן',
    category: 'מינרלים', categoryEn: 'Minerals',
    isPrescription: false,
  },
  'selenium': {
    en: 'Selenium', he: 'סלניום',
    category: 'מינרלים', categoryEn: 'Minerals',
    isPrescription: false,
  },
  'chromium': {
    en: 'Chromium', he: 'כרום',
    category: 'מינרלים', categoryEn: 'Minerals',
    isPrescription: false,
    dbAliases: ['chromium', 'chromium picolinate']
  },
  'valerian': {
    en: 'Valerian', he: 'ולריאן',
    category: 'צמחי מרפא', categoryEn: 'Herbal Supplements',
    isPrescription: false,
    dbAliases: ['valerian', 'valeriana officinalis']
  },
  'l-theanine': {
    en: 'L-Theanine', he: 'ל-תאנין',
    category: 'מצב רוח ושינה', categoryEn: 'Mood & Sleep',
    isPrescription: false,
    dbAliases: ['l-theanine', 'theanine']
  },
  'berberine': {
    en: 'Berberine', he: 'ברברין',
    category: 'צמחי מרפא', categoryEn: 'Herbal Supplements',
    isPrescription: false,
  },
  'quercetin': {
    en: 'Quercetin', he: 'קוורצטין',
    category: 'נוגדי חמצון', categoryEn: 'Antioxidants',
    isPrescription: false,
  },
};

// ── Upper intake limits (mirrored from check.js for SSR) ───────
const UPPER_LIMITS = {
  'melatonin': { ul: null, unit: 'mg', note: 'תרופת מרשם בישראל', noteEn: 'Prescription drug in Israel', typical: '0.5-5mg' },
  'vitamin d': { ul: 100, unit: 'mcg (4000 IU)', note: 'רעילות: היפרקלצמיה', noteEn: 'Toxicity: hypercalcemia' },
  'vitamin c': { ul: 2000, unit: 'mg', note: 'הפרעות עיכול', noteEn: 'GI disturbances' },
  'vitamin b12': { ul: null, unit: 'mcg', note: 'אין UL רשמי - חומר מים סיסי', noteEn: 'No established UL - water soluble' },
  'magnesium': { ul: 350, unit: 'mg', note: 'שלשולים ממקור תוסף', noteEn: 'Diarrhea from supplemental sources' },
  'zinc': { ul: 40, unit: 'mg', note: 'חוסר נחושת, ירידה בחיסון', noteEn: 'Copper deficiency, immune suppression' },
  'iron': { ul: 45, unit: 'mg', note: 'הפרעות עיכול; רעילות בילדים', noteEn: 'GI distress; toxic in children' },
  'calcium': { ul: 2500, unit: 'mg', note: 'אבני כליות, הפרעות לב', noteEn: 'Kidney stones, cardiac issues' },
  'selenium': { ul: 400, unit: 'mcg', note: 'סלנוזיס: נשירת שיער, בחילות', noteEn: 'Selenosis: hair loss, nausea' },
  'chromium': { ul: null, unit: 'mcg', note: 'אין UL רשמי; זהירות מעל 1000mcg', noteEn: 'No established UL; caution above 1000mcg' },
  'folic acid': { ul: 1000, unit: 'mcg', note: 'מסווה חוסר B12', noteEn: 'May mask B12 deficiency' },
  'biotin': { ul: null, unit: 'mcg', note: 'אין UL רשמי', noteEn: 'No established UL' },
  'potassium': { ul: null, unit: 'mg', note: 'מתן IV בלבד עם מינון גבוה; נדיר מתוספים', noteEn: 'High-dose IV only; rare from supplements' },
};

// ── Security headers ───────────────────────────────────────────
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'none'; img-src 'self' data:; connect-src 'self'",
};

// ── Helper: escape HTML to prevent XSS ────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ── Helper: escape for JSON-LD (prevent injection) ─────────────
function escJsonLd(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/<\/script/gi, '<\\/script');
}

// ── DB query helper ──────────────────────────────────────────
async function queryDB(db, supplementKey, supplementData) {
  const results = {
    ingredients: [],
    additives: [],
    regulatory: [],
  };

  if (!db) return results;

  try {
    // Search by name (primary)
    const searchTerms = [supplementData.en.toLowerCase()];
    if (supplementData.dbAliases) {
      searchTerms.push(...supplementData.dbAliases.map(a => a.toLowerCase()));
    }

    for (const term of searchTerms) {
      try {
        const ingResult = await db.prepare(
          `SELECT name, safety_score, concern_level, regulatory_status, description, hebrew_name
           FROM ingredients
           WHERE LOWER(name) LIKE ?
           LIMIT 5`
        ).bind(`%${term}%`).all();
        if (ingResult?.results) {
          results.ingredients.push(...ingResult.results);
        }
      } catch (e) {
        // Table may not exist, continue
      }

      try {
        const addResult = await db.prepare(
          `SELECT common_name, e_number, safety_score, iarc_group, health_concerns, eu_status, us_status, hebrew_name, adi
           FROM food_additives
           WHERE LOWER(common_name) LIKE ? OR LOWER(e_number) LIKE ?
           LIMIT 5`
        ).bind(`%${term}%`, `%${term}%`).all();
        if (addResult?.results) {
          results.additives.push(...addResult.results);
        }
      } catch (e) {
        // Table may not exist, continue
      }

      try {
        const regResult = await db.prepare(
          `SELECT list_name, status, details, ingredient_name
           FROM regulatory_lists
           WHERE LOWER(ingredient_name) LIKE ?
           LIMIT 10`
        ).bind(`%${term}%`).all();
        if (regResult?.results) {
          results.regulatory.push(...regResult.results);
        }
      } catch (e) {
        // Table may not exist, continue
      }
    }

    // Deduplicate by name
    const seenIng = new Set();
    results.ingredients = results.ingredients.filter(r => {
      const key = (r.name || '').toLowerCase();
      if (seenIng.has(key)) return false;
      seenIng.add(key);
      return true;
    });

    const seenAdd = new Set();
    results.additives = results.additives.filter(r => {
      const key = (r.common_name || '').toLowerCase();
      if (seenAdd.has(key)) return false;
      seenAdd.add(key);
      return true;
    });

  } catch (e) {
    console.error('DB query error:', e.message);
  }

  return results;
}

// ── Generate the full HTML page ─────────────────────────────
function renderPage(slug, supp, dbData) {
  const canonical = `https://iherbchecker.com/supplement/${escHtml(slug)}`;
  const nameEn = escHtml(supp.en);
  const nameHe = escHtml(supp.he);
  const categoryHe = escHtml(supp.category);
  const categoryEn = escHtml(supp.categoryEn);

  // Build safety info from DB
  let safetyScore = null;
  let healthConcerns = null;
  let euStatus = null;
  let usStatus = null;
  let adi = null;
  let description = null;

  if (dbData.ingredients.length > 0) {
    const ing = dbData.ingredients[0];
    safetyScore = ing.safety_score;
    description = ing.description;
  }
  if (dbData.additives.length > 0) {
    const add = dbData.additives[0];
    if (!safetyScore) safetyScore = add.safety_score;
    healthConcerns = add.health_concerns;
    euStatus = add.eu_status;
    usStatus = add.us_status;
    adi = add.adi;
  }

  // Upper limit info
  const ulKey = supp.en.toLowerCase().replace(/\(.*\)/, '').trim();
  const ulData = UPPER_LIMITS[ulKey] || null;

  // Prescription status
  const isPrescription = supp.isPrescription || false;

  // Build regulatory info section
  let regulatoryHtml = '';
  if (dbData.regulatory.length > 0) {
    regulatoryHtml = `<div class="info-card">
<h2>מעמד רגולטורי | Regulatory Status</h2>
<div class="reg-list">`;
    for (const reg of dbData.regulatory.slice(0, 5)) {
      regulatoryHtml += `<div class="reg-item">
<span class="reg-list-name">${escHtml(reg.list_name)}</span>
<span class="reg-status">${escHtml(reg.status)}</span>
${reg.details ? `<p class="reg-details">${escHtml(reg.details)}</p>` : ''}
</div>`;
    }
    regulatoryHtml += `</div></div>`;
  }

  // FAQ items
  const faqItems = [
    {
      q_he: `האם ${nameHe} חוקי בישראל?`,
      q_en: `Is ${nameEn} legal in Israel?`,
      a_he: isPrescription
        ? `${nameHe} מוגדר בישראל כתרופת מרשם. רכישתו מ-iHerb ללא מרשם רופא היא בניגוד לחוק הישראלי. יש לקבל מרשם מרופא ולרכוש בבית מרקחת מורשה.`
        : `${nameHe} נמכר בישראל כתוסף תזונה ואינו דורש מרשם רופא. ניתן לרכוש אותו באופן חוקי מ-iHerb וממקורות אחרים. עם זאת, מומלץ להתייעץ עם רופא לפני השימוש.`,
      a_en: isPrescription
        ? `${nameEn} is classified as a prescription drug in Israel. Purchasing it from iHerb without a prescription violates Israeli law. A doctor's prescription is required, and it must be purchased from a licensed pharmacy.`
        : `${nameEn} is sold in Israel as a dietary supplement and does not require a prescription. It can be legally purchased from iHerb and other sources. However, consulting a doctor before use is recommended.`,
    },
    {
      q_he: `מה המינון המקסימלי של ${nameHe}?`,
      q_en: `What is the maximum safe dose of ${nameEn}?`,
      a_he: ulData
        ? (ulData.ul
          ? `המינון העליון המומלץ (UL) של ${nameHe} הוא ${ulData.ul} ${ulData.unit} ליום למבוגרים. ${ulData.note}. חשוב לא לחרוג ממינון זה ללא פיקוח רפואי.`
          : `אין מינון עליון (UL) רשמי עבור ${nameHe}. ${ulData.note}. ${ulData.typical ? `מינון מקובל: ${ulData.typical}.` : ''} מומלץ להתייעץ עם רופא לגבי המינון המתאים.`)
        : `לא נקבע מינון עליון רשמי (UL) עבור ${nameHe}. מומלץ לעקוב אחרי ההוראות על גבי המוצר ולהתייעץ עם רופא או תזונאי.`,
      a_en: ulData
        ? (ulData.ul
          ? `The Tolerable Upper Intake Level (UL) for ${nameEn} is ${ulData.ul} ${ulData.unit} per day for adults. ${ulData.noteEn || ulData.note}. Do not exceed this dose without medical supervision.`
          : `There is no established Upper Intake Level (UL) for ${nameEn}. ${ulData.noteEn || ulData.note}. ${ulData.typical ? `Typical dose: ${ulData.typical}.` : ''} Consult a doctor for appropriate dosing.`)
        : `No official Tolerable Upper Intake Level (UL) has been established for ${nameEn}. Follow product label instructions and consult a healthcare professional.`,
    },
    {
      q_he: `האם ${nameHe} נמכר כתרופת מרשם?`,
      q_en: `Is ${nameEn} prescription-only?`,
      a_he: isPrescription
        ? `כן, ${nameHe} מסווג בישראל כתרופת מרשם. ${supp.prescriptionNote || ''} יש צורך במרשם רופא לרכישתו.`
        : `לא, ${nameHe} אינו תרופת מרשם בישראל ונמכר כתוסף תזונה. ניתן לרכוש אותו ללא מרשם בחנויות טבע, בתי מרקחת ובאתרי אינטרנט כמו iHerb.`,
      a_en: isPrescription
        ? `Yes, ${nameEn} is classified as a prescription drug in Israel. ${supp.prescriptionNoteEn || ''} A doctor's prescription is required for purchase.`
        : `No, ${nameEn} is not a prescription drug in Israel and is sold as a dietary supplement. It can be purchased without a prescription at health stores, pharmacies, and websites like iHerb.`,
    },
  ];

  // JSON-LD: FAQPage
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(f => ({
      '@type': 'Question',
      name: f.q_he,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a_he,
      }
    }))
  };

  // JSON-LD: BreadcrumbList
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'iHerb Checker', item: 'https://iherbchecker.com' },
      { '@type': 'ListItem', position: 2, name: `${supp.en} (${supp.he})`, item: canonical },
    ]
  };

  // JSON-LD: ChemicalSubstance
  const chemJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ChemicalSubstance',
    name: supp.en,
    alternateName: supp.he,
    description: `${supp.en} (${supp.he}) - supplement safety information for Israeli consumers. ${isPrescription ? 'Prescription-only in Israel.' : 'Available as a dietary supplement in Israel.'}`,
    url: canonical,
  };

  // Meta description
  const metaDesc = isPrescription
    ? `${supp.he} (${supp.en}) - תרופת מרשם בישראל. מידע על מעמד חוקי, מינון מקסימלי, ובטיחות. בדוק מוצרי iHerb עם iHerb Checker.`
    : `${supp.he} (${supp.en}) - מידע על בטיחות, מינון מקסימלי, ומעמד חוקי בישראל. בדוק מוצרי iHerb המכילים ${supp.he}.`;

  const metaDescEn = isPrescription
    ? `${supp.en} (${supp.he}) - Prescription drug in Israel. Legal status, maximum dosage, and safety information. Check iHerb products with iHerb Checker.`
    : `${supp.en} (${supp.he}) - Safety info, maximum dosage, and legal status in Israel. Check iHerb products containing ${supp.en}.`;

  // Page title
  const pageTitle = `${supp.he} (${supp.en}) - מידע בטיחות | iHerb Checker`;

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${escHtml(pageTitle)}</title>
<meta name="description" content="${escHtml(metaDesc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${escHtml(supp.he)} (${nameEn}) - iHerb Checker">
<meta property="og:description" content="${escHtml(metaDescEn)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="iHerb Checker">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escHtml(supp.he)} (${nameEn}) - iHerb Checker">
<meta name="twitter:description" content="${escHtml(metaDescEn)}">
<meta name="theme-color" content="#f0f7f4">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(faqJsonLd)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>
<script type="application/ld+json">${JSON.stringify(chemJsonLd)}</script>
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{
--bg:#f7faf8;--surface:#fff;--card:#fff;--border:#e2ebe6;--border-hover:#c8d9cf;
--text:#1a2e23;--text-2:#5a7a68;--text-3:#8fa89a;
--green:#0d7a3e;--green-light:#e8f5ee;--green-glow:rgba(13,122,62,.12);--green-soft:#d4edde;
--red:#c0392b;--red-light:#fdecea;--red-border:rgba(192,57,43,.2);
--yellow:#d4a017;--yellow-light:#fef9e7;--yellow-border:rgba(212,160,23,.25);
--blue:#2471a3;--blue-light:#ebf5fb;--blue-border:rgba(36,113,163,.2);
--teal:#148f77;
--radius:12px;--radius-lg:18px;
--font:'Heebo',sans-serif;
--shadow-sm:0 1px 3px rgba(26,46,35,.06);
--shadow-md:0 4px 16px rgba(26,46,35,.08);
--shadow-lg:0 8px 32px rgba(26,46,35,.1);
}
html{font-family:var(--font);background:var(--bg);color:var(--text);-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{min-height:100dvh;overflow-x:hidden;line-height:1.7}
a{color:var(--green);text-decoration:none}
a:hover{text-decoration:underline}
.wrap{max-width:720px;margin:0 auto;padding:0 20px}
header{position:sticky;top:0;z-index:90;background:rgba(247,250,248,.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--border);padding:12px 0}
header .wrap{display:flex;align-items:center;justify-content:space-between}
.logo{font-size:20px;font-weight:800;letter-spacing:-.03em;display:flex;align-items:center;gap:2px;text-decoration:none}
.logo .shield{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;background:var(--green);border-radius:8px;margin-inline-end:8px}
.logo .shield svg{width:16px;height:16px;fill:#fff}
.logo .iherb{color:var(--green)}
.logo .checker{color:var(--text)}
.breadcrumb{font-size:13px;color:var(--text-3);padding:16px 0 0;display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.breadcrumb a{color:var(--text-2);font-weight:600}
.breadcrumb span{color:var(--text-3)}
.hero-section{padding:40px 0 32px;text-align:center}
.hero-section h1{font-size:clamp(28px,6vw,40px);font-weight:900;letter-spacing:-.04em;line-height:1.2;margin-bottom:12px}
.hero-section .category-badge{display:inline-block;background:var(--green-light);color:var(--green);padding:5px 16px;border-radius:20px;font-size:13px;font-weight:700;margin-bottom:16px;border:1px solid var(--green-soft)}
.hero-section .subtitle{font-size:16px;color:var(--text-2);max-width:560px;margin:0 auto;line-height:1.7}
.prescription-banner{background:var(--red-light);border:2px solid var(--red-border);border-radius:var(--radius);padding:18px 22px;margin:24px 0;display:flex;align-items:flex-start;gap:12px;line-height:1.7}
.prescription-banner .icon{font-size:24px;flex-shrink:0;margin-top:2px}
.prescription-banner .content{flex:1}
.prescription-banner h3{color:var(--red);font-size:16px;font-weight:800;margin-bottom:4px}
.prescription-banner p{color:#7a2921;font-size:14px}
.info-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px;margin-bottom:16px;box-shadow:var(--shadow-sm);transition:border-color .2s}
.info-card:hover{border-color:var(--border-hover)}
.info-card h2{font-size:20px;font-weight:800;color:var(--text);margin-bottom:16px;letter-spacing:-.02em;padding-bottom:12px;border-bottom:1px solid var(--border)}
.info-card p{font-size:15px;color:var(--text-2);line-height:1.8;margin-bottom:12px}
.info-card p:last-child{margin-bottom:0}
.info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:12px}
.info-item{background:var(--bg);border-radius:10px;padding:14px 16px;border:1px solid var(--border)}
.info-item .label{font-size:12px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}
.info-item .value{font-size:15px;font-weight:700;color:var(--text)}
.info-item .value.safe{color:var(--green)}
.info-item .value.warning{color:var(--yellow)}
.info-item .value.danger{color:var(--red)}
.reg-list{display:flex;flex-direction:column;gap:10px}
.reg-item{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px;padding:10px 0;border-bottom:1px solid var(--border)}
.reg-item:last-child{border-bottom:none}
.reg-list-name{font-weight:700;color:var(--text);font-size:14px}
.reg-status{font-size:13px;font-weight:600;color:var(--green);background:var(--green-light);padding:3px 10px;border-radius:6px}
.reg-details{font-size:13px;color:var(--text-2);width:100%;margin-top:4px}
.faq-section{margin:32px 0}
.faq-section h2{font-size:24px;font-weight:900;text-align:center;margin-bottom:24px;letter-spacing:-.03em}
.faq-list{display:flex;flex-direction:column;gap:8px}
.faq-item{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow-sm);transition:border-color .2s}
.faq-item:hover{border-color:var(--green-soft)}
.faq-q{padding:16px 20px;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;user-select:none;color:var(--text)}
.faq-q::after{content:'+';font-size:22px;color:var(--text-3);transition:transform .25s;flex-shrink:0;font-weight:400}
.faq-item.open .faq-q::after{transform:rotate(45deg);color:var(--green)}
.faq-a{max-height:0;overflow:hidden;transition:max-height .35s ease,padding .35s ease}
.faq-item.open .faq-a{max-height:500px;padding:0 20px 16px}
.faq-a p{font-size:14px;color:var(--text-2);line-height:1.8}
.faq-a .bilingual{margin-top:12px;padding-top:12px;border-top:1px solid var(--border);direction:ltr;text-align:left}
.extra-content{margin:24px 0}
.extra-content h2{font-size:18px;font-weight:800;color:var(--text);margin:20px 0 10px}
.extra-content p{font-size:15px;color:var(--text-2);line-height:1.8;margin-bottom:12px}
.cta-section{text-align:center;padding:40px 0;margin:24px 0;background:var(--green-light);border-radius:var(--radius-lg);border:1px solid var(--green-soft)}
.cta-section h2{font-size:22px;font-weight:900;color:var(--text);margin-bottom:8px}
.cta-section p{font-size:15px;color:var(--text-2);margin-bottom:20px}
.cta-btn{display:inline-flex;align-items:center;gap:8px;background:var(--green);color:#fff;padding:14px 32px;border-radius:var(--radius);font-size:16px;font-weight:700;font-family:var(--font);text-decoration:none;transition:all .25s;box-shadow:0 2px 8px rgba(13,122,62,.25)}
.cta-btn:hover{filter:brightness(1.1);transform:translateY(-2px);box-shadow:0 4px 16px rgba(13,122,62,.35);text-decoration:none}
.cta-btn svg{width:20px;height:20px;fill:currentColor}
.related-supplements{margin:32px 0}
.related-supplements h2{font-size:20px;font-weight:800;text-align:center;margin-bottom:16px}
.related-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.related-link{display:block;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;text-align:center;font-size:14px;font-weight:700;color:var(--text);transition:all .2s;text-decoration:none}
.related-link:hover{border-color:var(--green-soft);box-shadow:var(--shadow-md);transform:translateY(-2px);text-decoration:none}
.related-link .he-name{display:block;font-size:16px;margin-bottom:2px}
.related-link .en-name{display:block;font-size:12px;color:var(--text-3);font-weight:400}
footer{border-top:1px solid var(--border);padding:32px 0;text-align:center;background:var(--surface);margin-top:40px}
footer p{font-size:13px;color:var(--text-3);margin-bottom:6px}
footer a{color:var(--green);font-weight:700}
.footer-brand{display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:8px;font-size:13px;color:var(--text-3)}
@media(max-width:480px){
.hero-section{padding:28px 0 24px}
.hero-section h1{font-size:26px}
.info-card{padding:18px 16px}
.info-grid{grid-template-columns:1fr}
.related-grid{grid-template-columns:repeat(2,1fr)}
.cta-section{padding:28px 16px}
.prescription-banner{flex-direction:column;gap:8px}
}
</style>
</head>
<body>
<header>
<div class="wrap">
<a href="https://iherbchecker.com" class="logo">
<span class="shield"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
<span class="iherb">iHerb</span><span class="checker"> Checker</span>
</a>
</div>
</header>

<main class="wrap">
<nav class="breadcrumb" aria-label="Breadcrumb">
<a href="https://iherbchecker.com">iHerb Checker</a>
<span>&rsaquo;</span>
<span>${nameHe} (${nameEn})</span>
</nav>

<div class="hero-section">
<div class="category-badge">${categoryHe} | ${categoryEn}</div>
<h1>${nameHe}<br><span style="font-size:0.65em;color:var(--text-2);font-weight:700">${nameEn}</span></h1>
<p class="subtitle">מידע מקיף על בטיחות, מעמד חוקי ומינון מומלץ בישראל | Comprehensive safety, legal status &amp; dosage info for Israel</p>
</div>

${isPrescription ? `<div class="prescription-banner">
<span class="icon">&#9888;</span>
<div class="content">
<h3>תרופת מרשם בישראל | Prescription Drug in Israel</h3>
<p>${escHtml(supp.prescriptionNote || `${supp.he} מסווג בישראל כתרופת מרשם. רכישתו מ-iHerb ללא מרשם היא בניגוד לחוק.`)}</p>
<p style="margin-top:8px;direction:ltr;text-align:left">${escHtml(supp.prescriptionNoteEn || `${supp.en} is classified as a prescription drug in Israel. Purchasing it from iHerb without a prescription violates Israeli law.`)}</p>
</div>
</div>` : ''}

<div class="info-card">
<h2>מעמד חוקי בישראל | Legal Status in Israel</h2>
<div class="info-grid">
<div class="info-item">
<div class="label">סיווג | Classification</div>
<div class="value ${isPrescription ? 'danger' : 'safe'}">${isPrescription ? 'תרופת מרשם | Prescription Drug' : 'תוסף תזונה | Dietary Supplement'}</div>
</div>
<div class="info-item">
<div class="label">ייבוא מ-iHerb | iHerb Import</div>
<div class="value ${isPrescription ? 'danger' : 'safe'}">${isPrescription ? 'אסור ללא מרשם | Prohibited w/o Rx' : 'מותר | Permitted'}</div>
</div>
<div class="info-item">
<div class="label">קטגוריה | Category</div>
<div class="value">${categoryHe} | ${categoryEn}</div>
</div>
${safetyScore !== null ? `<div class="info-item">
<div class="label">ציון בטיחות | Safety Score</div>
<div class="value ${safetyScore >= 7 ? 'safe' : safetyScore >= 4 ? 'warning' : 'danger'}">${escHtml(String(safetyScore))}/10</div>
</div>` : ''}
</div>
</div>

${(healthConcerns || euStatus || usStatus) ? `<div class="info-card">
<h2>מידע בטיחותי | Safety Information</h2>
${healthConcerns ? `<p><strong>חששות בריאותיים | Health Concerns:</strong> ${escHtml(healthConcerns)}</p>` : ''}
${euStatus ? `<p><strong>סטטוס EU:</strong> ${escHtml(euStatus)}</p>` : ''}
${usStatus ? `<p><strong>סטטוס US:</strong> ${escHtml(usStatus)}</p>` : ''}
${adi ? `<p><strong>צריכה יומית מקובלת (ADI):</strong> ${escHtml(adi)}</p>` : ''}
</div>` : ''}

<div class="info-card">
<h2>מינון עליון | Upper Intake Limit</h2>
${ulData ? (ulData.ul
  ? `<div class="info-grid">
<div class="info-item">
<div class="label">UL (מינון עליון)</div>
<div class="value">${escHtml(String(ulData.ul))} ${escHtml(ulData.unit)} / יום</div>
</div>
<div class="info-item">
<div class="label">הערה | Note</div>
<div class="value warning">${escHtml(ulData.note)}</div>
</div>
</div>
<p style="margin-top:12px">המינון העליון הנסבל (Tolerable Upper Intake Level) הוא הכמות המקסימלית שניתן לצרוך מדי יום ללא סיכון לתופעות לוואי שליליות אצל רוב האוכלוסייה. חריגה ממינון זה אינה בהכרח מסוכנת אך מגבירה את הסיכון.</p>
<p style="direction:ltr;text-align:left">The Tolerable Upper Intake Level (UL) is the maximum daily amount unlikely to cause adverse health effects in most people. Exceeding this level is not necessarily dangerous but increases risk.</p>`
  : `<p><strong>${escHtml(ulData.note)}</strong></p>
${ulData.typical ? `<p>מינון מקובל | Typical dose: ${escHtml(ulData.typical)}</p>` : ''}
<p>לא נקבע מינון עליון רשמי (UL) עבור ${nameHe}. מומלץ להתייעץ עם גורם רפואי מוסמך.</p>
<p style="direction:ltr;text-align:left">No official UL has been established for ${nameEn}. Consult a qualified healthcare professional.</p>`)
: `<p>לא נמצא מידע על מינון עליון רשמי עבור ${nameHe}. מומלץ לעקוב אחרי הוראות היצרן ולהתייעץ עם רופא.</p>
<p style="direction:ltr;text-align:left">No official upper intake limit data found for ${nameEn}. Follow manufacturer instructions and consult a doctor.</p>`}
</div>

${description ? `<div class="info-card">
<h2>מידע כללי | General Information</h2>
<p>${escHtml(description)}</p>
</div>` : ''}

${regulatoryHtml}

${supp.extraContent ? `<div class="info-card extra-content">
<h2>מידע נוסף | Additional Information</h2>
<div dir="rtl">${supp.extraContent.he}</div>
<div class="bilingual" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);direction:ltr;text-align:left">${supp.extraContent.en}</div>
</div>` : ''}

<div class="faq-section">
<h2>שאלות נפוצות | FAQ</h2>
<div class="faq-list">
${faqItems.map(f => `<div class="faq-item">
<div class="faq-q">${escHtml(f.q_he)}</div>
<div class="faq-a">
<p>${escHtml(f.a_he)}</p>
<div class="bilingual"><p>${escHtml(f.a_en)}</p></div>
</div>
</div>`).join('\n')}
</div>
</div>

<div class="cta-section">
<h2>יש לך מוצר מ-iHerb שמכיל ${nameHe}?</h2>
<p>בדוק אותו עכשיו - בחינם, ללא הרשמה | Check it now - free, no signup</p>
<a href="https://iherbchecker.com" class="cta-btn">
<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
בדוק מוצר שמכיל ${nameHe}
</a>
</div>

${renderRelatedSupplements(slug)}
</main>

<footer>
<div class="wrap">
<div class="footer-brand">
<span>Powered by <a href="https://healthy-scan.app" target="_blank" rel="noopener">Benda</a></span>
<span>&middot;</span>
<a href="https://healthy-scan.app" target="_blank" rel="noopener">HealthyScan</a>
</div>
<p>הכלי לא מהווה ייעוץ רפואי. התייעצו עם רופא לפני נטילת תוספי תזונה.</p>
<p style="direction:ltr">This tool does not constitute medical advice. Consult a doctor before taking supplements.</p>
</div>
</footer>

<script>
document.querySelectorAll('.faq-q').forEach(function(q){
q.addEventListener('click',function(){this.parentElement.classList.toggle('open')});
});
</script>
</body>
</html>`;
}

// ── Render related supplements grid ────────────────────────────
function renderRelatedSupplements(currentSlug) {
  const slugs = Object.keys(SUPPLEMENTS).filter(s => s !== currentSlug);
  // Pick 8 random related supplements
  const shuffled = slugs.sort(() => Math.random() - 0.5).slice(0, 8);

  const links = shuffled.map(s => {
    const supp = SUPPLEMENTS[s];
    return `<a href="/supplement/${escHtml(s)}" class="related-link">
<span class="he-name">${escHtml(supp.he)}</span>
<span class="en-name">${escHtml(supp.en)}</span>
</a>`;
  }).join('\n');

  return `<div class="related-supplements">
<h2>תוספים נוספים | More Supplements</h2>
<div class="related-grid">
${links}
</div>
</div>`;
}

// ── 404 page for unknown supplements ──────────────────────────
function render404(slug) {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>לא נמצא - iHerb Checker</title>
<meta name="robots" content="noindex">
<meta name="theme-color" content="#f0f7f4">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;800;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#f7faf8;--text:#1a2e23;--text-2:#5a7a68;--green:#0d7a3e;--green-light:#e8f5ee;--font:'Heebo',sans-serif;--radius:12px}
html{font-family:var(--font);background:var(--bg);color:var(--text)}
body{min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 20px}
h1{font-size:48px;font-weight:900;color:var(--green);margin-bottom:12px}
p{font-size:18px;color:var(--text-2);margin-bottom:24px;max-width:400px;line-height:1.7}
a{display:inline-block;background:var(--green);color:#fff;padding:14px 32px;border-radius:var(--radius);font-size:16px;font-weight:700;text-decoration:none;transition:all .25s}
a:hover{filter:brightness(1.1);transform:translateY(-2px)}
</style>
</head>
<body>
<h1>404</h1>
<p>הדף "${escHtml(slug)}" לא נמצא. חזור לדף הראשי ובדוק מוצרים מ-iHerb.</p>
<p style="direction:ltr;text-align:center">The page "${escHtml(slug)}" was not found. Return to the homepage to check iHerb products.</p>
<a href="https://iherbchecker.com">חזרה לדף הראשי</a>
</body>
</html>`;
}

// ── Main request handler ──────────────────────────────────────
export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);

  // Extract slug from catch-all params
  const slugParts = params.slug || [];
  const slug = slugParts.join('/').toLowerCase().trim();

  if (!slug) {
    // /supplement/ with no slug -> redirect to home
    return Response.redirect('https://iherbchecker.com', 301);
  }

  const supplementData = SUPPLEMENTS[slug];

  if (!supplementData) {
    // Unknown supplement -> 404
    return new Response(render404(slug), {
      status: 404,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        ...SECURITY_HEADERS,
      },
    });
  }

  // Query D1 for additional data
  let dbData = { ingredients: [], additives: [], regulatory: [] };
  if (env.DB) {
    try {
      dbData = await queryDB(env.DB, slug, supplementData);
    } catch (e) {
      console.error('DB query failed:', e.message);
    }
  }

  // Render the full page
  const html = renderPage(slug, supplementData, dbData);

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      ...SECURITY_HEADERS,
    },
  });
}
