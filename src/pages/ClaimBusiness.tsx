import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Building2, ArrowLeft, Loader2, MapPin, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useClaimSearch, useClaimBusiness } from "@/hooks/useClaimSearch";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ClaimBusiness = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<{ id: string; name: string } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { results, isLoading: isSearching } = useClaimSearch(searchQuery);
  const { claim, isLoading: isClaiming } = useClaimBusiness();
  const { data: categories = [] } = useCategories();

  const handleClaim = async () => {
    if (!selectedBusiness || !user) return;

    const { error } = await claim(selectedBusiness.id);
    if (error) {
      const msg = error.message?.includes("already claimed")
        ? "Este negócio já foi reclamado ou está pendente de validação."
        : "Erro ao reclamar negócio. Tenta novamente.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } else {
      toast({ 
        title: "Pedido enviado!", 
        description: "O seu pedido está em validação. Receberá uma notificação em breve." 
      });
      navigate("/business-dashboard");
    }
  };

  const handleCreateNew = async () => {
    if (!newName || !newCategoryId || !newCity || !user) return;

    setIsCreating(true);

    try {
      const slug = newName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const { data: biz, error: bizError } = await supabase
        .from("businesses")
        .insert([{
          name: newName,
          slug: `${slug}-${Date.now()}`,
          city: newCity,
          category_id: newCategoryId,
          owner_email: user.email || "",
          is_active: false,
          claim_status: 'pending',
          claim_requested_by: user.id,
          claim_requested_at: new Date().toISOString(),
          commercial_status: "nao_contactado",
          registration_source: "claim_flow",
        }])
        .select("id")
        .single();

      if (bizError) throw bizError;

      const { error: buError } = await supabase.from("business_users").insert({
        business_id: biz.id,
        user_id: user.id,
        role: "pending_owner",
      });

      if (buError) throw buError;

      toast({ 
        title: "Pedido enviado!", 
        description: "O negócio foi criado e está pendente de validação." 
      });
      navigate("/business-dashboard");

    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Não foi possível criar o negócio.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClaimOrRedirect = async () => {
    if (!user) {
      localStorage.setItem("postLoginRedirect", "/claim-business");
      toast({ title: "Conta necessária", description: "Cria uma conta ou entra para reclamar o teu negócio." });
      navigate("/register/business");
      return;
    }
    await handleClaim();
  };

  const handleCreateOrRedirect = async () => {
    if (!user) {
      localStorage.setItem("postLoginRedirect", "/claim-business");
      toast({ title: "Conta necessária", description: "Cria uma conta ou entra para criar o teu negócio." });
      navigate("/register/business");
      return;
    }
    await handleCreateNew();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-card rounded-2xl shadow-card p-8">
          <div className="text-center mb-6">
            <Link to="/" className="inline-block mb-4">
              <h1 className="text-2xl font-bold text-primary">
                Pede Direto
              </h1>
            </Link>

            <h2 className="text-xl font-semibold text-foreground">
              Reclame o seu Negócio
            </h2>

            <p className="text-muted-foreground mt-1">
              O seu negócio pode já estar listado. Procure pelo nome abaixo.
            </p>
          </div>

          {!showCreateForm ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar pelo nome do negócio..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedBusiness(null);
                  }}
                  className="pl-10"
                />
              </div>

              {isSearching && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}

              {results.length > 0 && !selectedBusiness && (
                <div className="border border-border rounded-xl overflow-hidden divide-y divide-border max-h-64 overflow-y-auto">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() =>
                        setSelectedBusiness({ id: r.id, name: r.name })
                      }
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {r.name}
                        </p>
                        {r.city && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {r.city}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedBusiness && (
                <div className="border-2 border-primary rounded-xl p-4 bg-primary/5">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <p className="font-semibold text-foreground">
                      {selectedBusiness.name}
                    </p>
                  </div>

                  <Button
                    onClick={handleClaimOrRedirect}
                    disabled={isClaiming}
                    className="w-full btn-cta-primary"
                  >
                    {isClaiming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        A reclamar...
                      </>
                    ) : (
                      "Reclamar este negócio"
                    )}
                  </Button>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  <Plus className="h-4 w-4" />
                  Não encontro o meu negócio — Criar novo
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Negócio *</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Restaurante O Manel"
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cidade *</Label>
                <Input
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="Ex: Lisboa"
                />
              </div>

              <Button
                onClick={handleCreateOrRedirect}
                disabled={isCreating || !newName || !newCategoryId || !newCity}
                className="w-full btn-cta-primary"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A criar...
                  </>
                ) : (
                  "Criar Negócio"
                )}
              </Button>

              <button
                onClick={() => setShowCreateForm(false)}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Voltar à pesquisa
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimBusiness;
