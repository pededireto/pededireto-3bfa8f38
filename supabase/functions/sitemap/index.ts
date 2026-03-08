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
    .select("slug, updated_at");

  // Active businesses
  const { data: businesses } = await supabase
    .from("businesses")
    .select("slug, updated_at, city, category_id")
    .eq("is_active", true);

  // Published blog posts
  const { data: blogPosts } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("is_published", true);

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

  // Categories
  const catSlugMap = new Map<string, string>();
  for (const c of categories ?? []) {
    catSlugMap.set(c.slug, c.slug);
    xml += `  <url>
    <loc>${BASE_URL}/categoria/${c.slug}</loc>
    <lastmod>${(c.updated_at || now).split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  }

  // Businesses
  for (const b of businesses ?? []) {
    xml += `  <url>
    <loc>${BASE_URL}/negocio/${b.slug}</loc>
    <lastmod>${(b.updated_at || now).split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
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

  // Category + City combinations
  const catIdToSlug = new Map<string, string>();
  if (categories && businesses) {
    // Build category_id → slug map
    const { data: catsWithId } = await supabase
      .from("categories")
      .select("id, slug");
    for (const c of catsWithId ?? []) {
      catIdToSlug.set(c.id, c.slug);
    }

    // Deduplicate category+city combos
    const seen = new Set<string>();
    for (const b of businesses) {
      if (!b.city || !b.category_id) continue;
      const catSlug = catIdToSlug.get(b.category_id);
      if (!catSlug) continue;
      const citySlug = slugify(b.city);
      const key = `${catSlug}/${citySlug}`;
      if (seen.has(key)) continue;
      seen.add(key);

      xml += `  <url>
    <loc>${BASE_URL}/categoria/${catSlug}/cidade/${citySlug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
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
