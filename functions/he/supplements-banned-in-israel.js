/**
 * Cloudflare Pages Function: /he/supplements-banned-in-israel
 *
 * SSR Hebrew pillar page about supplements that are banned or
 * prescription-only in Israel.  Targets high-volume Hebrew queries
 * such as "תוספי תזונה אסורים בישראל", "מלטונין מרשם", etc.
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
    q: 'אילו תוספי תזונה אסורים לייבוא לישראל?',
    a: 'חומרים כמו מלטונין ו-DHEA מוגדרים בישראל כתרופות מרשם ואסורים לייבוא ללא מרשם רופא. בנוסף, חומרים מסוימים כמו אפדרין ויוהימבין אסורים לחלוטין לייבוא כתוספי תזונה.',
  },
  {
    q: 'האם מלטונין חוקי בישראל?',
    a: 'מלטונין מוגדר בישראל כתרופת מרשם. התכשיר היחיד המאושר הוא Circadin 2mg, הנמכר בבתי מרקחת עם מרשם רופא בלבד. רכישת מלטונין מ-iHerb ללא מרשם היא בניגוד לחוק.',
  },
  {
    q: 'מה קורה אם אזמין תוסף אסור מ-iHerb?',
    a: 'חבילות המכילות חומרים מפוקחים עלולות להיתפס במכס. משרד הבריאות רשאי להחרים את המוצר, ובמקרים מסוימים ייתכנו השלכות משפטיות. מומלץ לבדוק כל מוצר לפני הזמנה באמצעות iHerb Checker.',
  },
  {
    q: 'האם DHEA מותר בישראל?',
    a: 'לא. DHEA (דה-הידרואפיאנדרוסטרון) הוא הורמון סטרואידי המוגדר בישראל כתרופת מרשם. יבוא ושימוש ללא מרשם רופא אסורים על פי חוק.',
  },
  {
    q: 'איך אני יכול לבדוק אם התוסף שלי בטוח לייבוא?',
    a: 'השתמש בכלי iHerb Checker החינמי שלנו. הדבק את הקישור למוצר מ-iHerb ותקבל דוח מלא הכולל זיהוי תרופות מרשם, בדיקת מינון עליון ואזהרות בטיחות.',
  },
];

// ── JSON-LD schemas ───────────────────────────────────────────
function buildSchemas() {
  const canonical = 'https://iherbchecker.com/he/supplements-banned-in-israel';

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
      { '@type': 'ListItem', position: 2, name: 'תוספי תזונה אסורים בישראל', item: canonical },
    ],
  };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'תוספי תזונה אסורים ומוגבלים בישראל',
    description:
      'מדריך מקיף על תוספי תזונה שאסורים או דורשים מרשם בישראל. מלטונין, DHEA, אפדרין ועוד - כל מה שצריך לדעת לפני הזמנה מ-iHerb.',
    url: canonical,
    datePublished: '2026-03-14',
    dateModified: '2026-03-14',
    inLanguage: 'he',
    author: { '@type': 'Person', name: 'Benda' },
    publisher: {
      '@type': 'Organization',
      name: 'HealthyScan',
      url: 'https://healthy-scan.app',
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
  };

  return { faqSchema, breadcrumbSchema, articleSchema };
}

// ── Render the full HTML page ─────────────────────────────────
function renderPage() {
  const canonical = 'https://iherbchecker.com/he/supplements-banned-in-israel';
  const { faqSchema, breadcrumbSchema, articleSchema } = buildSchemas();

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>תוספי תזונה אסורים בישראל | iHerb Checker</title>
<meta name="description" content="מדריך מקיף על תוספי תזונה אסורים ומוגבלים בישראל. מלטונין, DHEA, אפדרין ועוד - כל מה שצריך לדעת לפני הזמנה מ-iHerb. בדיקה חינמית.">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="תוספי תזונה אסורים בישראל | iHerb Checker">
<meta property="og:description" content="מדריך מקיף על תוספי תזונה אסורים ומוגבלים בישראל. בדוק את המוצר שלך לפני הזמנה.">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="iHerb Checker">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="תוספי תזונה אסורים בישראל | iHerb Checker">
<meta name="twitter:description" content="מדריך מקיף על תוספי תזונה אסורים ומוגבלים בישראל. בדוק מוצרים מ-iHerb בחינם.">
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
.substance-card{background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:16px 18px;margin-bottom:12px;transition:border-color .2s}
.substance-card:hover{border-color:var(--border-hover)}
.substance-card .substance-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
.substance-card .substance-name{font-size:17px;font-weight:800;color:var(--text)}
.substance-card .substance-name .he{display:block}
.substance-card .substance-name .en{display:block;font-size:13px;color:var(--text-3);font-weight:600}
.substance-badge{padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap;flex-shrink:0}
.substance-badge.rx{background:var(--red-light);color:var(--red);border:1px solid var(--red-border)}
.substance-badge.banned{background:#f8d7da;color:#721c24;border:1px solid rgba(114,28,36,.2)}
.substance-card p{font-size:14px;color:var(--text-2);line-height:1.7;margin:0}
.substance-card .substance-link{display:inline-block;margin-top:8px;font-size:13px;font-weight:700;color:var(--green)}
.prescription-banner{background:var(--red-light);border:2px solid var(--red-border);border-radius:var(--radius);padding:18px 22px;margin:24px 0;display:flex;align-items:flex-start;gap:12px;line-height:1.7}
.prescription-banner .icon{font-size:24px;flex-shrink:0;margin-top:2px}
.prescription-banner .content{flex:1}
.prescription-banner h3{color:var(--red);font-size:16px;font-weight:800;margin-bottom:4px}
.prescription-banner p{color:#7a2921;font-size:14px}
.supplement-links{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:16px}
.supplement-link{display:block;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;text-align:center;font-size:14px;font-weight:700;color:var(--text);transition:all .2s;text-decoration:none}
.supplement-link:hover{border-color:var(--green-soft);box-shadow:var(--shadow-md);transform:translateY(-2px);text-decoration:none}
.supplement-link .he-name{display:block;font-size:16px;margin-bottom:2px}
.supplement-link .en-name{display:block;font-size:12px;color:var(--text-3);font-weight:400}
.cta-section{text-align:center;padding:40px 24px;margin:24px 0;background:var(--green-light);border-radius:var(--radius-lg);border:1px solid var(--green-soft)}
.cta-section h2{font-size:22px;font-weight:900;color:var(--text);margin-bottom:8px}
.cta-section p{font-size:15px;color:var(--text-2);margin-bottom:20px}
.cta-btn{display:inline-flex;align-items:center;gap:8px;background:var(--green);color:#fff;padding:14px 32px;border-radius:var(--radius);font-size:16px;font-weight:700;font-family:var(--font);text-decoration:none;transition:all .25s;box-shadow:0 2px 8px rgba(13,122,62,.25)}
.cta-btn:hover{filter:brightness(1.1);transform:translateY(-2px);box-shadow:0 4px 16px rgba(13,122,62,.35);text-decoration:none}
.cta-btn svg{width:20px;height:20px;fill:currentColor}
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
.substance-card .substance-header{flex-direction:column;align-items:flex-start;gap:6px}
.supplement-links{grid-template-columns:repeat(2,1fr)}
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
<span>תוספי תזונה אסורים בישראל</span>
</nav>

<div class="hero-section">
<h1>תוספי תזונה אסורים ומוגבלים בישראל</h1>
<p class="subtitle">מדריך מקיף ומעודכן על חומרים שאסורים לייבוא, דורשים מרשם רופא, או מוגבלים בישראל. כל מה שצריך לדעת לפני הזמנה מ-iHerb ואתרים בחו"ל.</p>
</div>

<div class="prescription-banner">
<span class="icon">&#9888;</span>
<div class="content">
<h3>חשוב לדעת</h3>
<p>חומרים רבים הנמכרים בחו"ל כתוספי תזונה ללא מרשם, מוגדרים בישראל כתרופות מרשם. ייבוא ושימוש בהם ללא מרשם רופא מהווים הפרה של חוק הרוקחים הישראלי ועלולים להוביל להחרמה במכס ולהשלכות משפטיות.</p>
</div>
</div>

<div class="info-card">
<h2>מבוא: רגולציה על תוספי תזונה בישראל</h2>
<p>ישראל מחילה רגולציה מחמירה על תוספי תזונה בהשוואה למדינות רבות אחרות. משרד הבריאות הישראלי מפקח על ייבוא, שיווק ומכירה של תוספי תזונה באמצעות מספר חוקים ותקנות, כולל חוק הרוקחים (תכשירים) התשמ"א-1981 ותקנות בריאות הציבור (מזון).</p>
<p>בעוד שבארה"ב תוספי תזונה מוסדרים בצורה מקלה יחסית תחת ה-DSHEA (Dietary Supplement Health and Education Act), בישראל חומרים רבים מסווגים כתרופות מרשם ודורשים אישור רופא. ההבדל הזה גורם לכך שמוצרים הנמכרים חופשי באתרים כמו iHerb עלולים להיות אסורים או מוגבלים בישראל.</p>
</div>

<div class="info-card">
<h2>תרופות מרשם שנמכרות כתוספי תזונה בחו"ל</h2>
<p>החומרים הבאים נמכרים בארה"ב ובמדינות נוספות כתוספי תזונה ללא מרשם, אך בישראל הם מוגדרים כתרופות מרשם:</p>

<div class="substance-card">
<div class="substance-header">
<div class="substance-name">
<span class="he">מלטונין (Melatonin)</span>
<span class="en">Melatonin - CAS 73-31-4</span>
</div>
<span class="substance-badge rx">תרופת מרשם</span>
</div>
<p>מלטונין מוגדר בישראל כתרופת מרשם בלבד. התכשיר היחיד המאושר הוא <strong>Circadin 2mg</strong> (מלטונין בשחרור מושהה), הנמכר בבתי מרקחת עם מרשם רופא. באתרי חו"ל כמו iHerb נמכרים מוצרי מלטונין במינונים של 3mg, 5mg, 10mg ואף 20mg - פי 1.5 עד 10 מהמינון המאושר בישראל.</p>
<p>חקירת כאן חדשות מדצמבר 2025 חשפה כי אלפי ישראלים מזמינים מלטונין מ-iHerb במינונים גבוהים, בניגוד לחוק.</p>
<a href="/supplement/melatonin" class="substance-link">מידע מלא על מלטונין &larr;</a>
<br>
<a href="/he/melatonin-israel" class="substance-link">מלטונין בישראל - מדריך מלא &larr;</a>
</div>

<div class="substance-card">
<div class="substance-header">
<div class="substance-name">
<span class="he">DHEA (דה-הידרואפיאנדרוסטרון)</span>
<span class="en">Dehydroepiandrosterone - CAS 53-43-0</span>
</div>
<span class="substance-badge rx">תרופת מרשם</span>
</div>
<p>DHEA הוא הורמון סטרואידי המיוצר בטבעו בבלוטת יותרת הכליה. בישראל הוא מסווג כתרופת מרשם ואסור לייבוא ללא מרשם רופא. בארה"ב הוא נמכר חופשי כתוסף תזונה במינונים של 25-100mg. DHEA משמש לאיזון הורמונלי, אנטי-אייג'ינג, ושיפור ביצועי ספורט, אך שימוש לא מפוקח עלול לגרום להפרעות הורמונליות חמורות.</p>
<a href="/supplement/dhea" class="substance-link">מידע מלא על DHEA &larr;</a>
</div>

<div class="substance-card">
<div class="substance-header">
<div class="substance-name">
<span class="he">פרגננולון (Pregnenolone)</span>
<span class="en">Pregnenolone - CAS 145-13-1</span>
</div>
<span class="substance-badge rx">תרופת מרשם</span>
</div>
<p>פרגננולון הוא הורמון סטרואידי שמשמש כאבן בניין להורמונים אחרים בגוף, כולל DHEA, פרוגסטרון וקורטיזול. בישראל הוא מסווג כתרופת מרשם. בארה"ב נמכר כתוסף תזונה ומשווק לשיפור זיכרון ומצב רוח.</p>
</div>

<div class="substance-card">
<div class="substance-header">
<div class="substance-name">
<span class="he">5-HTP (5-הידרוקסיטריפטופן) - במינונים גבוהים</span>
<span class="en">5-Hydroxytryptophan</span>
</div>
<span class="substance-badge rx">פיקוח מוגבר</span>
</div>
<p>5-HTP הוא חומר מקדים לסרוטונין. בעוד שבמינונים נמוכים הוא זמין כתוסף תזונה, במינונים גבוהים (מעל 200mg) הוא נתון לפיקוח מוגבר בישראל בשל פוטנציאל לאינטראקציות מסוכנות עם תרופות נוגדות דיכאון (תסמונת סרוטונין).</p>
<a href="/supplement/5-htp" class="substance-link">מידע מלא על 5-HTP &larr;</a>
</div>
</div>

<div class="info-card">
<h2>חומרים אסורים ליבוא</h2>
<p>החומרים הבאים אסורים לחלוטין ליבוא לישראל כתוספי תזונה, ומופיעים ברשימה השחורה של משרד הבריאות:</p>

<div class="substance-card">
<div class="substance-header">
<div class="substance-name">
<span class="he">אפדרין / אפדרה (Ephedra / Ephedrine)</span>
<span class="en">Ephedra sinica / Ephedrine</span>
</div>
<span class="substance-badge banned">אסור ליבוא</span>
</div>
<p>אפדרין הוא חומר ממריץ שהיה נפוץ בתוספי הרזיה ואנרגיה. אסור ליבוא ולשיווק בישראל בשל סיכון לאירועים קרדיווסקולריים חמורים, כולל התקפי לב ושבץ מוחי. ה-FDA בארה"ב אסר אותו ב-2004.</p>
</div>

<div class="substance-card">
<div class="substance-header">
<div class="substance-name">
<span class="he">יוהימבין (Yohimbine)</span>
<span class="en">Yohimbine HCl - Pausinystalia yohimbe</span>
</div>
<span class="substance-badge banned">אסור ליבוא</span>
</div>
<p>יוהימבין הוא אלקלואיד המופק מעץ היוהימבה ומשווק בחו"ל לשריפת שומן ושיפור תפקוד מיני. בישראל הוא מסווג כחומר מפוקח בשל תופעות לוואי חמורות כגון עלייה בלחץ דם, חרדה, והפרעות קצב לב.</p>
</div>

<div class="substance-card">
<div class="substance-header">
<div class="substance-name">
<span class="he">DMAA (דימתילאמילאמין)</span>
<span class="en">1,3-Dimethylamylamine</span>
</div>
<span class="substance-badge banned">אסור ליבוא</span>
</div>
<p>DMAA הוא חומר ממריץ סינתטי שנפוץ בתוספי פרה-וורקאאוט והרזיה. אסור בישראל ובמדינות רבות בעולם בשל סיכון להפרעות קצב לב, עליית לחץ דם מסוכנת, והתקפי לב. ה-FDA הוציא אזהרות מרובות נגד מוצרים המכילים DMAA.</p>
</div>

<div class="substance-card">
<div class="substance-header">
<div class="substance-name">
<span class="he">DMHA (אוקטודרין)</span>
<span class="en">2-Aminoisoheptane / Octodrine</span>
</div>
<span class="substance-badge banned">אסור ליבוא</span>
</div>
<p>DMHA (המכונה גם אוקטודרין) הוא חומר ממריץ שפותח כתחליף ל-DMAA. אסור בישראל ובמדינות נוספות. נפוץ בתוספי פרה-וורקאאוט ומשווק לשיפור ריכוז ואנרגיה, אך טומן בחובו סיכונים דומים ל-DMAA.</p>
</div>

<div class="substance-card">
<div class="substance-header">
<div class="substance-name">
<span class="he">פנלאתילאמין - PEA (במינונים גבוהים)</span>
<span class="en">Phenylethylamine - PEA</span>
</div>
<span class="substance-badge banned">מוגבל</span>
</div>
<p>PEA הוא נוירוטרנסמיטר טבעי שנפוץ בתוספי מצב רוח ופוקוס. במינונים גבוהים (מעל 500mg) הוא נתון לפיקוח בישראל בשל השפעה ממריצה ופוטנציאל לתופעות לוואי קרדיווסקולריות.</p>
</div>
</div>

<div class="cta-section">
<h2>איך לבדוק אם התוסף שלך בטוח?</h2>
<p>הדבק קישור לכל מוצר מ-iHerb ותקבל מיד דוח בטיחות מלא - כולל זיהוי תרופות מרשם, בדיקת מינון עליון ואזהרות. חינם לגמרי, ללא הרשמה.</p>
<a href="https://iherbchecker.com" class="cta-btn">
<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
בדוק מוצר מ-iHerb עכשיו
</a>
</div>

<div class="info-card">
<h2>תוספים פופולריים - בדוק את הסטטוס שלהם</h2>
<p>לחץ על כל תוסף לקבלת מידע מלא על מעמדו החוקי, מינון מקסימלי ובטיחות:</p>
<div class="supplement-links">
<a href="/supplement/melatonin" class="supplement-link">
<span class="he-name">מלטונין</span>
<span class="en-name">Melatonin</span>
</a>
<a href="/supplement/dhea" class="supplement-link">
<span class="he-name">DHEA</span>
<span class="en-name">DHEA</span>
</a>
<a href="/supplement/5-htp" class="supplement-link">
<span class="he-name">5-HTP</span>
<span class="en-name">5-HTP</span>
</a>
<a href="/supplement/vitamin-d" class="supplement-link">
<span class="he-name">ויטמין D</span>
<span class="en-name">Vitamin D</span>
</a>
<a href="/supplement/magnesium" class="supplement-link">
<span class="he-name">מגנזיום</span>
<span class="en-name">Magnesium</span>
</a>
<a href="/supplement/omega-3" class="supplement-link">
<span class="he-name">אומגה 3</span>
<span class="en-name">Omega-3</span>
</a>
<a href="/supplement/ashwagandha" class="supplement-link">
<span class="he-name">אשוואגנדה</span>
<span class="en-name">Ashwagandha</span>
</a>
<a href="/supplement/zinc" class="supplement-link">
<span class="he-name">אבץ</span>
<span class="en-name">Zinc</span>
</a>
<a href="/supplement/iron" class="supplement-link">
<span class="he-name">ברזל</span>
<span class="en-name">Iron</span>
</a>
<a href="/supplement/probiotics" class="supplement-link">
<span class="he-name">פרוביוטיקה</span>
<span class="en-name">Probiotics</span>
</a>
<a href="/supplement/vitamin-c" class="supplement-link">
<span class="he-name">ויטמין C</span>
<span class="en-name">Vitamin C</span>
</a>
<a href="/supplement/creatine" class="supplement-link">
<span class="he-name">קראטין</span>
<span class="en-name">Creatine</span>
</a>
</div>
</div>

<div class="faq-section">
<h2>שאלות נפוצות</h2>
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

<div class="sources-card">
<h2>מקורות ומידע נוסף</h2>
<ul class="sources-list">
<li><a href="https://www.health.gov.il" target="_blank" rel="noopener">משרד הבריאות הישראלי</a> - מאגר התרופות ורשימת התכשירים המורשים</li>
<li><a href="https://israeldrugs.health.gov.il" target="_blank" rel="noopener">מאגר התרופות של משרד הבריאות</a> - IDR Server - חיפוש תרופות מורשות</li>
<li><a href="https://www.kan.org.il" target="_blank" rel="noopener">חקירת כאן חדשות</a> - דצמבר 2025: חקירה על יבוא מלטונין לישראל דרך iHerb</li>
<li><a href="https://www.fda.gov/food/dietary-supplements" target="_blank" rel="noopener">FDA - Dietary Supplements</a> - רגולציה אמריקאית על תוספי תזונה (באנגלית)</li>
<li><a href="https://ods.od.nih.gov" target="_blank" rel="noopener">NIH Office of Dietary Supplements</a> - מידע מדעי על תוספי תזונה (באנגלית)</li>
</ul>
</div>

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
