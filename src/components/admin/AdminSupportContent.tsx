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

const cleanPhone = (phone: string): string => phone.replace(/\D/g, "");

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
  if (!win) window.location.href = url;
};

// 🔥 SUGESTÕES VISÍVEIS
const messageTemplates: Record<string, string[]> = {
  support: [
    `Olá 👋 Fala a equipa da PedeDireto.\n\nEstamos a entrar em contacto relativamente ao teu negócio.\n\nEstá tudo a funcionar bem ou precisas de ajuda?`,
    `Olá 👋 Somos da PedeDireto.\n\nQueria só confirmar se está tudo a correr bem com o teu perfil na plataforma.`,
  ],
  activation: [
    `Olá 👋 Fala a equipa da PedeDireto.\n\nNotámos que o teu perfil pode ser otimizado para receber mais pedidos.\n\nQueres ajuda rápida?`,
    `Olá 👋 Da equipa PedeDireto.\n\nHá algumas melhorias simples que podem aumentar a tua visibilidade.\n\nQueres que te ajudemos?`,
  ],
  issue: [
    `Olá 👋 Fala a equipa da PedeDireto.\n\nDetetámos um possível problema no teu perfil.\n\nPodes confirmar se está tudo correto?`,
    `Olá 👋 Somos da PedeDireto.\n\nParece haver algo que pode não estar correto no teu perfil.\n\nPodemos ajudar a verificar?`,
  ],
};

const AdminSupportContent = () => {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Business[]>([]);
  const [searched, setSearched] = useState(false);

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
    } catch {
      toast({ title: "Erro ao pesquisar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWhatsApp = (biz: Business) => {
    const phone = getWhatsAppNumber(biz);

    if (!phone) {
      toast({
        title: "Sem número",
        variant: "destructive",
      });
      return;
    }

    const message =
      customMessage ||
      `Olá 👋 Fala a equipa da PedeDireto.\n\nEstamos a entrar em contacto relativamente ao teu negócio "${biz.name}".`;

    openWhatsApp(phone, message);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Suporte & Mensagens</h1>
        <p className="text-sm text-muted-foreground mt-1">Contacta negócios via WhatsApp</p>
      </div>

      {/* Pesquisa */}
      <div className="flex gap-2">
        <Input
          placeholder="Nome do negócio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading || !search.trim()}>
          {loading ? <Loader2 className="animate-spin" /> : <Search />}
        </Button>
      </div>

      {/* 🔥 Tipo */}
      <div>
        <label className="text-sm font-medium">Tipo de mensagem</label>
        <select
          value={messageType}
          onChange={(e) => {
            setMessageType(e.target.value);
            setCustomMessage(""); // reset ao mudar tipo
          }}
          className="w-full border rounded p-2 text-sm mt-1"
        >
          <option value="support">Suporte</option>
          <option value="activation">Ativação</option>
          <option value="issue">Problema</option>
        </select>
      </div>

      {/* 🔥 SUGESTÕES */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Sugestões</p>

        {messageTemplates[messageType].map((msg, i) => (
          <div
            key={i}
            onClick={() => setCustomMessage(msg)}
            className="cursor-pointer border rounded p-2 text-sm hover:bg-muted"
          >
            {msg}
          </div>
        ))}
      </div>

      {/* ✍️ Editor */}
      <textarea
        placeholder="Mensagem final..."
        value={customMessage}
        onChange={(e) => setCustomMessage(e.target.value)}
        className="w-full border rounded p-2 text-sm min-h-[120px]"
      />

      {/* Resultados */}
      {results.map((biz) => {
        const phone = getWhatsAppNumber(biz);

        return (
          <div key={biz.id} className="flex justify-between border p-4 rounded">
            <div>
              <p className="font-semibold">{biz.name}</p>
              <p className="text-xs text-muted-foreground">{biz.city}</p>
            </div>

            <Button onClick={() => handleOpenWhatsApp(biz)} disabled={!phone}>
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          </div>
        );
      })}
    </div>
  );
};

export default AdminSupportContent;
