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
      // Use Gemini image generation
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
            generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
          }),
        }
      );

      if (!res.ok) {
        const errBody = await res.text();
        console.error("Google error:", errBody);
        return new Response(
          JSON.stringify({ error: `Erro Google: ${res.status}. Verifica a tua chave.` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await res.json();
      // Try to extract image from response
      const parts = data.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((p: any) => p.inlineData);
      if (imagePart?.inlineData) {
        imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      } else {
        return new Response(
          JSON.stringify({ error: "O Google não devolveu uma imagem. Tenta reformular a prompt." }),
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
