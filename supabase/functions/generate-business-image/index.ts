import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { business_id, prompt, aspect_ratio } = await req.json();

    if (!business_id || !prompt) {
      return new Response(JSON.stringify({ error: "business_id e prompt são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership
    const { data: biz } = await supabase
      .from("businesses")
      .select("owner_id")
      .eq("id", business_id)
      .single();

    if (!biz || biz.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: "Sem permissão para este negócio" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get API key
    const { data: keyRow } = await supabase
      .from("business_api_keys")
      .select("*")
      .eq("business_id", business_id)
      .eq("is_active", true)
      .single();

    if (!keyRow) {
      return new Response(JSON.stringify({ error: "Nenhuma chave API configurada" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const provider = keyRow.provider;
    const apiKey = keyRow.api_key_encrypted;
    let imageUrl = "";

    // Map aspect ratio to dimensions
    const sizeMap: Record<string, string> = {
      "9:16": "1024x1792",
      "1:1": "1024x1024",
      "16:9": "1792x1024",
      "4:5": "1024x1280",
      "2:3": "1024x1536",
    };
    const size = sizeMap[aspect_ratio || "1:1"] || "1024x1024";

    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt,
          n: 1,
          size,
          quality: "standard",
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error("OpenAI error:", errBody);
        return new Response(
          JSON.stringify({ error: `Erro OpenAI: ${res.status}. Verifica a tua chave e créditos.` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await res.json();
      imageUrl = data.data?.[0]?.url || "";
    } else if (provider === "google") {
      // Use Lovable AI Gateway to avoid geo-restrictions on direct Google API
      const lovableKey = Deno.env.get("LOVABLE_API_KEY");
      if (!lovableKey) {
        return new Response(
          JSON.stringify({ error: "Chave Lovable AI não configurada. Contacta o suporte." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: `Generate an image: ${prompt}` }],
          modalities: ["image", "text"],
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error("Lovable AI Gateway error:", errBody);
        return new Response(
          JSON.stringify({ error: `Erro ao gerar imagem: ${res.status}. Tenta novamente.` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await res.json();
      const imgData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (imgData) {
        imageUrl = imgData;
      } else {
        return new Response(
          JSON.stringify({ error: "Não foi possível gerar a imagem. Tenta reformular a prompt." }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (provider === "ideogram") {
      const arMap: Record<string, string> = {
        "9:16": "ASPECT_9_16",
        "1:1": "ASPECT_1_1",
        "16:9": "ASPECT_16_9",
        "4:5": "ASPECT_4_5",
        "2:3": "ASPECT_2_3",
      };

      const res = await fetch("https://api.ideogram.ai/generate", {
        method: "POST",
        headers: {
          "Api-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_request: {
            prompt,
            aspect_ratio: arMap[aspect_ratio || "1:1"] || "ASPECT_1_1",
            model: "V_2",
          },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error("Ideogram error:", errBody);
        return new Response(
          JSON.stringify({ error: `Erro Ideogram: ${res.status}. Verifica a tua chave e créditos.` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await res.json();
      imageUrl = data.data?.[0]?.url || "";
    } else if (provider === "fal") {
      // fal.ai Flux integration
      const sizeMap: Record<string, { width: number; height: number }> = {
        "9:16": { width: 576, height: 1024 },
        "1:1": { width: 1024, height: 1024 },
        "16:9": { width: 1024, height: 576 },
        "4:5": { width: 819, height: 1024 },
        "2:3": { width: 683, height: 1024 },
      };
      const dims = sizeMap[aspect_ratio || "1:1"] || sizeMap["1:1"];

      const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
        method: "POST",
        headers: {
          "Authorization": `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          image_size: { width: dims.width, height: dims.height },
          num_inference_steps: 4,
          num_images: 1,
          enable_safety_checker: true,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error("fal.ai error:", errBody);
        return new Response(
          JSON.stringify({ error: `Erro fal.ai: ${res.status}. Verifica a tua chave e créditos.` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await res.json();
      imageUrl = data.images?.[0]?.url || "";
    }

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Não foi possível gerar a imagem. Tenta novamente." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ image_url: imageUrl, provider }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-business-image error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno ao gerar imagem" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
