import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/pede-direto-logo.png";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useFooterPages } from "@/hooks/useNavigationPages";
import { supabase } from "@/integrations/supabase/client";

const socialIcons: Record<string, JSX.Element> = {
  facebook: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  ),
  instagram: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  twitter: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
    </svg>
  ),
  linkedin: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
  youtube: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" />
    </svg>
  ),
};

const Footer = () => {
  const { data: settings } = useSiteSettings();
  const { data: pages = [] } = useFooterPages();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const whatsappNumber = settings?.contacto_whatsapp?.replace(/\D/g, "");

  const socials = ["facebook", "instagram", "twitter", "linkedin", "youtube"]
    .map((key) => ({ key, url: settings?.[`footer_${key}`] }))
    .filter((s) => s.url);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@") || subscribing) return;
    setSubscribing(true);
    const { error } = await (supabase as any)
      .from("newsletter_subscribers")
      .upsert({ email: email.trim().toLowerCase(), source: "footer" }, { onConflict: "email" });
    setSubscribing(false);
    if (!error) {
      setSubmitted(true);
    }
  };

  return (
    <footer className="bg-card text-foreground py-12 border-t border-border/50">
      <div className="container">
        {/* Newsletter */}
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-6 md:p-8 mb-10">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-lg font-bold mb-2">📬 Newsletter PedeDireto</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Novidades, dicas e os melhores negócios da sua zona — directo no seu email.
            </p>
            {!submitted ? (
              <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="O seu email"
                  required
                  className="flex-1 h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button type="submit" size="sm" disabled={subscribing} className="gap-1.5">
                  <Send className="w-4 h-4" />
                  Subscrever
                </Button>
              </form>
            ) : (
              <p className="text-sm font-medium text-primary">
                ✓ Subscrito com sucesso! Obrigado.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Marca */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <img src={logo} alt="Pede Direto" className="h-8" />
            </Link>

            <p className="text-foreground/70 max-w-md">
              {settings?.footer_text ||
                "Encontre rapidamente o contacto que resolve o seu problema. Restaurantes, serviços, lojas e profissionais — tudo num só sítio."}
            </p>

            {socials.length > 0 && (
              <div className="flex gap-4 mt-6">
                {socials.map((s) => (
                  <a
                    key={s.key}
                    href={s.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Link para ${s.key}`}
                    className="text-foreground/70 hover:text-primary hover:scale-110 transition-all"
                  >
                    {socialIcons[s.key]}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Navegação */}
          <div>
            <h4 className="font-semibold mb-4">Navegação</h4>
            <ul className="space-y-2 text-foreground/70">
              <li><Link to="/" className="hover:text-primary transition-colors">Início</Link></li>
              <li><Link to="/#categorias" className="hover:text-primary transition-colors">Categorias</Link></li>
              <li><Link to="/blog" className="hover:text-primary transition-colors">Guias & Dicas</Link></li>
              {pages.map((page) => (
                <li key={page.id}>
                  <Link to={`/pagina/${page.slug}`} className="hover:text-primary transition-colors">{page.title}</Link>
                </li>
              ))}
              <li><Link to="/admin/login" className="hover:text-primary transition-colors">Área Admin</Link></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3 text-foreground/70">
              {(settings?.contacto_email || settings?.footer_email) && (
                <li>
                  <a href={`mailto:${settings?.contacto_email || settings?.footer_email}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                    <Mail className="h-4 w-4" />
                    {settings?.contacto_email || settings?.footer_email}
                  </a>
                </li>
              )}
              {whatsappNumber && (
                <li>
                  <a href={`https://api.whatsapp.com/send?phone=${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </li>
              )}
              {settings?.footer_phone && <li>{settings.footer_phone}</li>}
              <li>Portugal</li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border/50 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-foreground/50">
          <p>© {new Date().getFullYear()} Pede Direto. Todos os direitos reservados.</p>
          <p>
            {settings?.footer_link ? (
              <a href={settings.footer_link} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                {settings?.footer_credits || "Desenvolvido por Pede Direto"}
              </a>
            ) : (
              settings?.footer_credits || "https://pededireto.pt/"
            )}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
