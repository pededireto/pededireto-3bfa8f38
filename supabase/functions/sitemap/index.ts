import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://pededireto.pt";

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
    .select("slug, updated_at")
    .eq("is_active", true);

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
  for (const c of categories ?? []) {
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

  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
