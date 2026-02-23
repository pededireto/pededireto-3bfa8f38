import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/usePermissions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  super_admin: "Super Admin",
  commercial: "Comercial",
  cs: "Customer Success",
  onboarding: "Onboarding",
  user: "Utilizador",
};

const ProfilePage = () => {
  const { user } = useAuth();
  const { data: roles = [] } = useUserRoles();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (profile && !initialized) {
    setFullName(profile.full_name || "");
    setPhone(profile.phone || "");
    setCity((profile as any).city || "");
    setAddress(profile.address || "");
    setInitialized(true);
  }

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone, city, address } as any)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast({ title: "Perfil atualizado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar perfil", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>O Meu Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <Input value={user?.email || ""} disabled className="mt-1" />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Nome completo</label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1" />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Telefone</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1" />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Cidade</label>
              <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Ex: Lisboa" className="mt-1" />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Morada</label>
              <Input value={address} onChange={e => setAddress(e.target.value)} className="mt-1" />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Roles</label>
              <div className="flex gap-2 flex-wrap">
                {roles.length > 0 ? roles.map(role => (
                  <Badge key={role} variant="secondary">
                    {ROLE_LABELS[role] || role}
                  </Badge>
                )) : (
                  <Badge variant="outline">Utilizador</Badge>
                )}
              </div>
            </div>

            <Button
              onClick={() => updateProfile.mutate()}
              disabled={updateProfile.isPending}
              className="w-full"
            >
              {updateProfile.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar alterações
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
