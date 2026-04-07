import { useEffect, useState } from "react";
import { MessageCircle, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Bypass: message_templates ainda não está nos tipos gerados do Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Business {
  id: string;
  name: string;
  owner_name: string | null;
  owner_phone: string | null;
  cta_whatsapp: string | null;
  city: string | null;
  subcategory_id: string;
  subcategories?: {
    name: string;
  };
}

interface Subcategory {
  id: string;
  name: string;
}

interface Template {
  id: string;
  name: string;
  message_type: string; // era "category", corrigido para o schema real
  subcategory: string | null;
  content: string;
}

const TYPE_LABELS: Record<string, string> = {
  onboarding: "Onboarding",
  ativacao: "Ativação",
  upsell: "Upsell",
  divulgacao: "Divulgação",
};

const cleanPhone = (phone: string): string => phone.replace(/\D/g, "");

const getWhatsAppNumber = (biz: Business): string | null => {
  const raw = biz.cta_whatsapp || biz.owner_phone;
  if (!raw) return null;
  const cleaned = cleanPhone(raw);
  if (cleaned.startsWith("351")) return cleaned;
  if (cleaned.startsWith("9") || cleaned.startsWith("2")) return `351${cleaned}`;
  return cleaned;
};

const openWhatsApp = (phone: string, text: string) => {
  const isMobile = /iPhone|Android/i.test(navigator.userAgent);
  const url = isMobile
    ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    : `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
};

const AdminSupportContent = () => {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);

  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSub, setSelectedSub] = useState("");

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  // Carregar subcategorias
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("subcategories").select("id, name").order("name");
      setSubcategories(data || []);
    };
    load();
  }, []);

  // Carregar templates — usa `db` para evitar erro TS2589
  useEffect(() => {
    const loadTemplates = async () => {
      const { data, error } = await db.from("message_templates").select("*").order("created_at", { ascending: false });

      if (error) {
        toast({ title: "Erro ao carregar templates", variant: "destructive" });
        return;
      }
      setTemplates(data || []);
    };
    loadTemplates();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("businesses")
        .select(
          `
          id,
          name,
          owner_name,
          owner_phone,
          cta_whatsapp,
          city,
          subcategory_id,
          subcategories ( name )
        `,
        )
        .limit(20);

      if (search) query = query.ilike("name", `%${search}%`);
      if (selectedSub) query = query.eq("subcategory_id", selectedSub);

      const { data, error } = await query;
      if (error) throw error;
      setResults(data || []);
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (id: string) => {
    setSelectedTemplate(id);
    const t = templates.find((t) => t.id === id);
    if (t) setCustomMessage(t.content);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Suporte & Mensagens</h1>

      {/* FILTROS */}
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Nome do negócio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <select
          value={selectedSub}
          onChange={(e) => setSelectedSub(e.target.value)}
          className="border rounded-md px-2 py-2 text-sm"
        >
          <option value="">Todas as subcategorias</option>
          {subcategories.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <Button onClick={handleSearch}>
          {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {/* TEMPLATES */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Tipo de mensagem</p>
        <select
          value={selectedTemplate}
          onChange={(e) => handleTemplateChange(e.target.value)}
          className="w-full border rounded-md px-2 py-2 text-sm"
        >
          <option value="">Selecionar template</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {TYPE_LABELS[t.message_type] ?? t.message_type} — {t.name}
              {t.subcategory ? ` (${t.subcategory})` : ""}
            </option>
          ))}
        </select>
        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          className="w-full border rounded-md p-2"
          rows={4}
          placeholder="Seleciona um template ou escreve uma mensagem..."
        />
      </div>

      {/* RESULTADOS */}
      <div className="space-y-2">
        {results.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground text-center py-6">Faz uma pesquisa para ver negócios.</p>
        )}
        {results.map((biz) => {
          const phone = getWhatsAppNumber(biz);
          return (
            <div key={biz.id} className="border p-3 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-semibold">{biz.name}</p>
                <p className="text-xs text-muted-foreground">
                  {biz.subcategories?.name} • {biz.city}
                </p>
                {!phone && <p className="text-xs text-red-400 mt-0.5">Sem número de telefone</p>}
              </div>
              <Button
                onClick={() => phone && openWhatsApp(phone, customMessage)}
                disabled={!phone || !customMessage}
                size="sm"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                WhatsApp
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminSupportContent;
