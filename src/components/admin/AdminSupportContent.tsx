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

const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const openWhatsApp = (phone: string, text: string) => {
  const encoded = encodeURIComponent(text);

  const url = isMobile()
    ? `https://wa.me/${phone}?text=${encoded}`
    : `https://web.whatsapp.com/send?phone=${phone}&text=${encoded}`;

  const win = window.open(url, "_blank");

  if (!win) {
    window.location.href = url;
  }
};

// 🔥 mensagens ADMIN corretas
const generateAdminMessage = (biz: Business, type: string) => {
  switch (type) {
    case "activation":
      return `Olá 👋 Fala a equipa da PedeDireto.

Notámos que o teu negócio "${biz.name}" ainda pode melhorar a visibilidade na plataforma.

Queres ajuda rápida para receberes mais pedidos?`;

    case "issue":
      return `Olá 👋 Fala a equipa da PedeDireto.

Detetámos um possível problema no teu perfil "${biz.name}".

Podes confirmar se está tudo correto ou precisas de ajuda?`;

    default:
      return `Olá 👋 Fala a equipa da PedeDireto.

Estamos a entrar em contacto relativamente ao teu negócio "${biz.name}".

Precisam de ajuda com algo ou está tudo a funcionar normalmente?`;
  }
};

const AdminSupportContent = () => {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Business[]>([]);
  const [searched, setSearched] = useState(false);

  // 🧠 novos estados UX
  const [messageType, setMessageType] = useState("support");
  const [customMessage, setCustomMessage] = useState("");

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

    const baseMessage = generateAdminMessage(biz, messageType);
    const finalMessage = customMessage || baseMessage;

    openWhatsApp(phone, finalMessage);
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

      {/* 🔥 NOVA UX VISÍVEL */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Tipo de mensagem</label>
        <select
          value={messageType}
          onChange={(e) => setMessageType(e.target.value)}
          className="border rounded p-2 text-sm w-full"
        >
          <option value="support">Suporte</option>
          <option value="activation">Ativação</option>
          <option value="issue">Problema</option>
        </select>

        <textarea
          placeholder="Mensagem personalizada (opcional)"
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          className="w-full border rounded p-2 text-sm min-h-[100px]"
        />
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
              <div key={biz.id} className="flex items-center justify-between p-4 rounded-xl border bg-card">
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
