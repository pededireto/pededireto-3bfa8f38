import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/usePermissions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Save, Loader2, Camera, Bell } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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

  const { data: preferences } = useQuery({
    queryKey: ["notification-preferences", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consumer_notification_preferences" as any)
        .select("*")
        .eq("user_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as any) || {
        email_on_response: true,
        email_on_message: true,
        email_on_badge: false,
        email_weekly_summary: false,
      };
    },
    enabled: !!profile?.id,
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Imagem demasiado grande (máx 2MB)", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl + "?t=" + Date.now();

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl } as any)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast({ title: "Foto de perfil atualizada!" });
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      toast({ title: "Erro ao enviar foto", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const updatePreference = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      if (!profile?.id) return;
      const { error } = await supabase
        .from("consumer_notification_preferences" as any)
        .upsert({
          user_id: profile.id,
          [key]: value,
          updated_at: new Date().toISOString(),
        } as any, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
    onError: () => {
      toast({ title: "Erro ao guardar preferência", variant: "destructive" });
    },
  });

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

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
            {/* Avatar Upload */}
            <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Avatar className="h-20 w-20 border-2 border-border">
                  <AvatarImage src={(profile as any)?.avatar_url} alt={fullName} />
                  <AvatarFallback className="text-lg bg-primary/10 text-primary font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Foto de perfil</p>
                <p className="text-xs text-muted-foreground">Clique para alterar (máx 2MB)</p>
              </div>
            </div>

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

        {/* Notification Preferences */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Preferências de Notificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "email_on_response", label: "Email quando um profissional aceita o pedido", desc: "Receba email quando um negócio responde ao seu pedido de orçamento." },
              { key: "email_on_message", label: "Email quando recebe nova mensagem", desc: "Receba email quando um profissional lhe envia uma mensagem." },
              { key: "email_on_badge", label: "Email quando conquista um badge", desc: "Notificação quando desbloqueia uma nova conquista." },
              { key: "email_weekly_summary", label: "Resumo semanal de actividade", desc: "Receba um resumo semanal com a sua actividade na plataforma." },
              { key: "email_marketing", label: "Comunicações e campanhas", desc: "Receba emails sobre novidades, promoções e campanhas da plataforma." },
            ].map((pref) => (
              <div key={pref.key} className="flex items-start justify-between gap-4 py-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{pref.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{pref.desc}</p>
                </div>
                <Switch
                  checked={preferences?.[pref.key as keyof typeof preferences] ?? true}
                  onCheckedChange={(checked) =>
                    updatePreference.mutate({ key: pref.key, value: checked })
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
