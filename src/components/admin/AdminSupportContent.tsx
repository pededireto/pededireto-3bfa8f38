import { useEffect, useState } from "react";
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
  city: string | null;
  subcategory_id: string;
}

interface Subcategory {
  id: string;
  name: string;
}

const ADMIN_MESSAGES = [
  "Olá! 👋 Somos da equipa PedeDireto. Estamos a validar os dados do teu negócio na plataforma.",
  "Olá! 👋 Notámos o teu negócio na PedeDireto e queremos ajudar-te a receber mais pedidos.",
  "Olá! 👋 Estamos a otimizar a presença do teu negócio na PedeDireto. Tens 2 minutos para falar?",
];

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

  const [selectedMessage, setSelectedMessage] = useState(ADMIN_MESSAGES[0]);
  const [customMessage, setCustomMessage] = useState(ADMIN_MESSAGES[0]);

  // 🔥 carregar subcategorias reais
  useEffect(() => {
    const loadSubs = async () => {
      const { data } = await supabase.from("subcategories").select("id, name").order("name");

      setSubcategories((data || []) as Subcategory[]);
    };

    loadSubs();
  }, []);

  const handleSearch = async () => {
    setLoading(true);

    try {
      let query = supabase
        .from("businesses")
        .select("id, name, owner_name, owner_phone, cta_whatsapp, city, subcategory_id")
        .limit(20);

      if (search.trim()) {
        query = query.ilike("name", `%${search}%`);
      }

      if (selectedSub) {
        query = query.eq("subcategory_id", selectedSub);
      }

      const { data, error } = await query;

      if (error) throw error;

      setResults((data || []) as Business[]);
    } catch (err) {
      toast({ title: "Erro ao pesquisar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (biz: Business) => {
    const phone = getWhatsAppNumber(biz);

    if (!phone) {
      toast({
        title: "Sem número",
        variant: "destructive",
      });
      return;
    }

    openWhatsApp(phone, customMessage);
  };

  const handleContactAll = () => {
    results.forEach((biz, i) => {
      const phone = getWhatsAppNumber(biz);
      if (!phone) return;

      setTimeout(() => {
        openWhatsApp(phone, customMessage);
      }, i * 1200); // delay anti-spam
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Suporte & Mensagens</h1>

      {/* 🔥 FILTROS */}
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Nome do negócio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />

        <select
          value={selectedSub}
          onChange={(e) => setSelectedSub(e.target.value)}
          className="border rounded-md px-2 py-2"
        >
          <option value="">Todas subcategorias</option>
          {subcategories.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <Button onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Search />}
        </Button>
      </div>

      {/* 🔥 MENSAGENS ADMIN */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Mensagem</p>

        <select
          value={selectedMessage}
          onChange={(e) => {
            setSelectedMessage(e.target.value);
            setCustomMessage(e.target.value);
          }}
          className="w-full border rounded-md px-2 py-2"
        >
          {ADMIN_MESSAGES.map((msg, i) => (
            <option key={i} value={msg}>
              {msg}
            </option>
          ))}
        </select>

        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          className="w-full border rounded-md p-2 text-sm"
          rows={3}
        />
      </div>

      {/* 🔥 BOTÃO MASSIVO CONTROLADO */}
      {results.length > 1 && (
        <Button onClick={handleContactAll} variant="secondary">
          Contactar todos ({results.length})
        </Button>
      )}

      {/* 🔥 RESULTADOS */}
      <div className="space-y-2">
        {results.map((biz) => {
          const phone = getWhatsAppNumber(biz);

          return (
            <div key={biz.id} className="flex justify-between items-center border p-3 rounded-lg">
              <div>
                <p className="font-semibold">{biz.name}</p>
                <p className="text-xs text-muted-foreground">
                  {biz.owner_name} • {biz.city}
                </p>
              </div>

              <Button size="sm" onClick={() => handleOpen(biz)} disabled={!phone}>
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
