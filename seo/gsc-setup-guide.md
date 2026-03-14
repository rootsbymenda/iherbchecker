# Google Search Console Setup for iherbchecker.com

## Step 1: Add Property
1. Go to https://search.google.com/search-console
2. Click "Add Property" (top-left dropdown)
3. Choose **Domain** property type (covers all subdomains + http/https)
4. Enter: `iherbchecker.com`

## Step 2: Verify via Cloudflare DNS
1. Google will show a TXT record value like: `google-site-verification=XXXXXXX`
2. Go to Cloudflare Dashboard > iherbchecker.com > DNS
3. Add record:
   - Type: **TXT**
   - Name: `@`
   - Content: paste the full `google-site-verification=...` string
   - TTL: Auto
4. Save, go back to GSC, click **Verify**
5. DNS propagation takes 1-10 minutes on Cloudflare (fast)

## Step 3: Submit Sitemap
1. In GSC left sidebar, click **Sitemaps**
2. Enter: `https://iherbchecker.com/sitemap.xml`
3. Click **Submit**
4. Status should show "Success" after Google fetches it

## Step 4: Request Indexing
1. In GSC, use the **URL Inspection** tool (top search bar)
2. Enter: `https://iherbchecker.com/`
   - Click **Request Indexing**
3. Enter: `https://iherbchecker.com/iherb/melatonin`
   - Click **Request Indexing**
4. Google typically crawls within 24-48 hours after request

## Step 5: Also Add iherbcheck.com (redirect domain)
1. Add `iherbcheck.com` as a separate Domain property
2. Verify with same TXT record method on Cloudflare (iherbcheck.com zone)
3. This tells Google the redirect is legit and to consolidate signals to iherbchecker.com

## Notes
- Domain property is better than URL-prefix because it catches all variants
- The sitemap at /sitemap.xml should list all product check pages we want indexed
- Check back in 3-7 days for initial indexing data in the Performance report
- If pages aren't being indexed, check for noindex tags or crawl errors in Coverage report
