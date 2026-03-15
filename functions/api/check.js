/**
 * Cloudflare Pages Function: /api/iherb-check
 *
 * POST — iHerb Supplement Safety Checker for Israeli consumers
 * 1. Accepts iHerb product URL
 * 2. Fetches product page, extracts supplement facts
 * 3. Cross-references MOH Drug Registry (prescription drugs in Israel)
 * 4. Cross-references D1 database (safety scores, regulatory flags)
 * 5. Returns structured safety report in Hebrew
 *
 * Body: { "url": "https://il.iherb.com/pr/..." }
 * Environment: DB (D1 benda-ingredients)
 */

const ALLOWED_ORIGINS = [
    'https://iherbchecker.com',
    'https://www.iherbchecker.com',
    'https://iherbcheck.com',
    'https://healthy-scan.app',
    'https://www.healthy-scan.app',
    'http://localhost:8788',
    'http://127.0.0.1:8788',
];

function getCorsHeaders(request) {
    const origin = request.headers.get('Origin') || '';
    const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': allowed,
        'Access-Control-Allow-Headers': 'content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Vary': 'Origin',
    };
}

const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
};

const RATE_LIMIT = {
    MAX_PER_MINUTE: 5,
    MAX_PER_DAY: 15,
    WINDOW_SECONDS: 60,
    DAY_SECONDS: 86400,
    CLEANUP_CHANCE: 0.05,
};

async function checkRateLimit(request, db) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Math.floor(Date.now() / 1000);
    const minuteAgo = now - RATE_LIMIT.WINDOW_SECONDS;
    const dayAgo = now - RATE_LIMIT.DAY_SECONDS;

    try {
        const minuteResult = await db.prepare(
            'SELECT COUNT(*) as cnt FROM rate_limits WHERE ip = ? AND ts > ? AND endpoint = ?'
        ).bind(ip, minuteAgo, 'iherb-check').first();
        if ((minuteResult?.cnt || 0) >= RATE_LIMIT.MAX_PER_MINUTE) {
            return { allowed: false, reason: 'Too many requests. Please wait a moment.' };
        }

        const dayResult = await db.prepare(
            'SELECT COUNT(*) as cnt FROM rate_limits WHERE ip = ? AND ts > ? AND endpoint = ?'
        ).bind(ip, dayAgo, 'iherb-check').first();
        if ((dayResult?.cnt || 0) >= RATE_LIMIT.MAX_PER_DAY) {
            return { allowed: false, reason: 'Daily check limit reached. Come back tomorrow!' };
        }

        try {
            await db.prepare(
                'INSERT INTO rate_limits (ip, ts, endpoint) VALUES (?, ?, ?)'
            ).bind(ip, now, 'iherb-check').run();
        } catch (e) {
            await db.prepare(
                'INSERT INTO rate_limits (ip, ts) VALUES (?, ?)'
            ).bind(ip, now).run();
        }

        if (Math.random() < RATE_LIMIT.CLEANUP_CHANCE) {
            await db.prepare('DELETE FROM rate_limits WHERE ts < ?').bind(dayAgo - 60).run();
        }

        return { allowed: true };
    } catch (e) {
        console.error('iherb-check rate limit error:', e.message);
        return { allowed: true };
    }
}

export async function onRequestOptions(context) {
    return new Response('ok', {
        headers: { ...getCorsHeaders(context.request), ...SECURITY_HEADERS },
    });
}

// ── iHerb page parser ──────────────────────────────────────────
function parseIHerbPage(html) {
    const result = {
        name: null,
        brand: null,
        upc: null,
        productCode: null,
        servingSize: null,
        ingredients: [],
        otherIngredients: null,
        warnings: null,
        suggestedUse: null,
    };

    // Product name from <title>
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
        result.name = titleMatch[1].replace(/\s*\|\s*iHerb.*$/, '').trim();
    }

    // Brand from og:brand or breadcrumb
    const brandMatch = html.match(/itemprop="brand"[^>]*>([^<]+)</) ||
                        html.match(/"brand":\s*"([^"]+)"/);
    if (brandMatch) result.brand = brandMatch[1].trim();

    // UPC
    const upcMatch = html.match(/UPC[:\s<>\/span]+(\d{10,14})/i);
    if (upcMatch) result.upc = upcMatch[1];

    // Product code
    const codeMatch = html.match(/Product code[:\s<>\/span]+([A-Z0-9]+-[A-Z0-9]+)/i);
    if (codeMatch) result.productCode = codeMatch[1];

    // ── Supplement Facts Table ──
    const servIdx = html.indexOf('Serving Size');
    if (servIdx > -1) {
        const tableStart = html.lastIndexOf('<table', servIdx);
        const tableEnd = html.indexOf('</table>', servIdx);
        if (tableStart > -1 && tableEnd > -1) {
            const tableHtml = html.substring(tableStart, tableEnd + 8);

            const ssMatch = tableHtml.match(/Serving Size[:\s]*<\/\w+>\s*([^<]+)/i) ||
                            tableHtml.match(/Serving Size[:\s]*([^<]+)/i);
            if (ssMatch) result.servingSize = ssMatch[1].trim();

            // Extract ingredient rows
            const rowRegex = /<tr[^>]*>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]*)<\/td>/gi;
            let match;
            while ((match = rowRegex.exec(tableHtml)) !== null) {
                const name = match[1].replace(/&nbsp;/g, ' ').trim();
                const amount = match[2].replace(/&nbsp;/g, ' ').trim();
                const dv = match[3].replace(/&nbsp;/g, ' ').replace(/[†*]/g, '').trim();

                if (name.toLowerCase().includes('amount') || name.toLowerCase().includes('serving')) continue;
                if (name.toLowerCase().includes('daily value')) continue;

                if (name && amount) {
                    const doseMatch = amount.match(/([\d,.]+)\s*(mg|mcg|µg|g|IU|ml|CFU|billion|million)/i);
                    result.ingredients.push({
                        name,
                        amount,
                        dosage: doseMatch ? parseFloat(doseMatch[1].replace(',', '')) : null,
                        unit: doseMatch ? doseMatch[2].toLowerCase() : null,
                        dailyValue: dv ? dv.replace('%', '').trim() : null,
                    });
                }
            }

            // Fallback: bold-wrapped names
            if (result.ingredients.length === 0) {
                const boldRowRegex = /<tr[^>]*>.*?<td[^>]*>.*?<(?:strong|b)>([^<]+)<\/(?:strong|b)>.*?<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]*)<\/td>/gis;
                while ((match = boldRowRegex.exec(tableHtml)) !== null) {
                    const name = match[1].replace(/&nbsp;/g, ' ').trim();
                    const amount = match[2].replace(/&nbsp;/g, ' ').trim();
                    const dv = match[3].replace(/&nbsp;/g, ' ').replace(/[†*]/g, '').trim();
                    if (name.toLowerCase().includes('amount') || name.toLowerCase().includes('serving')) continue;
                    const doseMatch = amount.match(/([\d,.]+)\s*(mg|mcg|µg|g|IU|ml|CFU|billion|million)/i);
                    result.ingredients.push({
                        name, amount,
                        dosage: doseMatch ? parseFloat(doseMatch[1].replace(',', '')) : null,
                        unit: doseMatch ? doseMatch[2].toLowerCase() : null,
                        dailyValue: dv ? dv.replace('%', '').trim() : null,
                    });
                }
            }
        }
    }

    // ── Other Ingredients ──
    const otherIdx = html.indexOf('Other Ingredients');
    if (otherIdx > -1) {
        const snippet = html.substring(otherIdx, otherIdx + 600);
        const textMatch = snippet.match(/Other Ingredients[^<]*<\/[^>]+>\s*<[^>]+>([^<]+)/i);
        if (textMatch) result.otherIngredients = textMatch[1].replace(/&nbsp;/g, ' ').trim();
    }

    // ── Warnings ──
    const warnIdx = html.indexOf('>Warnings<');
    if (warnIdx > -1) {
        const snippet = html.substring(warnIdx, warnIdx + 800);
        const parts = [];
        const textRegex = />([^<]{10,})</g;
        let m;
        while ((m = textRegex.exec(snippet)) !== null) {
            const t = m[1].replace(/&nbsp;/g, ' ').trim();
            if (t && !t.includes('Disclaimer') && !t.includes('iHerb strives')) parts.push(t);
            if (parts.length >= 3) break;
        }
        if (parts.length) result.warnings = parts.join(' ');
    }

    // ── Suggested Use ──
    const sugIdx = html.indexOf('Suggested Use');
    if (sugIdx > -1) {
        const snippet = html.substring(sugIdx, sugIdx + 500);
        const textMatch = snippet.match(/Suggested Use[^<]*<\/[^>]+>\s*<[^>]+>([^<]+)/i);
        if (textMatch) result.suggestedUse = textMatch[1].replace(/&nbsp;/g, ' ').trim();
    }

    return result;
}

// ── MOH Drug Registry lookup ───────────────────────────────────
async function checkMOHDrugRegistry(ingredientName) {
    try {
        const url = `https://israeldrugs.health.gov.il/GovServiceList/IDRServer/SearchByName?val=${encodeURIComponent(ingredientName)}&prescription=&healthBasket=`;
        const resp = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'HealthyScan/1.0',
            },
        });
        if (!resp.ok) return { found: false, error: resp.status };
        const data = await resp.json();
        if (!Array.isArray(data) || data.length === 0) return { found: false };

        const prescriptionDrugs = data.filter(d => d.prescription === true || d.prescription === 'true');
        const healthBasket = data.filter(d => d.healthBasket === true || d.healthBasket === 'true');

        return {
            found: true,
            totalResults: data.length,
            isPrescription: prescriptionDrugs.length > 0,
            inHealthBasket: healthBasket.length > 0,
            drugNames: data.slice(0, 5).map(d => ({
                name: d.dragHebName || d.dragEnName || d.name,
                nameEn: d.dragEnName,
                prescription: d.prescription,
                healthBasket: d.healthBasket,
            })),
        };
    } catch (e) {
        return { found: false, error: e.message };
    }
}

// ── D1 database safety lookup ──────────────────────────────────
async function checkD1Safety(db, ingredientName) {
    try {
        const additive = await db.prepare(
            `SELECT common_name, e_number, safety_score, iarc_group, health_concerns, eu_status, us_status, hebrew_name
             FROM food_additives
             WHERE common_name LIKE ? OR e_number LIKE ?
             LIMIT 1`
        ).bind(`%${ingredientName}%`, `%${ingredientName}%`).first();

        const ingredient = await db.prepare(
            `SELECT name, safety_score, concern_level, regulatory_status, description
             FROM ingredients
             WHERE name LIKE ?
             LIMIT 1`
        ).bind(`%${ingredientName}%`).first();

        const flags = await db.prepare(
            `SELECT list_name, status, details
             FROM regulatory_lists
             WHERE ingredient_name LIKE ?
             LIMIT 5`
        ).bind(`%${ingredientName}%`).all();

        return {
            additive: additive || null,
            ingredient: ingredient || null,
            regulatoryFlags: flags?.results || [],
        };
    } catch (e) {
        return { additive: null, ingredient: null, regulatoryFlags: [], error: e.message };
    }
}

// ── Upper Tolerable Intake Limits (ULs) ────────────────────────
const UPPER_LIMITS = {
    'vitamin a': { ul: 3000, unit: 'mcg', note: 'רעילות כבד במינון גבוה' },
    'vitamin c': { ul: 2000, unit: 'mg', note: 'הפרעות עיכול במינון גבוה' },
    'vitamin d': { ul: 100, unit: 'mcg', note: 'רעילות: היפרקלצמיה' },
    'vitamin d3': { ul: 100, unit: 'mcg', note: 'רעילות: היפרקלצמיה' },
    'vitamin e': { ul: 1000, unit: 'mg', note: 'סיכון לדימומים' },
    'vitamin b6': { ul: 100, unit: 'mg', note: 'נוירופתיה פריפרית' },
    'vitamin b-6': { ul: 100, unit: 'mg', note: 'נוירופתיה פריפרית' },
    'niacin': { ul: 35, unit: 'mg', note: 'גלי חום (flushing)' },
    'folate': { ul: 1000, unit: 'mcg', note: 'מסווה חוסר B12' },
    'folic acid': { ul: 1000, unit: 'mcg', note: 'מסווה חוסר B12' },
    'iron': { ul: 45, unit: 'mg', note: 'הפרעות עיכול; רעילות בילדים' },
    'zinc': { ul: 40, unit: 'mg', note: 'חוסר נחושת; ירידה בחיסון' },
    'selenium': { ul: 400, unit: 'mcg', note: 'סלנוזיס: נשירת שיער, בחילות' },
    'calcium': { ul: 2500, unit: 'mg', note: 'אבני כליות; הפרעות לב' },
    'magnesium': { ul: 350, unit: 'mg', note: 'שלשולים (ממקור תוסף)' },
    'manganese': { ul: 11, unit: 'mg', note: 'רעילות עצבית' },
    'copper': { ul: 10, unit: 'mg', note: 'רעילות כבד' },
    'iodine': { ul: 1100, unit: 'mcg', note: 'הפרעות בלוטת התריס' },
    'chromium': { ul: null, unit: 'mcg', note: 'אין UL רשמי; זהירות מעל 1000mcg' },
    'melatonin': { ul: null, unit: 'mg', note: 'תרופת מרשם בישראל! אין UL רשמי; מינון מקובל 0.5-5mg' },
};

function checkUpperLimit(ingredientName, dosage, unit) {
    const key = ingredientName.toLowerCase().replace(/\(.*\)/, '').trim();
    for (const [name, limit] of Object.entries(UPPER_LIMITS)) {
        if (key.includes(name) || name.includes(key)) {
            if (limit.ul === null) {
                return { hasLimit: false, note: limit.note };
            }
            let normalizedDosage = dosage;
            if (unit === 'iu' && name.includes('vitamin d')) {
                normalizedDosage = dosage * 0.025;
            } else if (unit === 'iu' && name.includes('vitamin a')) {
                normalizedDosage = dosage * 0.3;
            } else if (unit === 'iu' && name.includes('vitamin e')) {
                normalizedDosage = dosage * 0.67;
            }
            const exceeds = normalizedDosage > limit.ul;
            const pct = Math.round((normalizedDosage / limit.ul) * 100);
            return { hasLimit: true, ul: limit.ul, ulUnit: limit.unit, dosage: normalizedDosage, pctOfUL: pct, exceeds, note: limit.note };
        }
    }
    return null;
}

// ── Hebrew ingredient names ────────────────────────────────────
const HEBREW_NAMES = {
    'melatonin': 'מלטונין',
    'vitamin a': 'ויטמין A', 'vitamin b6': 'ויטמין B6', 'vitamin b-6': 'ויטמין B6',
    'vitamin b12': 'ויטמין B12', 'vitamin c': 'ויטמין C', 'vitamin d': 'ויטמין D',
    'vitamin d3': 'ויטמין D3', 'vitamin e': 'ויטמין E', 'vitamin k': 'ויטמין K',
    'vitamin k2': 'ויטמין K2', 'iron': 'ברזל', 'zinc': 'אבץ', 'calcium': 'סידן',
    'magnesium': 'מגנזיום', 'selenium': 'סלניום', 'iodine': 'יוד',
    'folate': 'חומצה פולית', 'folic acid': 'חומצה פולית', 'niacin': 'ניאצין',
    'biotin': 'ביוטין', 'chromium': 'כרום', 'copper': 'נחושת', 'manganese': 'מנגן',
    'potassium': 'אשלגן', 'omega-3': 'אומגה 3', 'fish oil': 'שמן דגים',
    'probiotics': 'פרוביוטיקה', 'collagen': 'קולגן', 'ashwagandha': 'אשוגנדה',
    'turmeric': 'כורכום', 'curcumin': 'כורכומין', 'coq10': 'קו-אנזים Q10',
    'coenzyme q10': 'קו-אנזים Q10', 'glucosamine': 'גלוקוזאמין',
    'chondroitin': 'כונדרויטין', 'spirulina': 'ספירולינה', 'chlorella': 'כלורלה',
    'echinacea': 'אכינצאה', 'elderberry': 'סמבוק', 'ginkgo biloba': 'גינקו בילובה',
    'valerian': 'ולריאן', 'pyridoxine': 'פירידוקסין', 'thiamine': 'תיאמין',
    'riboflavin': 'ריבופלבין', 'pantothenic acid': 'חומצה פנטותנית',
};

function getHebrewName(engName) {
    const key = engName.toLowerCase().replace(/\(.*\)/, '').trim();
    for (const [en, he] of Object.entries(HEBREW_NAMES)) {
        if (key.includes(en) || en.includes(key)) return he;
    }
    return null;
}

// ── Score calculation ──────────────────────────────────────────
function calculateScore(ingredients, mohResults, ulResults) {
    let score = 100;
    for (const ing of ingredients) {
        const moh = mohResults[ing.name];
        const ul = ulResults[ing.name];
        if (moh?.isPrescription) score -= 25;
        if (ul?.exceeds) score -= 20;
        else if (ul?.pctOfUL > 80) score -= 5;
        if (ing.dailyValue && parseFloat(ing.dailyValue) > 500) score -= 3;
    }
    return Math.max(0, Math.min(100, score));
}

function getVerdict(score) {
    if (score >= 75) return { verdict: 'בטוח', verdictEn: 'Safe', color: 'safe' };
    if (score >= 50) return { verdict: 'שים לב', verdictEn: 'Caution', color: 'caution' };
    return { verdict: 'בעייתי', verdictEn: 'Concern', color: 'concern' };
}

// ── Main handler ───────────────────────────────────────────────
export async function onRequestPost(context) {
    const { request, env } = context;
    const cors = getCorsHeaders(request);
    const headers = { ...cors, ...SECURITY_HEADERS, 'Content-Type': 'application/json' };

    try {
        // Rate limiting — this endpoint fans out to 20+ external API calls per request
        if (env.DB) {
            const rateCheck = await checkRateLimit(request, env.DB);
            if (!rateCheck.allowed) {
                return new Response(JSON.stringify({
                    error: rateCheck.reason,
                    errorEn: rateCheck.reason,
                }), { status: 429, headers });
            }
        }

        const body = await request.json();
        let rawInput = (body.url || '').trim();

        // Extract iHerb URL from pasted text (iHerb "Share" copies text + URL together)
        // Handles both full URLs and short invite links (iherb.co/XXX?rcode=...)
        const fullUrlMatch = rawInput.match(/https?:\/\/(?:www\.|il\.)?iherb\.com\/pr\/[^\s"'<>]+/i);
        const shortUrlMatch = rawInput.match(/https?:\/\/iherb\.co\/[^\s"'<>]+/i);
        let iherbUrl = fullUrlMatch ? fullUrlMatch[0] : (shortUrlMatch ? shortUrlMatch[0] : rawInput);

        // Resolve iherb.co short/invite links by following the redirect
        let parsedUrl;
        try { parsedUrl = new URL(iherbUrl); } catch { parsedUrl = null; }

        if (parsedUrl && parsedUrl.hostname === 'iherb.co') {
            // iherb.co is behind Cloudflare and blocks server-side fetch (522).
            // Use unshorten.me API as fallback to resolve the short link.
            let resolved = false;
            try {
                const resolveResp = await fetch(
                    `https://unshorten.me/json/${encodeURIComponent(parsedUrl.href)}`,
                    { headers: { 'User-Agent': 'iHerbChecker/1.0' } }
                );
                if (resolveResp.ok) {
                    const data = await resolveResp.json();
                    if (data.success && data.resolved_url) {
                        try { parsedUrl = new URL(data.resolved_url); resolved = true; } catch { /* ignore */ }
                    }
                }
            } catch { /* fallback below */ }

            // Fallback: try direct fetch in case Cloudflare allows it sometimes
            if (!resolved) {
                try {
                    const redirectResp = await fetch(parsedUrl.href, {
                        redirect: 'follow',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Accept': 'text/html',
                        },
                    });
                    const resolvedUrl = redirectResp.url;
                    try { parsedUrl = new URL(resolvedUrl); } catch { parsedUrl = null; }
                } catch {
                    parsedUrl = null;
                }
            }
        }

        // Strip referral/tracking params (rcode, utm_*, etc.)
        if (parsedUrl) {
            parsedUrl.searchParams.delete('rcode');
            [...parsedUrl.searchParams.keys()]
                .filter(k => k.startsWith('utm_'))
                .forEach(k => parsedUrl.searchParams.delete(k));
        }

        // Validate URL: must be a real iHerb product page (prevent SSRF)
        const validHosts = ['iherb.com', 'www.iherb.com', 'il.iherb.com'];
        if (!parsedUrl || !validHosts.includes(parsedUrl.hostname) || !parsedUrl.pathname.startsWith('/pr/')) {
            return new Response(JSON.stringify({
                error: 'כתובת לא תקינה. יש להזין קישור למוצר מ-iHerb',
                errorEn: 'Invalid URL. Please enter an iHerb product link.',
            }), { status: 400, headers });
        }

        // Step 1: Fetch iHerb product page
        const pageResp = await fetch(parsedUrl.href, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html',
                'Accept-Language': 'en-US,en;q=0.9',
            },
        });

        if (!pageResp.ok) {
            return new Response(JSON.stringify({
                error: 'לא ניתן לגשת לדף המוצר',
                errorEn: 'Could not access product page',
            }), { status: 502, headers });
        }

        const html = await pageResp.text();
        const product = parseIHerbPage(html);

        if (product.ingredients.length === 0) {
            return new Response(JSON.stringify({
                error: 'לא נמצאו רכיבים בדף המוצר. ייתכן שהמוצר הופסק.',
                errorEn: 'No supplement facts found. Product may be discontinued.',
                product: { name: product.name, brand: product.brand },
            }), { status: 404, headers });
        }

        // Step 2: Cross-reference all ingredients in parallel
        const mohResults = {};
        const d1Results = {};
        const ulResults = {};

        const lookups = product.ingredients.map(async (ing) => {
            mohResults[ing.name] = await checkMOHDrugRegistry(ing.name);
            if (env.DB) {
                d1Results[ing.name] = await checkD1Safety(env.DB, ing.name);
            }
            if (ing.dosage && ing.unit) {
                ulResults[ing.name] = checkUpperLimit(ing.name, ing.dosage, ing.unit);
            }
        });

        await Promise.all(lookups);

        // Step 3: Build enriched ingredient list
        const enrichedIngredients = product.ingredients.map(ing => {
            const moh = mohResults[ing.name];
            const ul = ulResults[ing.name];
            const hebrewName = getHebrewName(ing.name);
            const flags = [];

            if (moh?.isPrescription) {
                flags.push({ type: 'prescription', severity: 'high', text: 'תרופת מרשם בישראל!', textEn: 'Prescription drug in Israel!' });
            }
            if (moh?.found && !moh?.isPrescription) {
                flags.push({ type: 'registered', severity: 'info', text: 'רשום במאגר התרופות', textEn: 'Registered in MOH drug database' });
            }
            if (ul?.exceeds) {
                flags.push({ type: 'exceeds_ul', severity: 'high', text: `חורג מהמינון העליון! ${ul.pctOfUL}% מה-UL (${ul.ul}${ul.ulUnit})`, textEn: `Exceeds Upper Limit! ${ul.pctOfUL}% of UL (${ul.ul}${ul.ulUnit})` });
            } else if (ul?.pctOfUL > 80) {
                flags.push({ type: 'near_ul', severity: 'medium', text: `קרוב למינון העליון: ${ul.pctOfUL}% מה-UL`, textEn: `Near Upper Limit: ${ul.pctOfUL}% of UL` });
            }
            if (ul?.note) {
                flags.push({ type: 'note', severity: ul?.exceeds ? 'high' : 'info', text: ul.note });
            }

            return {
                name: ing.name,
                hebrewName,
                amount: ing.amount,
                dailyValue: ing.dailyValue,
                flags,
                moh: moh?.found ? { isPrescription: moh.isPrescription, inHealthBasket: moh.inHealthBasket } : null,
            };
        });

        // Step 4: Calculate score
        const score = calculateScore(product.ingredients, mohResults, ulResults);
        const verdict = getVerdict(score);

        return new Response(JSON.stringify({
            score,
            ...verdict,
            product: {
                name: product.name,
                brand: product.brand,
                upc: product.upc,
                servingSize: product.servingSize,
                warnings: product.warnings,
                suggestedUse: product.suggestedUse,
            },
            ingredients: enrichedIngredients,
            otherIngredients: product.otherIngredients,
            meta: {
                checkedAt: new Date().toISOString(),
                mohApiUsed: Object.values(mohResults).some(r => r.found),
                ingredientCount: product.ingredients.length,
                flagCount: enrichedIngredients.reduce((sum, ing) => sum + ing.flags.length, 0),
            },
        }), { status: 200, headers });

    } catch (e) {
        console.error('iherb-check error:', e.message);
        return new Response(JSON.stringify({
            error: 'שגיאה בעיבוד הבקשה',
            errorEn: 'Error processing request',
        }), { status: 500, headers });
    }
}
