import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Building2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const baseSchema = {
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(200, "Máximo 200 caracteres"),
  nif: z
    .string()
    .trim()
    .min(9, "NIF deve ter 9 dígitos")
    .max(9, "NIF deve ter 9 dígitos")
    .regex(/^\d{9}$/, "NIF deve conter apenas 9 dígitos"),
  address: z.string().trim().min(5, "Morada é obrigatória").max(300, "Máximo 300 caracteres"),
  cta_email: z.string().trim().email("Email inválido").max(255),
  cta_phone: z.string().trim().min(9, "Telefone inválido").max(20, "Telefone inválido"),
  owner_name: z.string().trim().min(2, "Nome obrigatório").max(200),
  owner_phone: z.string().trim().min(9, "Telefone inválido").max(20),
  owner_email: z.string().trim().email("Email inválido").max(255),
  category_id: z.string().uuid("Selecione uma categoria"),
  subcategory_id: z.string().uuid("Selecione uma subcategoria"),
  cta_whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
  cta_website: z.string().trim().url("URL inválido").max(500).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Cidade obrigatória").max(100),
  password: z.string().optional(),
};

const formSchemaAuth = z.object({
  ...baseSchema,
  password: z.string().min(6, "Password deve ter pelo menos 6 caracteres"),
});

const formSchemaNoAuth = z.object({
  ...baseSchema,
  password: z.string().optional(),
});

type FormValues = z.infer<typeof formSchemaAuth>;

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") +
  "-" +
  Date.now().toString(36);

const RegisterBusiness = () => {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const schema = user ? formSchemaNoAuth : formSchemaAuth;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      nif: "",
      address: "",
      cta_email: "",
      cta_phone: "",
      owner_name: "",
      owner_phone: "",
      owner_email: "",
      category_id: "",
      subcategory_id: "",
      cta_whatsapp: "",
      cta_website: "",
      city: "",
      password: "",
    },
  });

  // ── Pré-preencher campos vindos do ClaimBusiness (passo anterior) ─────────
  useEffect(() => {
    // Fonte 1: React Router state (navegação direta)
    const prefill = location.state?.prefill;

    // Fonte 2: localStorage (fallback para casos de redirect)
    const stored = localStorage.getItem("registerBusinessPrefill");
    const storedPrefill = stored ? JSON.parse(stored) : null;

    const data = prefill || storedPrefill;
    if (!data) return;

    if (data.name) form.setValue("name", data.name);
    if (data.city) form.setValue("city", data.city);
    if (data.categoryId) form.setValue("category_id", data.categoryId);

    // Limpar localStorage após usar
    localStorage.removeItem("registerBusinessPrefill");
  }, []);

  const selectedCategoryId = form.watch("category_id");
  const { data: categories = [] } = useCategories();
  const { data: subcategories = [] } = useSubcategories(selectedCategoryId || undefined);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      let currentUser = user;

      // Se não está autenticado, criar conta primeiro
      if (!currentUser) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: values.owner_email,
          password: values.password!,
          options: {
            data: {
              full_name: values.owner_name,
              phone: values.owner_phone,
            },
            emailRedirectTo: window.location.origin,
          },
        });

        if (signUpError) throw signUpError;

        currentUser = signUpData.user;

        if (!currentUser) {
          toast({
            title: "Verifique o seu email",
            description: "Enviámos um email de confirmação. Após confirmar, o seu negócio será validado pela equipa.",
          });
          setSubmitted(true);
          return;
        }
      }

      const slug = generateSlug(values.name);

      const { data: businessId, error: rpcError } = await supabase.rpc("register_business_with_owner" as any, {
        p_name: values.name,
        p_slug: slug,
        p_nif: values.nif,
        p_address: values.address,
        p_city: values.city,
        p_cta_email: values.cta_email,
        p_cta_phone: values.cta_phone,
        p_owner_name: values.owner_name,
        p_owner_phone: values.owner_phone,
        p_owner_email: values.owner_email,
        p_category_id: values.category_id,
        p_subcategory_id: values.subcategory_id,
        p_cta_whatsapp: values.cta_whatsapp || null,
        p_cta_website: values.cta_website || null,
        p_registration_source: "register_form",
      });

      if (rpcError) throw rpcError;

      toast({
        title: "Negócio registado!",
        description: "O seu negócio foi submetido e está pendente de validação.",
      });
      setSubmitted(true);
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Não foi possível registar o negócio.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-primary mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Negócio Registado!</h1>
          <p className="text-muted-foreground mb-6">
            {!user
              ? "Enviámos um email de confirmação. Após confirmar, o seu negócio será validado pela equipa."
              : "O seu negócio foi submetido e está pendente de validação pela nossa equipa."}
          </p>
          <Button onClick={() => navigate("/")} variant="outline">
            Voltar ao início
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <Building2 className="mx-auto h-12 w-12 text-primary mb-3" />
          <h1 className="text-2xl font-bold text-foreground">Registar Novo Negócio</h1>
          <p className="text-muted-foreground mt-1">Preencha os dados do seu negócio para o adicionar à Pede Direto.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Dados do Negócio */}
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h2 className="font-semibold text-foreground">Dados do Negócio</h2>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Negócio *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Restaurante O Manel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nif"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIF *</FormLabel>
                    <FormControl>
                      <Input placeholder="123456789" maxLength={9} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Morada *</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade *</FormLabel>
                      <FormControl>
                        <Input placeholder="Lisboa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subcategory_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategoria *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategoryId}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subcategories.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cta_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email do Negócio *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@negocio.pt" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cta_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone do Negócio *</FormLabel>
                      <FormControl>
                        <Input placeholder="912345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cta_whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="912345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cta_website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Dados do Responsável */}
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h2 className="font-semibold text-foreground">Dados do Responsável</h2>

              <FormField
                control={form.control}
                name="owner_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="owner_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone *</FormLabel>
                      <FormControl>
                        <Input placeholder="912345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="owner_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email {!user ? "(será o seu email de acesso) *" : "*"}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@pessoal.pt" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!user && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password de acesso *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full btn-cta-primary">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />A registar...
                </>
              ) : (
                "Registar Negócio"
              )}
            </Button>
          </form>
        </Form>
      </main>
      <Footer />
    </div>
  );
};

export default RegisterBusiness;
