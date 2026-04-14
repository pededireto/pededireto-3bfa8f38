import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "@/assets/pede-direto-logo.png";
import { Search, Building2, ArrowLeft, Loader2, MapPin, Plus, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useClaimSearch, useClaimBusiness } from "@/hooks/useClaimSearch";
import { useCategories } from "@/hooks/useCategories";
import { useBusinessMembership } from "@/hooks/useBusinessMembership";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BUSINESS_DASHBOARD_URL = "https://pededireto.pt/business-dashboard";

const ClaimBusiness = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: membership, isLoading: membershipLoading } = useBusinessMembership();

  useEffect(() => {
    if (!membershipLoading && user && membership?.business_id) {
      window.location.href = BUSINESS_DASHBOARD_URL;
    }
  }, [user, membership, membershipLoading]);

  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<{ id: string; name: string; legal_fields_count: number } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Campos de signup inline (para utilizador não autenticado)
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);

  const { results, isLoading: isSearching } = useClaimSearch(searchQuery);
  const { claim, isLoading: isClaiming } = useClaimBusiness();
  const { data: categories = [] } = useCategories();

  // Auto-claim após confirmação de email + login
  useEffect(() => {
    const savedBusinessId = localStorage.getItem("claimedBusinessId");
    if (!savedBusinessId || !user || membershipLoading) return;
    if (membership?.business_id) {
      localStorage.removeItem("claimedBusinessId");
      window.location.href = BUSINESS_DASHBOARD_URL;
      return;
    }
    (async () => {
      localStorage.removeItem("claimedBusinessId");
      const { error } = await claim(savedBusinessId);
      if (!error) {
        toast({ title: "Negócio reclamado!", description: "O seu pedido está em validação." });
        window.location.href = BUSINESS_DASHBOARD_URL;
      }
    })();
  }, [user, membershipLoading]);

  const createAffiliateClaimAlert = async (businessId: string, businessName: string) => {
    const refCode = localStorage.getItem("affiliate_ref");
    if (!refCode) return;
    try {
      await (supabase as any).from("admin_alerts").insert({
        type: "affiliate_claim_review",
        title: `Claim via afiliado ${refCode}`,
        message: `O negócio "${businessName}" foi reclamado por um visitante que chegou via link de afiliado (${refCode}). Revise se esta conversão deve ser atribuída ao afiliado.`,
        severity: "important",
        category: "affiliates",
        entity_type: "business",
        entity_id: businessId,
      });
    } catch (e) {
      console.error("Failed to create affiliate claim alert:", e);
    }
    localStorage.removeItem("affiliate_ref");
  };

  const handleClaim = async () => {
    if (!selectedBusiness || !user) return;
    const { error } = await claim(selectedBusiness.id);
    if (error) {
      const msg = error.message?.includes("already claimed")
        ? "Este negócio já foi reclamado ou está pendente de validação."
        : "Erro ao reclamar negócio. Tenta novamente.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } else {
      await createAffiliateClaimAlert(selectedBusiness.id, selectedBusiness.name);
      toast({
        title: "Pedido enviado!",
        description: "O seu pedido está em validação. Receberá uma notificação em breve.",
      });
      window.location.href = BUSINESS_DASHBOARD_URL;
    }
  };

  const handleSignupAndClaim = async () => {
    if (!selectedBusiness) return;
    if (!signupName || !signupPhone || !signupEmail || !signupPassword) {
      toast({ title: "Campos obrigatórios", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }
    if (signupPassword.length < 6) {
      toast({
        title: "Password fraca",
        description: "A password deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsSigningUp(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: { full_name: signupName, phone: signupPhone },
          emailRedirectTo: window.location.origin,
        },
      });

      if (signUpError) throw signUpError;

      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        toast({
          title: "Verifique o seu email",
          description: "Enviámos um email de confirmação. Após confirmar, entre na sua conta para concluir o claim.",
        });
        localStorage.setItem("claimedBusinessId", selectedBusiness.id);
        localStorage.setItem("postLoginRedirect", "/claim-business");
        setIsSigningUp(false);
        return;
      }

      const { error: claimError } = await claim(selectedBusiness.id);
      if (claimError) throw claimError;

      await createAffiliateClaimAlert(selectedBusiness.id, selectedBusiness.name);
      toast({ title: "Conta criada e negócio reclamado!", description: "O seu pedido está em validação." });
      window.location.href = BUSINESS_DASHBOARD_URL;
    } catch (err: any) {
      const errMsg = err?.message || "";
      const code = err?.code || "";
      
      if (code === "23505" || errMsg.includes("already exists") || errMsg.includes("already registered")) {
        toast({
          title: "Conta já existente",
          description: "Já existe um perfil com este email. Aceda com as suas credenciais ou recupere a password.",
          variant: "destructive",
        });
      } else {
        const detail = err?.details || err?.hint || errMsg || "Não foi possível criar a conta.";
        const codeStr = code ? ` (${code})` : "";
        toast({ title: "Erro ao criar conta", description: `${detail}${codeStr}`, variant: "destructive" });
      }
      console.error("[ClaimBusiness] signup error:", err);
    } finally {
      setIsSigningUp(false);
    }
  };

  // FIX: redireciona para /register/business (wizard completo) em vez de tentar criar directamente
  const handleCreateOrRedirect = () => {
    navigate("/register/business", {
      state: {
        prefill: {
          name: newName,
          city: newCity,
          categoryId: newCategoryId,
        },
      },
    });
    if (newName || newCity || newCategoryId) {
      localStorage.setItem(
        "registerBusinessPrefill",
        JSON.stringify({ name: newName, city: newCity, categoryId: newCategoryId }),
      );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-card rounded-2xl shadow-card p-8">
          <div className="text-center mb-6">
            <Link to="/" className="inline-block mb-4">
              <img src={logo} alt="Pede Direto" className="h-10" />
            </Link>
            <h2 className="text-xl font-semibold text-foreground">O teu negócio merece estar aqui</h2>
            <p className="text-muted-foreground mt-1">
              Já temos milhares de negócios listados. Verifica se o teu já está — e reclama-o gratuitamente!
            </p>
          </div>

          {!showCreateForm ? (
            <div className="space-y-4">
              {/* Search */}
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
                      onClick={() => setSelectedBusiness({ id: r.id, name: r.name, legal_fields_count: r.legal_fields_count })}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">{r.name}</p>
                          {r.is_active ? (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 border border-green-200 shrink-0">Ativo</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border shrink-0">Inativo</span>
                          )}
                        </div>
                        {r.city && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {r.city}
                            {r.legal_fields_count < 3 && (
                              <span className="ml-2 text-destructive">· {r.legal_fields_count}/5 dados legais</span>
                            )}
                          </p>
                        )}
                        {!r.city && r.legal_fields_count < 3 && (
                          <p className="text-xs text-destructive">{r.legal_fields_count}/5 dados legais</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedBusiness && (
                <div className="border-2 border-primary rounded-xl p-4 bg-primary/5 space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <p className="font-semibold text-foreground">{selectedBusiness.name}</p>
                  </div>

                  {selectedBusiness.legal_fields_count < 3 ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1">
                      <p className="text-sm font-medium text-destructive flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Não é possível reclamar este negócio
                      </p>
                      <p className="text-xs text-muted-foreground">
                        São necessários pelo menos 3 de 5 dados legais preenchidos (NIF, Morada, Responsável, Telefone, Email). 
                        Atualmente tem {selectedBusiness.legal_fields_count}/5. Contacte o suporte para completar os dados.
                      </p>
                    </div>
                  ) : (
                    <>
                      {user ? (
                        <Button onClick={handleClaim} disabled={isClaiming} className="w-full btn-cta-primary">
                          {isClaiming ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />A reclamar...
                            </>
                          ) : (
                            "Reclamar este negócio"
                          )}
                        </Button>
                      ) : (
                    <div className="space-y-3 pt-2 border-t border-border">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5" />
                        Crie a sua conta para reclamar este negócio
                      </p>
                      <div className="space-y-2">
                        <Label>Nome do Responsável *</Label>
                        <Input
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          placeholder="Nome completo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone *</Label>
                        <Input
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value)}
                          placeholder="912345678"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email (será o seu acesso) *</Label>
                        <Input
                          type="email"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          placeholder="email@exemplo.pt"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Password *</Label>
                        <Input
                          type="password"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                        />
                      </div>
                      <Button onClick={handleSignupAndClaim} disabled={isSigningUp} className="w-full btn-cta-primary">
                        {isSigningUp ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />A criar conta...
                          </>
                        ) : (
                          "Criar Conta e Reclamar"
                        )}
                      </Button>
                    </div>
                  )}
                    </>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  <Plus className="h-4 w-4" />+ O meu negócio não está aqui — quero adicionar
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
                <Input value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="Ex: Lisboa" />
              </div>

              <Button
                onClick={handleCreateOrRedirect}
                disabled={!newName || !newCategoryId || !newCity}
                className="w-full btn-cta-primary"
              >
                {user ? "Continuar para Registo Completo" : "Continuar para Registo Completo"}
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
