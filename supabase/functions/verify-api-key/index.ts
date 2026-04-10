import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { provider, api_key } = await req.json();

    if (!provider || !api_key) {
      return new Response(JSON.stringify({ valid: false, error: "Provider e chave são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let valid = false;
    let errorMsg = "";

    if (provider === "openai") {
      // Test with models list endpoint (cheap/free)
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${api_key}` },
      });
      if (res.ok) {
        valid = true;
      } else {
        const body = await res.text();
        errorMsg = res.status === 401 ? "Chave inválida ou sem permissões" : `Erro OpenAI: ${res.status}`;
      }
    } else if (provider === "google") {
      // Test with Gemini models list
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${api_key}`);
      if (res.ok) {
        valid = true;
      } else {
        errorMsg = res.status === 400 || res.status === 403 ? "Chave inválida" : `Erro Google: ${res.status}`;
      }
    } else if (provider === "ideogram") {
      // Test with a simple describe endpoint or similar
      const res = await fetch("https://api.ideogram.ai/describe", {
        method: "POST",
        headers: {
          "Api-Key": api_key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image_url: "https://placehold.co/1x1" }),
      });
      // 401/403 = invalid key, anything else might work
      if (res.status === 401 || res.status === 403) {
        errorMsg = "Chave inválida";
      } else {
        valid = true;
      }
    } else if (provider === "fal") {
      // Test fal.ai key with a lightweight call
      const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
        method: "POST",
        headers: {
          "Authorization": `Key ${api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: "test",
          image_size: { width: 64, height: 64 },
          num_inference_steps: 1,
          num_images: 1,
        }),
      });
      if (res.status === 401 || res.status === 403) {
        errorMsg = "Chave inválida";
      } else {
        valid = true;
      }
    } else {
      errorMsg = "Provider não suportado";
    }

    return new Response(JSON.stringify({ valid, error: errorMsg || undefined }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("verify-api-key error:", err);
    return new Response(JSON.stringify({ valid: false, error: "Erro interno ao verificar chave" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
