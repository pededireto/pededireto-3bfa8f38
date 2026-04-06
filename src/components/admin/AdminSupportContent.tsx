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
  category: string | null;
  subcategory: string | null;
}

// 🧠 estrutura (podes depois ligar à DB)
const categories = {
  Eventos: ["Fotografia & Vídeo", "Música & Animação", "Catering & Bebidas"],
  "Pet & Animais": ["Saúde & Bem-Estar Animal", "Dog Walking & Pet Sitting"],
  Lojas: ["Pastelarias & Doces Artesanais"],
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

const isMobile = () => /iPhone|Android/i.test(navigator.userAgent);

const openWhatsApp = (phone: string, text: string) => {
  const url = isMobile()
    ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    : `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;

  const win = window.open(url, "_blank");
  if (!win) window.location.href = url;
};

const messageTemplates = {
  support: [`Olá 👋 Fala a equipa da PedeDireto.\n\nEstá tudo a funcionar bem ou precisas de ajuda?`],
  activation: [`Olá 👋 Fala a equipa da PedeDireto.\n\nQueres ajuda para receber mais pedidos?`],
  issue: [`Olá 👋 Fala a equipa da PedeDireto.\n\nPodes confirmar se está tudo correto no teu perfil?`],
};

const AdminSupportContent = () => {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");

  const [messageType, setMessageType] = useState("support");
  const [customMessage, setCustomMessage] = useState("");

  const [results, setResults] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);

    try {
      let query = supabase.from("businesses").select("*").limit(20);

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      if (category) {
        query = query.eq("category", category);
      }

      if (subcategory) {
        query = query.eq("subcategory", subcategory);
      }

      const { data, error } = await query;

      if (error) throw error;

      setResults(data || []);
    } catch {
      toast({ title: "Erro na pesquisa", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWhatsApp = (biz: Business) => {
    const phone = getWhatsAppNumber(biz);

    if (!phone) {
      toast({ title: "Sem número", variant: "destructive" });
      return;
    }

    const message =
      customMessage ||
      `Olá 👋 Fala a equipa da PedeDireto.\n\nEstamos a entrar em contacto relativamente ao teu negócio "${biz.name}".`;

    openWhatsApp(phone, message);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Suporte & Mensagens</h1>

      {/* 🔥 FILTROS */}
      <div className="grid grid-cols-3 gap-2">
        <Input placeholder="Nome" value={search} onChange={(e) => setSearch(e.target.value)} />

        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setSubcategory("");
          }}
          className="border p-2 rounded"
        >
          <option value="">Categoria</option>
          {Object.keys(categories).map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={subcategory}
          onChange={(e) => setSubcategory(e.target.value)}
          className="border p-2 rounded"
          disabled={!category}
        >
          <option value="">Subcategoria</option>
          {category && categories[category].map((sub) => <option key={sub}>{sub}</option>)}
        </select>
      </div>

      <Button onClick={handleSearch} disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : "Pesquisar"}
      </Button>

      {/* mensagens */}
      <div>
        <p className="text-sm font-medium">Sugestões</p>
        {messageTemplates[messageType].map((msg, i) => (
          <div key={i} onClick={() => setCustomMessage(msg)} className="border p-2 rounded cursor-pointer">
            {msg}
          </div>
        ))}
      </div>

      <textarea
        value={customMessage}
        onChange={(e) => setCustomMessage(e.target.value)}
        className="w-full border p-2 rounded"
      />

      {/* resultados */}
      {results.map((biz) => {
        const phone = getWhatsAppNumber(biz);

        return (
          <div key={biz.id} className="flex justify-between border p-4 rounded">
            <div>
              <p>{biz.name}</p>
              <p className="text-xs">
                {biz.category} • {biz.subcategory}
              </p>
            </div>

            <Button onClick={() => handleOpenWhatsApp(biz)} disabled={!phone}>
              WhatsApp
            </Button>
          </div>
        );
      })}
    </div>
  );
};

export default AdminSupportContent;
