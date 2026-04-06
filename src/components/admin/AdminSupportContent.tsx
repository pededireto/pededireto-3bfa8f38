import { useState } from "react";
import { MessageCircle, Search, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Business {
  id: string;
  name: string;
  owner_name: string | null;
  owner_phone: string | null;
  cta_whatsapp: string | null;
  owner_email: string | null;
  city: string | null;
}

const cleanPhone = (phone: string): string => {
  return phone.replace(/\D/g, "");
};

const getWhatsAppNumber = (biz: Business): string | null => {
  const raw = biz.cta_whatsapp || biz.owner_phone;
  if (!raw) return null;

  const cleaned = cleanPhone(raw);

  if (cleaned.startsWith("351")) return cleaned;
  if (cleaned.startsWith("9") || cleaned.startsWith("2")) return `351${cleaned}`;

  return cleaned;
};

// 📱 detectar mobile
const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// 🧠 mensagem mais natural (estilo cliente real)
const generateMessage = (biz: Business) => {
  return `Olá! 👋 Vi o teu negócio "${biz.name}" na PedeDireto e gostava de saber mais informações. Podes ajudar-me?`;
};

// 🔗 abrir WhatsApp com fallback
const openWhatsApp = (phone: string, text: string) => {
  const encoded = encodeURIComponent(text);

  const url = isMobile()
    ? `https://wa.me/${phone}?text=${encoded}`
    : `https://web.whatsapp.com/send?phone=${phone}&text=${encoded}`;

  // tentativa normal
  const win = window.open(url, "_blank");

  // fallback (caso bloqueie)
  if (!win) {
    window.location.href = url;
  }
};

const AdminSupportContent = () => {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Business[]>([]);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const handleSearch = async () => {
    if (!search.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, owner_name, owner_phone, cta_whatsapp, owner_email, city")
        .ilike("name", `%${search.trim()}%`)
        .limit(10);

      if (error) throw error;

      setResults((data || []) as Business[]);
    } catch (err) {
      toast({ title: "Erro ao pesquisar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // 📊 tracking simples (preparado para DB depois)
  const trackClick = (biz: Business) => {
    console.log("WhatsApp Click:", {
      business_id: biz.id,
      business_name: biz.name,
      timestamp: new Date().toISOString(),
    });
  };

  const handleOpenWhatsApp = (biz: Business) => {
    const phone = getWhatsAppNumber(biz);

    if (!phone) {
      toast({
        title: "Sem número de WhatsApp",
        description: `${biz.name} não tem contacto disponível.`,
        variant: "destructive",
      });
      return;
    }

    const message = generateMessage(biz);

    trackClick(biz);

    openWhatsApp(phone, message);
  };

  // 🔥 contactar vários negócios
  const handleBulkWhatsApp = () => {
    const selectedBiz = results.filter((b) => selected.includes(b.id));

    if (selectedBiz.length === 0) {
      toast({
        title: "Nenhum selecionado",
        description: "Seleciona pelo menos um negócio",
        variant: "destructive",
      });
      return;
    }

    selectedBiz.forEach((biz, index) => {
      const phone = getWhatsAppNumber(biz);
      if (!phone) return;

      const message = generateMessage(biz);

      setTimeout(() => {
        trackClick(biz);
        openWhatsApp(phone, message);
      }, index * 800); // delay para não bloquear
    });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Suporte & Mensagens</h1>
        <p className="text-sm text-muted-foreground mt-1">Contacta negócios diretamente via WhatsApp</p>
      </div>

      {/* Pesquisa */}
      <div className="flex gap-2">
        <Input
          placeholder="Nome do negócio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={loading || !search.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {/* Bulk action */}
      {selected.length > 0 && <Button onClick={handleBulkWhatsApp}>🚀 Contactar {selected.length} negócios</Button>}

      {/* Resultados */}
      {searched && !loading && results.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum negócio encontrado para "{search}"</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((biz) => {
            const phone = getWhatsAppNumber(biz);

            return (
              <div key={biz.id} className="flex items-center justify-between p-4 rounded-xl border bg-card">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={selected.includes(biz.id)} onChange={() => toggleSelect(biz.id)} />

                  <div>
                    <p className="font-semibold text-sm">{biz.name}</p>

                    <div className="flex gap-2 text-xs text-muted-foreground">
                      {biz.city && <span>{biz.city}</span>}
                      {biz.owner_name && <span>{biz.owner_name}</span>}
                    </div>

                    {phone ? (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <Phone className="h-3 w-3" />+{phone}
                      </span>
                    ) : (
                      <span className="text-xs text-destructive">Sem telefone</span>
                    )}
                  </div>
                </div>

                <Button size="sm" onClick={() => handleOpenWhatsApp(biz)} disabled={!phone} className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {!searched && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Pesquisa um negócio para iniciar contacto</p>
        </div>
      )}
    </div>
  );
};

export default AdminSupportContent;
