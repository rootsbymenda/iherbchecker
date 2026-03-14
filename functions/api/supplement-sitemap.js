/**
 * Cloudflare Pages Function: /api/supplement-sitemap
 *
 * Returns XML sitemap of all supplement pages for SEO crawlers.
 * Lists all 30 hardcoded supplement pages with proper lastmod and priority.
 */

const SUPPLEMENT_SLUGS = [
  'melatonin',
  'vitamin-d',
  'ashwagandha',
  'magnesium',
  'zinc',
  'omega-3',
  'vitamin-b12',
  'iron',
  'collagen',
  'probiotics',
  'vitamin-c',
  'biotin',
  '5-htp',
  'coq10',
  'curcumin',
  'creatine',
  'glutathione',
  'dhea',
  'same',
  'st-johns-wort',
  'folic-acid',
  'calcium',
  'potassium',
  'selenium',
  'chromium',
  'valerian',
  'l-theanine',
  'berberine',
  'quercetin',
];

// High-priority supplements (higher search volume in Israel)
const HIGH_PRIORITY = new Set([
  'melatonin', 'vitamin-d', 'magnesium', 'omega-3', 'zinc',
  'vitamin-c', 'vitamin-b12', 'iron', 'probiotics', 'collagen',
]);

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

export async function onRequest(context) {
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const slug of SUPPLEMENT_SLUGS) {
    const priority = HIGH_PRIORITY.has(slug) ? '0.9' : '0.7';
    xml += `  <url>
    <loc>https://iherbchecker.com/supplement/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>
`;
  }

  xml += `</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml;charset=UTF-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      ...SECURITY_HEADERS,
    },
  });
}
