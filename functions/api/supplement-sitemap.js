/**
 * Cloudflare Pages Function: /api/supplement-sitemap
 *
 * Returns XML sitemap of all supplement pages for SEO crawlers.
 * Lists all 100 supplement pages with proper lastmod and priority.
 */

const SUPPLEMENT_SLUGS = [
  // Original 29
  'melatonin', 'vitamin-d', 'ashwagandha', 'magnesium', 'zinc',
  'omega-3', 'vitamin-b12', 'iron', 'collagen', 'probiotics',
  'vitamin-c', 'biotin', '5-htp', 'coq10', 'curcumin',
  'creatine', 'glutathione', 'dhea', 'same', 'st-johns-wort',
  'folic-acid', 'calcium', 'potassium', 'selenium', 'chromium',
  'valerian', 'l-theanine', 'berberine', 'quercetin',
  // Vitamins
  'vitamin-a', 'vitamin-e', 'vitamin-k2', 'vitamin-b6',
  'vitamin-b-complex', 'vitamin-d3', 'niacin',
  // Minerals
  'iodine', 'manganese', 'copper', 'boron',
  // Amino Acids
  'nac', 'l-carnitine', 'l-arginine', 'l-glutamine', 'l-lysine',
  'taurine', 'tyrosine', 'gaba', 'glycine', 'bcaa',
  // Herbal
  'milk-thistle', 'echinacea', 'elderberry', 'ginkgo-biloba',
  'rhodiola', 'maca-root', 'saw-palmetto', 'black-seed-oil',
  'moringa', 'fenugreek', 'oregano-oil', 'garlic-extract',
  'green-tea-extract', 'tongkat-ali', 'tribulus', 'shilajit',
  'cinnamon-extract',
  // Mushrooms
  'lions-mane', 'reishi', 'cordyceps', 'turkey-tail', 'chaga',
  // Antioxidants & Specialty
  'alpha-lipoic-acid', 'resveratrol', 'astaxanthin', 'lutein',
  'lycopene', 'pqq',
  // Oils
  'fish-oil', 'krill-oil', 'evening-primrose-oil', 'mct-oil',
  // Joint & Bone
  'glucosamine', 'chondroitin', 'msm', 'hyaluronic-acid',
  // Digestive
  'digestive-enzymes', 'psyllium-husk', 'apple-cider-vinegar', 'colostrum',
  // Other
  'inositol', 'choline', 'dim', 'spirulina', 'chlorella',
  'whey-protein', 'melatonin-gummies', 'cbd-oil',
  'bee-pollen', 'royal-jelly', 'propolis',
];

// High-priority supplements (higher search volume in Israel)
const HIGH_PRIORITY = new Set([
  'melatonin', 'vitamin-d', 'magnesium', 'omega-3', 'zinc',
  'vitamin-c', 'vitamin-b12', 'iron', 'probiotics', 'collagen',
  'ashwagandha', 'creatine', 'fish-oil', 'vitamin-d3', 'biotin',
  'nac', 'melatonin-gummies', 'cbd-oil', 'whey-protein', 'lions-mane',
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
