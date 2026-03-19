/**
 * Cloudflare Pages Function: /he/melatonin-israel
 *
 * SSR Hebrew pillar page — THE definitive resource about melatonin
 * in Israel.  Targets high-volume Hebrew queries such as
 * "מלטונין בישראל", "מלטונין חוקי", "מלטונין iherb", etc.
 *
 * - Static content (no D1 queries needed)
 * - FAQPage, Article, BreadcrumbList JSON-LD schemas
 * - Same design system as /supplement/* pages (Heebo, green theme)
 */

// ── Security headers ──────────────────────────────────────────
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy':
    "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'none'; img-src 'self' data:; connect-src 'self'",
};

// ── Helper: escape HTML ───────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ── FAQ data ──────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: 'האם מלטונין חוקי בישראל?',
    a: 'מלטונין מוגדר בישראל כתרופת מרשם. התכשיר היחיד המאושר הוא Circadin 2mg (מלטונין בשחרור מושהה), הנמכר בבתי מרקחת עם מרשם רופא בלבד. רכישת מלטונין מ-iHerb או מאתרי חו"ל אחרים ללא מרשם היא בניגוד לחוק הישראלי.',
  },
  {
    q: 'למה מלטונין דורש מרשם בישראל אבל לא בארה"ב?',
    a: 'בארה"ב, מלטונין מסווג כתוסף תזונה תחת חוק DSHEA ולכן נמכר ללא מרשם. בישראל, משרד הבריאות מסווג מלטונין כתרופה בשל השפעתו ההורמונלית והצורך בפיקוח רפואי על המינון. גם באיחוד האירופי הסיווג משתנה ממדינה למדינה.',
  },
  {
    q: 'מה המינון המותר של מלטונין בישראל?',
    a: 'המינון המאושר בישראל הוא 2mg בלבד (Circadin בשחרור מושהה), במרשם רופא. להשוואה, באתרי iHerb נמכרים מוצרים במינונים של 3mg, 5mg, 10mg ואף 20mg — פי 1.5 עד 10 מהמינון המאושר בישראל.',
  },
  {
    q: 'מה קורה אם אני מזמין מלטונין מ-iHerb?',
    a: 'חבילות המכילות מלטונין עלולות להיתפס במכס הישראלי. משרד הבריאות רשאי להחרים את המוצר. בנוסף, רכישה ללא מרשם מהווה הפרה של חוק הרוקחים. מומלץ להתייעץ עם רופא ולקבל מרשם לפני רכישה.',
  },
  {
    q: 'מה תופעות הלוואי של מלטונין במינון גבוה?',
    a: 'לפי משרד הבריאות, תופעות לוואי כוללות: כאבי ראש, סחרחורת, בחילות, נמנום ביום, ושינויים במצב הרוח. בילדים, מלטונין עלול להשפיע על התפתחות הורמונלית. מינונים גבוהים (5-10mg ומעלה) מגבירים את הסיכון לתופעות אלו באופן משמעותי.',
  },
  {
    q: 'האם יש תחליפים חוקיים למלטונין בישראל?',
    a: 'כן, ישנם תוספי תזונה חוקיים לשינה בישראל כגון: ולריאן (Valerian), ל-תאנין (L-Theanine), מגנזיום (במיוחד גליצינאט), ותה קמומיל. כולם נמכרים ללא מרשם ונחשבים בטוחים לשימוש. מומלץ להתייעץ עם רופא לפני נטילה.',
  },
];

// ── JSON-LD schemas ───────────────────────────────────────────
function buildSchemas() {
  const canonical = 'https://iherbchecker.com/he/melatonin-israel';

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'iHerb Checker', item: 'https://iherbchecker.com' },
      { '@type': 'ListItem', position: 2, name: 'תוספי תזונה אסורים בישראל', item: 'https://iherbchecker.com/he/supplements-banned-in-israel' },
      { '@type': 'ListItem', position: 3, name: 'מלטונין בישראל', item: canonical },
    ],
  };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'מלטונין בישראל - האם חוקי? כל מה שצריך לדעת',
    description:
      'מדריך מקיף על מלטונין בישראל: מעמד חוקי, מינון מאושר, חקירת כאן חדשות, אזהרות משרד הבריאות, והשוואה בינלאומית.',
    url: canonical,
    datePublished: '2026-03-14',
    dateModified: '2026-03-14',
    inLanguage: 'he',
    author: { '@type': 'Person', name: 'Benda' },
    publisher: {
      '@type': 'Organization',
      name: 'HealthyScan',
      url: 'https://twohalves.ai',
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
  };

  return { faqSchema, breadcrumbSchema, articleSchema };
}

// ── Render the full HTML page ─────────────────────────────────
function renderPage() {
  const canonical = 'https://iherbchecker.com/he/melatonin-israel';
  const { faqSchema, breadcrumbSchema, articleSchema } = buildSchemas();

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>מלטונין בישראל - האם חוקי? כל מה שצריך לדעת | iHerb Checker</title>
<meta name="description" content="מלטונין בישראל: תרופת מרשם בלבד (Circadin 2mg). מדריך מלא - מעמד חוקי, מינון, חקירת כאן חדשות 2025, אזהרות משרד הבריאות, והשוואה לחו&quot;ל. בדוק מוצרי iHerb בחינם.">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="מלטונין בישראל - האם חוקי? כל מה שצריך לדעת | iHerb Checker">
<meta property="og:description" content="מלטונין הוא תרופת מרשם בישראל. מדריך מלא על המעמד החוקי, מינון, אזהרות ובדיקת מוצרי iHerb.">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="iHerb Checker">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="מלטונין בישראל - כל מה שצריך לדעת | iHerb Checker">
<meta name="twitter:description" content="מלטונין הוא תרופת מרשם בישראל (Circadin 2mg). בדוק מוצרי iHerb בחינם.">
<meta name="theme-color" content="#f0f7f4">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>
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
.hero-section h1{font-size:clamp(26px,5.5vw,38px);font-weight:900;letter-spacing:-.04em;line-height:1.25;margin-bottom:16px}
.hero-section .subtitle{font-size:16px;color:var(--text-2);max-width:580px;margin:0 auto;line-height:1.7}
.info-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px;margin-bottom:16px;box-shadow:var(--shadow-sm);transition:border-color .2s}
.info-card:hover{border-color:var(--border-hover)}
.info-card h2{font-size:20px;font-weight:800;color:var(--text);margin-bottom:16px;letter-spacing:-.02em;padding-bottom:12px;border-bottom:1px solid var(--border)}
.info-card h3{font-size:17px;font-weight:700;color:var(--text);margin:18px 0 8px}
.info-card h3:first-child{margin-top:0}
.info-card p{font-size:15px;color:var(--text-2);line-height:1.8;margin-bottom:12px}
.info-card p:last-child{margin-bottom:0}
.info-card ul{padding-right:20px;margin-bottom:12px}
.info-card ul li{font-size:15px;color:var(--text-2);line-height:1.8;margin-bottom:6px}
.info-card ul li strong{color:var(--text)}
.prescription-banner{background:var(--red-light);border:2px solid var(--red-border);border-radius:var(--radius);padding:18px 22px;margin:24px 0;display:flex;align-items:flex-start;gap:12px;line-height:1.7}
.prescription-banner .icon{font-size:24px;flex-shrink:0;margin-top:2px}
.prescription-banner .content{flex:1}
.prescription-banner h3{color:var(--red);font-size:16px;font-weight:800;margin-bottom:4px}
.prescription-banner p{color:#7a2921;font-size:14px}
.investigation-card{background:var(--yellow-light);border:2px solid var(--yellow-border);border-radius:var(--radius);padding:20px 24px;margin-bottom:16px}
.investigation-card h2{font-size:20px;font-weight:800;color:#7d6608;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--yellow-border)}
.investigation-card p{font-size:15px;color:#5a4a0a;line-height:1.8;margin-bottom:12px}
.investigation-card p:last-child{margin-bottom:0}
.investigation-card .highlight{background:#fff8db;padding:12px 16px;border-radius:8px;border:1px solid var(--yellow-border);margin:12px 0;font-weight:600;font-size:15px;color:#5a4a0a}
.dosage-table{width:100%;border-collapse:collapse;margin:16px 0;border-radius:var(--radius);overflow:hidden;border:1px solid var(--border)}
.dosage-table th{background:var(--green);color:#fff;padding:12px 16px;text-align:right;font-size:14px;font-weight:700}
.dosage-table td{padding:12px 16px;border-bottom:1px solid var(--border);font-size:14px;color:var(--text-2);line-height:1.6}
.dosage-table tr:last-child td{border-bottom:none}
.dosage-table tr:nth-child(even){background:var(--bg)}
.dosage-table .highlight-cell{background:var(--red-light);color:var(--red);font-weight:700}
.dosage-table .safe-cell{background:var(--green-light);color:var(--green);font-weight:700}
.warning-list{list-style:none;padding:0}
.warning-list li{padding:10px 14px;border-radius:8px;font-size:14px;line-height:1.7;margin-bottom:8px;display:flex;align-items:flex-start;gap:10px}
.warning-list li::before{content:'';flex-shrink:0;width:8px;height:8px;border-radius:50%;margin-top:8px}
.warning-list li.severe::before{background:var(--red)}
.warning-list li.severe{background:var(--red-light);color:#7a2921}
.warning-list li.moderate::before{background:var(--yellow)}
.warning-list li.moderate{background:var(--yellow-light);color:#5a4a0a}
.warning-list li.info-item::before{background:var(--blue)}
.warning-list li.info-item{background:var(--blue-light);color:#1a5276}
.cta-section{text-align:center;padding:40px 24px;margin:24px 0;background:var(--green-light);border-radius:var(--radius-lg);border:1px solid var(--green-soft)}
.cta-section h2{font-size:22px;font-weight:900;color:var(--text);margin-bottom:8px}
.cta-section p{font-size:15px;color:var(--text-2);margin-bottom:20px}
.cta-btn{display:inline-flex;align-items:center;gap:8px;background:var(--green);color:#fff;padding:14px 32px;border-radius:var(--radius);font-size:16px;font-weight:700;font-family:var(--font);text-decoration:none;transition:all .25s;box-shadow:0 2px 8px rgba(13,122,62,.25)}
.cta-btn:hover{filter:brightness(1.1);transform:translateY(-2px);box-shadow:0 4px 16px rgba(13,122,62,.35);text-decoration:none}
.cta-btn svg{width:20px;height:20px;fill:currentColor}
.related-links{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:16px}
.related-link{display:block;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;text-align:center;font-size:14px;font-weight:700;color:var(--text);transition:all .2s;text-decoration:none}
.related-link:hover{border-color:var(--green-soft);box-shadow:var(--shadow-md);transform:translateY(-2px);text-decoration:none}
.related-link .he-name{display:block;font-size:16px;margin-bottom:2px}
.related-link .en-name{display:block;font-size:12px;color:var(--text-3);font-weight:400}
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
.sources-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px;margin-bottom:16px;box-shadow:var(--shadow-sm)}
.sources-card h2{font-size:20px;font-weight:800;color:var(--text);margin-bottom:16px;letter-spacing:-.02em;padding-bottom:12px;border-bottom:1px solid var(--border)}
.sources-list{list-style:none;padding:0}
.sources-list li{padding:10px 0;border-bottom:1px solid var(--border);font-size:14px;color:var(--text-2);line-height:1.7}
.sources-list li:last-child{border-bottom:none}
.sources-list li a{color:var(--green);font-weight:600}
footer{border-top:1px solid var(--border);padding:32px 0;text-align:center;background:var(--surface);margin-top:40px}
footer p{font-size:13px;color:var(--text-3);margin-bottom:6px}
footer a{color:var(--green);font-weight:700}
.footer-brand{display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:8px;font-size:13px;color:var(--text-3)}
@media(max-width:480px){
.hero-section{padding:28px 0 24px}
.hero-section h1{font-size:24px}
.info-card{padding:18px 16px}
.investigation-card{padding:16px 18px}
.dosage-table th,.dosage-table td{padding:8px 10px;font-size:13px}
.related-links{grid-template-columns:repeat(2,1fr)}
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
<a href="/he/supplements-banned-in-israel">תוספי תזונה אסורים</a>
<span>&rsaquo;</span>
<span>מלטונין בישראל</span>
</nav>

<div class="hero-section">
<h1>מלטונין בישראל &mdash; כל מה שצריך לדעת</h1>
<p class="subtitle">מלטונין מוגדר בישראל כתרופת מרשם. מדריך מקיף על המעמד החוקי, מינון מאושר, אזהרות משרד הבריאות, חקירת כאן חדשות 2025, וההבדלים מחו"ל.</p>
</div>

<div class="prescription-banner">
<span class="icon">&#9888;</span>
<div class="content">
<h3>תרופת מרשם בישראל</h3>
<p>מלטונין מוגדר בישראל כתרופת מרשם בלבד. התכשיר היחיד המאושר הוא <strong>Circadin 2mg</strong> (מלטונין בשחרור מושהה). רכישת מלטונין מ-iHerb או מאתרים אחרים ללא מרשם רופא היא בניגוד לחוק הרוקחים הישראלי.</p>
</div>
</div>

<div class="info-card">
<h2>מה זה מלטונין?</h2>
<p>מלטונין הוא הורמון המיוצר באופן טבעי בבלוטת האצטרובל (Pineal Gland) במוח. הוא ממלא תפקיד מרכזי בוויסות מחזור השינה-ערות (השעון הביולוגי) של הגוף. רמות המלטונין עולות באופן טבעי בשעות החשכה ויורדות באור.</p>
<p>מלטונין סינתטי משמש כתוסף לטיפול בבעיות שינה כגון: קושי להירדם, ג'ט לג, הפרעות שינה אצל עובדי משמרות, ובעיות שינה אצל קשישים. בעולם, מלטונין הוא אחד מתוספי התזונה הנמכרים ביותר.</p>
</div>

<div class="info-card">
<h2>המעמד החוקי של מלטונין בישראל</h2>
<p>בישראל, מלטונין מסווג כ<strong>תרופת מרשם</strong> על ידי משרד הבריאות. זאת בניגוד לארה"ב ולמדינות רבות אחרות בהן הוא נמכר ללא מרשם כתוסף תזונה.</p>
<h3>הפרטים המלאים:</h3>
<ul>
<li><strong>תכשיר מאושר:</strong> Circadin (ייצור: Neurim Pharmaceuticals, ישראל)</li>
<li><strong>מינון:</strong> 2mg בלבד, בשחרור מושהה (prolonged-release)</li>
<li><strong>התוויה:</strong> טיפול קצר-מועד בנדודי שינה ראשוניים (Primary Insomnia) אצל מטופלים מגיל 55 ומעלה</li>
<li><strong>מקום רכישה:</strong> בתי מרקחת בלבד, עם מרשם רופא</li>
<li><strong>סיווג:</strong> תרופה מרשמית - אסור לייבוא ללא מרשם</li>
</ul>
<p>הסיבה לסיווג זה היא שמלטונין הוא הורמון בעל השפעה מערכתית על הגוף - הוא משפיע על מערכת החיסון, הורמוני הרבייה, מחזור השינה, ותפקודים אנדוקריניים נוספים. משרד הבריאות סבור שפיקוח רפואי נדרש כדי למנוע שימוש לא נכון.</p>
</div>

<div class="investigation-card">
<h2>חקירת כאן חדשות - דצמבר 2025</h2>
<p>בדצמבר 2025 שידרה כאן חדשות חקירה מקיפה שחשפה תופעה נרחבת של ייבוא מלטונין לישראל דרך אתרי אינטרנט, ובראשם iHerb.</p>
<div class="highlight">ממצא מרכזי: אלפי ישראלים מזמינים מלטונין מ-iHerb במינונים של 5-10mg - פי 2.5 עד 5 מהמינון המאושר בישראל (2mg).</div>
<p>החקירה חשפה שהמכס הישראלי מתקשה לעצור את זרימת החבילות, ורבים מהמזמינים אינם מודעים לכך שהם מפרים את החוק. בעקבות החקירה, משרד הבריאות הוציא אזהרה רשמית והודיע על הגברת הפיקוח.</p>
<p>מומחים שרואיינו בכתבה הזהירו במיוחד מפני שימוש במלטונין במינונים גבוהים אצל ילדים ובני נוער, בשל השפעה פוטנציאלית על התפתחות הורמונלית.</p>
</div>

<div class="info-card">
<h2>אזהרות משרד הבריאות</h2>
<p>משרד הבריאות הישראלי פרסם אזהרות רשמיות בנוגע לשימוש במלטונין ללא פיקוח רפואי. להלן תופעות הלוואי המתועדות:</p>
<ul class="warning-list">
<li class="severe"><strong>כאבי ראש</strong> - תופעה שכיחה במיוחד במינונים גבוהים (5mg ומעלה)</li>
<li class="severe"><strong>סחרחורת</strong> - עלולה להשפיע על יכולת נהיגה ותפקוד</li>
<li class="moderate"><strong>בחילות</strong> - תופעה נפוצה, במיוחד בנטילה על קיבה ריקה</li>
<li class="moderate"><strong>נמנום ביום</strong> - "אפקט Hangover" - עייפות מוגברת למחרת, במיוחד במינונים גבוהים</li>
<li class="severe"><strong>השפעה הורמונלית בילדים</strong> - מלטונין עלול להשפיע על התפתחות הורמונלית ועל הבשלה מינית בילדים ובני נוער</li>
<li class="moderate"><strong>שינויים במצב הרוח</strong> - דיכאון, חרדה ועצבנות דווחו בחלק מהמשתמשים</li>
<li class="info-item"><strong>אינטראקציות תרופתיות</strong> - מלטונין עלול להגביר את ההשפעה של תרופות להורדת לחץ דם, מדללי דם, ותרופות לסוכרת</li>
</ul>
</div>

<div class="info-card">
<h2>למה iHerb מוכר מלטונין בלי מרשם?</h2>
<p>ההסבר פשוט: <strong>סיווג שונה בין מדינות.</strong></p>
<p>iHerb הוא חברה אמריקאית הפועלת לפי חוקי ארה"ב. בארה"ב, מלטונין מסווג כתוסף תזונה (Dietary Supplement) תחת חוק DSHEA משנת 1994, ולכן נמכר ללא מרשם בכל סופרמרקט ובית מרקחת. iHerb אינו מחויב לבדוק את החוקים של כל מדינת יעד.</p>
<p>זה אומר שכאשר ישראלי מזמין מלטונין מ-iHerb, <strong>האחריות היא על הצרכן</strong> לוודא שהמוצר חוקי בישראל. iHerb אינו מזהיר את הרוכש הישראלי שהמוצר דורש מרשם.</p>
<p>זו בדיוק הסיבה שפיתחנו את <strong>iHerb Checker</strong> - כדי לאפשר לצרכנים ישראלים לבדוק כל מוצר לפני הזמנה ולזהות חומרים בעייתיים אוטומטית.</p>
</div>

<div class="info-card">
<h2>הסיכונים ברכישת מלטונין מ-iHerb ללא מרשם</h2>
<ul>
<li><strong>סיכון משפטי:</strong> ייבוא תרופת מרשם ללא מרשם רופא מהווה הפרה של חוק הרוקחים הישראלי</li>
<li><strong>החרמה במכס:</strong> חבילות המכילות מלטונין עלולות להיתפס ולהוחרם ע"י רשות המכס</li>
<li><strong>מינון לא מפוקח:</strong> מוצרי iHerb מכילים מינונים של 3-20mg, בעוד המינון המאושר בישראל הוא 2mg בלבד</li>
<li><strong>היעדר פיקוח רפואי:</strong> ללא התייעצות עם רופא, אין בדיקה לאינטראקציות עם תרופות אחרות או מצבים רפואיים</li>
<li><strong>סיכון לילדים:</strong> הורים רבים נותנים מלטונין לילדים ללא מודעות להשפעה על התפתחות הורמונלית</li>
</ul>
</div>

<div class="info-card">
<h2>השוואת מינון בינלאומית</h2>
<p>טבלת השוואה של מעמד מלטונין ומינון מותר במדינות שונות:</p>
<table class="dosage-table">
<thead>
<tr>
<th>מדינה</th>
<th>סיווג</th>
<th>מינון זמין</th>
<th>דרישת מרשם</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>ישראל</strong></td>
<td class="highlight-cell">תרופת מרשם</td>
<td>2mg בלבד (Circadin)</td>
<td class="highlight-cell">כן - חובה</td>
</tr>
<tr>
<td><strong>ארה"ב</strong></td>
<td class="safe-cell">תוסף תזונה</td>
<td>0.5mg - 20mg</td>
<td class="safe-cell">לא</td>
</tr>
<tr>
<td><strong>קנדה</strong></td>
<td class="safe-cell">מוצר בריאות טבעי</td>
<td>0.5mg - 10mg</td>
<td class="safe-cell">לא</td>
</tr>
<tr>
<td><strong>בריטניה</strong></td>
<td class="highlight-cell">תרופת מרשם</td>
<td>2mg (Circadin)</td>
<td class="highlight-cell">כן (מעל 55)</td>
</tr>
<tr>
<td><strong>אוסטרליה</strong></td>
<td class="highlight-cell">תרופת מרשם</td>
<td>2mg (Circadin)</td>
<td class="highlight-cell">כן</td>
</tr>
<tr>
<td><strong>גרמניה</strong></td>
<td class="highlight-cell">תרופת מרשם</td>
<td>2mg (Circadin)</td>
<td class="highlight-cell">כן (מעל 55)</td>
</tr>
<tr>
<td><strong>איטליה</strong></td>
<td>משתנה</td>
<td>עד 1mg ללא מרשם, מעל - מרשם</td>
<td>תלוי מינון</td>
</tr>
<tr>
<td><strong>הולנד</strong></td>
<td>משתנה</td>
<td>עד 0.3mg ללא מרשם</td>
<td>מעל 0.3mg - כן</td>
</tr>
</tbody>
</table>
<p>כפי שניתן לראות, ישראל אינה יוצאת דופן - מדינות רבות באירופה ואוסטרליה מסווגות מלטונין כתרופת מרשם. ארה"ב וקנדה הן החריגות עם הסיווג המקל.</p>
</div>

<div class="cta-section">
<h2>בדוק מוצר עם מלטונין מ-iHerb</h2>
<p>יש לך מוצר מ-iHerb שאתה חושד שמכיל מלטונין? הדבק את הקישור ותקבל מיד דוח בטיחות מלא - כולל זיהוי מלטונין ותרופות מרשם נוספות. חינם לגמרי.</p>
<a href="https://iherbchecker.com" class="cta-btn">
<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
בדוק מוצר מ-iHerb עכשיו
</a>
</div>

<div class="faq-section">
<h2>שאלות נפוצות על מלטונין בישראל</h2>
<div class="faq-list">
${FAQ_ITEMS.map(
  (f) => `<div class="faq-item">
<div class="faq-q">${escHtml(f.q)}</div>
<div class="faq-a">
<p>${escHtml(f.a)}</p>
</div>
</div>`
).join('\n')}
</div>
</div>

<div class="info-card">
<h2>מוצרים קשורים</h2>
<p>עיין במידע על מלטונין ותוספי שינה נוספים:</p>
<div class="related-links">
<a href="/supplement/melatonin" class="related-link">
<span class="he-name">מלטונין</span>
<span class="en-name">Melatonin - דף מוצר</span>
</a>
<a href="/supplement/valerian" class="related-link">
<span class="he-name">ולריאן</span>
<span class="en-name">Valerian</span>
</a>
<a href="/supplement/l-theanine" class="related-link">
<span class="he-name">ל-תאנין</span>
<span class="en-name">L-Theanine</span>
</a>
<a href="/supplement/magnesium" class="related-link">
<span class="he-name">מגנזיום</span>
<span class="en-name">Magnesium</span>
</a>
<a href="/supplement/5-htp" class="related-link">
<span class="he-name">5-HTP</span>
<span class="en-name">5-HTP</span>
</a>
<a href="/he/supplements-banned-in-israel" class="related-link">
<span class="he-name">תוספים אסורים</span>
<span class="en-name">Banned Supplements</span>
</a>
</div>
</div>

<div class="sources-card">
<h2>מקורות ומידע נוסף</h2>
<ul class="sources-list">
<li><a href="https://www.health.gov.il" target="_blank" rel="noopener">משרד הבריאות הישראלי</a> - אזהרה רשמית בנוגע לשימוש במלטונין</li>
<li><a href="https://israeldrugs.health.gov.il" target="_blank" rel="noopener">מאגר התרופות של משרד הבריאות</a> - רישום Circadin (מלטונין 2mg)</li>
<li><a href="https://www.kan.org.il" target="_blank" rel="noopener">כאן חדשות</a> - חקירת דצמבר 2025: "מלטונין מ-iHerb - המגפה השקטה"</li>
<li><a href="https://ods.od.nih.gov/factsheets/Melatonin-HealthProfessional/" target="_blank" rel="noopener">NIH - Melatonin Fact Sheet</a> - מידע מדעי על מלטונין (באנגלית)</li>
<li><a href="https://www.ema.europa.eu" target="_blank" rel="noopener">European Medicines Agency</a> - סקירת Circadin באירופה (באנגלית)</li>
</ul>
</div>

</main>

<footer>
<div class="wrap">
<div class="footer-brand">
<span>Built by <a href="https://twohalves.ai" target="_blank" rel="noopener">Two Halves</a></span>
<span>&middot;</span>
<a href="https://twohalves.ai" target="_blank" rel="noopener">twohalves.ai</a>
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

// ── Main request handler ──────────────────────────────────────
export async function onRequest(context) {
  const html = renderPage();

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      ...SECURITY_HEADERS,
    },
  });
}
