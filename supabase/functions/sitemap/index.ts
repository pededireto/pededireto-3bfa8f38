import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://pededireto.pt";

const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date().toISOString().split("T")[0];

  // Static pages
  const staticPages = [
    { loc: "/", changefreq: "daily", priority: "1.0" },
    { loc: "/blog", changefreq: "weekly", priority: "0.8" },
    { loc: "/pesquisa", changefreq: "monthly", priority: "0.3" },
  ];

  // Institutional pages
  const { data: pages } = await supabase
    .from("institutional_pages")
    .select("slug, updated_at")
    .eq("is_active", true);

  // Categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug, updated_at");

  // Subcategories
  const { data: subcategories } = await supabase
    .from("subcategories")
    .select("id, slug, category_id, updated_at")
    .eq("is_active", true);

  // Active businesses
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, slug, updated_at, city, category_id")
    .eq("is_active", true);

  // Business-subcategory junction
  const { data: businessSubcategories } = await supabase
    .from("business_subcategories")
    .select("business_id, subcategory_id");

  // Business-cities junction (multi-city support)
  const { data: businessCities } = await supabase
    .from("business_cities")
    .select("business_id, city_name");

  // Published blog posts
  const { data: blogPosts } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("is_published", true);

  // Build lookup maps
  const catIdToSlug = new Map<string, string>();
  for (const c of categories ?? []) {
    catIdToSlug.set(c.id, c.slug);
  }

  const subIdToData = new Map<string, { slug: string; catSlug: string }>();
  for (const s of subcategories ?? []) {
    const catSlug = catIdToSlug.get(s.category_id);
    if (catSlug) {
      subIdToData.set(s.id, { slug: s.slug, catSlug });
    }
  }

  // Build business -> all cities map (from both businesses.city and business_cities)
  const businessCitiesMap = new Map<string, Set<string>>();
  for (const b of businesses ?? []) {
    const cities = new Set<string>();
    if (b.city) cities.add(b.city);
    businessCitiesMap.set(b.id, cities);
  }
  for (const bc of businessCities ?? []) {
    const cities = businessCitiesMap.get(bc.business_id);
    if (cities) {
      cities.add(bc.city_name);
    }
  }

  const businessById = new Map<string, { city: string | null }>();
  for (const b of businesses ?? []) {
    businessById.set(b.id, { city: b.city });
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Static
  for (const p of staticPages) {
    xml += `  <url>
    <loc>${BASE_URL}${p.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>
`;
  }

  // Institutional
  for (const p of pages ?? []) {
    xml += `  <url>
    <loc>${BASE_URL}/pagina/${p.slug}</loc>
    <lastmod>${(p.updated_at || now).split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`;
  }

  // Categories — priority 0.8
  for (const c of categories ?? []) {
    xml += `  <url>
    <loc>${BASE_URL}/categoria/${c.slug}</loc>
    <lastmod>${(c.updated_at || now).split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  }

  // Subcategories — priority 0.8
  for (const s of subcategories ?? []) {
    const catSlug = catIdToSlug.get(s.category_id);
    if (!catSlug) continue;
    xml += `  <url>
    <loc>${BASE_URL}/categoria/${catSlug}/${s.slug}</loc>
    <lastmod>${(s.updated_at || now).split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  }

  // Businesses — priority 0.6
  for (const b of businesses ?? []) {
    xml += `  <url>
    <loc>${BASE_URL}/negocio/${b.slug}</loc>
    <lastmod>${(b.updated_at || now).split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
  }

  // Blog posts
  for (const post of blogPosts ?? []) {
    xml += `  <url>
    <loc>${BASE_URL}/blog/${post.slug}</loc>
    <lastmod>${(post.updated_at || now).split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
  }

  // Top ranking pages — /top/:subcategorySlug — priority 0.8
  for (const s of subcategories ?? []) {
    xml += `  <url>
    <loc>${BASE_URL}/top/${s.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  }

  // Subcategory + City combinations — priority 0.7
  // Also build top ranking + city pages (min 3 businesses)
  const subCityCounts = new Map<string, number>(); // "subSlug/citySlug" -> count
  const seenSubCity = new Set<string>();

  for (const bs of businessSubcategories ?? []) {
    const subData = subIdToData.get(bs.subcategory_id);
    if (!subData) continue;

    // Get all cities for this business (from both columns)
    const allCities = businessCitiesMap.get(bs.business_id);
    if (!allCities || allCities.size === 0) continue;

    for (const cityName of allCities) {
      const citySlug = slugify(cityName);

      // Subcategory + City page
      const key = `${subData.catSlug}/${subData.slug}/${citySlug}`;
      if (!seenSubCity.has(key)) {
        seenSubCity.add(key);
        xml += `  <url>
    <loc>${BASE_URL}/categoria/${subData.catSlug}/${subData.slug}/cidade/${citySlug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }

      // Count for top ranking + city
      const topKey = `${subData.slug}/${citySlug}`;
      subCityCounts.set(topKey, (subCityCounts.get(topKey) || 0) + 1);
    }
  }

  // Top ranking + city pages (only if >= 3 businesses)
  for (const [key, count] of subCityCounts) {
    if (count >= 3) {
      xml += `  <url>
    <loc>${BASE_URL}/top/${key}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }
  }

  // SEO short URLs: /s/:subSlug/:citySlug (only if >= 3 businesses)
  const seenShortUrl = new Set<string>();
  for (const bs of businessSubcategories ?? []) {
    const subData = subIdToData.get(bs.subcategory_id);
    if (!subData) continue;
    const biz = businessById.get(bs.business_id);
    if (!biz?.city) continue;
    const citySlugVal = slugify(biz.city);
    const shortKey = `${subData.slug}/${citySlugVal}`;
    if (!seenShortUrl.has(shortKey)) {
      seenShortUrl.add(shortKey);
    }
  }

  // Count businesses per short URL combo
  const shortUrlCounts = new Map<string, number>();
  for (const bs of businessSubcategories ?? []) {
    const subData = subIdToData.get(bs.subcategory_id);
    if (!subData) continue;
    const biz = businessById.get(bs.business_id);
    if (!biz?.city) continue;
    const shortKey = `${subData.slug}/${slugify(biz.city)}`;
    shortUrlCounts.set(shortKey, (shortUrlCounts.get(shortKey) || 0) + 1);
  }

  for (const [key, count] of shortUrlCounts) {
    if (count >= 3) {
      xml += `  <url>
    <loc>${BASE_URL}/s/${key}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }
  }

  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
