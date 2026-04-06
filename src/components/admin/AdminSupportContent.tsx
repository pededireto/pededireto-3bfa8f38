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
  // Adicionar 351 se não tiver indicativo
  if (cleaned.startsWith("351")) return cleaned;
  if (cleaned.startsWith("9") || cleaned.startsWith("2")) return `351${cleaned}`;
  return cleaned;
};

const AdminSupportContent = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Business[]>([]);
  const [searched, setSearched] = useState(false);

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
    } catch (err: any) {
      toast({ title: "Erro ao pesquisar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWhatsApp = (biz: Business, message?: string) => {
    const phone = getWhatsAppNumber(biz);
    if (!phone) {
      toast({
        title: "Sem número de WhatsApp",
        description: `${biz.name} não tem número de WhatsApp ou telefone registado.`,
        variant: "destructive",
      });
      return;
    }
    const text =
      message ||
      `Olá! 👋 Somos a equipa PedeDireto. Estamos a contactar-te relativamente ao teu negócio "${biz.name}". Podemos ajudar-te com alguma questão?`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Suporte & Mensagens</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pesquisa um negócio e abre uma conversa diretamente no WhatsApp
        </p>
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
              <div
                key={biz.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-card"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{biz.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {biz.city && <span className="text-xs text-muted-foreground">{biz.city}</span>}
                    {biz.owner_name && <span className="text-xs text-muted-foreground">{biz.owner_name}</span>}
                    {phone ? (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <Phone className="h-3 w-3" />+{phone}
                      </span>
                    ) : (
                      <span className="text-xs text-destructive">Sem telefone</span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  className="gap-2 shrink-0 ml-4"
                  onClick={() => handleOpenWhatsApp(biz)}
                  disabled={!phone}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Estado inicial */}
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
