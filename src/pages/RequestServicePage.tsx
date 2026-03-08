import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useAllCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader2, AlertTriangle } from "lucide-react";

const BASE_URL = "https://pededireto.pt";

const RequestServicePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: categories = [] } = useAllCategories();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile-check", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const profileIncomplete = profile && (!profile.full_name?.trim() || !profile.phone?.trim());

  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [submitting, setSubmitting] = useState(false);

  const { data: subcategories = [] } = useSubcategories(categoryId || undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Precisa de iniciar sessão", variant: "destructive" });
      navigate("/login");
      return;
    }
    if (!categoryId || !description.trim()) {
      toast({ title: "Preencha a categoria e descrição", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // P8: Anti-spam — max 3 requests per category in 24h
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("service_requests" as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("category_id", categoryId)
        .gte("created_at", since);

      if (count && count >= 3) {
        toast({
          title: "Limite de pedidos atingido",
          description: "Já tem pedidos recentes nesta categoria. Consulte os seus pedidos activos antes de criar um novo.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      // Create service request
      const { data: request, error } = await supabase
        .from("service_requests" as any)
        .insert({
          user_id: user.id,
          category_id: categoryId,
          subcategory_id: subcategoryId || null,
          description: description.trim(),
          location_city: city.trim() || null,
          location_postal_code: postalCode.trim() || null,
          urgency,
        } as any)
        .select("id")
        .single();

      if (error) throw error;

      // Auto-match
      const reqData = request as any;
      if (reqData?.id) {
        await supabase.rpc("match_request_to_businesses", { p_request_id: reqData.id });

        // P1: Invoke notify-business edge function for each match (email + WhatsApp)
        const { data: matches } = await supabase
          .from("request_business_matches" as any)
          .select("business_id")
          .eq("request_id", reqData.id);

        if (matches && (matches as any[]).length > 0) {
          for (const match of matches as any[]) {
            supabase.functions
              .invoke("notify-business", {
                body: { type: "novo_match", business_id: match.business_id, request_id: reqData.id },
              })
              .catch((err) => console.error("notify-business error:", err));
          }
        }

        toast({ title: "Pedido enviado com sucesso!", description: "Irá receber respostas dos profissionais." });
        // P7: Redirect to request detail page instead of generic dashboard
        navigate(`/pedido/${reqData.id}`);
      } else {
        toast({ title: "Pedido enviado com sucesso!", description: "Irá receber respostas dos profissionais." });
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast({ title: "Erro ao enviar pedido", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Pedir Serviço | Pede Direto</title>
        <meta
          name="description"
          content="Descreva o que precisa e receba respostas dos melhores profissionais perto de si. Rápido, direto e sem intermediários."
        />
        <link rel="canonical" href={`${BASE_URL}/pedir-servico`} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Pedir Serviço</h1>
        <p className="text-muted-foreground mb-6">
          Descreva o que precisa e enviaremos o seu pedido aos melhores profissionais.
        </p>

        {profileLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : profileIncomplete ? (
          <Card className="border-amber-400 dark:border-amber-500">
            <CardContent className="py-8 text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
              <h2 className="text-lg font-bold text-foreground">Complete o seu perfil primeiro</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Para garantir que os profissionais consigam contactá-lo, precisa de preencher o seu{" "}
                <strong>nome</strong> e <strong>telefone</strong> no perfil.
              </p>
              <Button asChild>
                <Link to="/perfil">Completar Perfil</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl p-6 shadow-card">
            <div>
              <label className="block text-sm font-medium mb-1">Categoria *</label>
              <Select
                value={categoryId}
                onValueChange={(v) => {
                  setCategoryId(v);
                  setSubcategoryId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((c) => c.is_active)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {subcategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1">Subcategoria</label>
                <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Descrição do pedido *</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o que precisa..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cidade</label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex: Lisboa" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Código Postal</label>
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Ex: 1000-001" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Urgência</label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar Pedido
            </Button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default RequestServicePage;
