import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(200, "Máximo 200 caracteres"),
  nif: z.string().trim().min(9, "NIF deve ter 9 dígitos").max(9, "NIF deve ter 9 dígitos").regex(/^\d{9}$/, "NIF deve conter apenas 9 dígitos"),
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
});

type FormValues = z.infer<typeof formSchema>;

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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
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
    },
  });

  const selectedCategoryId = form.watch("category_id");
  const { data: categories = [] } = useCategories();
  const { data: subcategories = [] } = useSubcategories(selectedCategoryId || undefined);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const slug = generateSlug(values.name);
      const { error } = await supabase.from("businesses").insert({
        name: values.name,
        slug,
        nif: values.nif,
        address: values.address,
        cta_email: values.cta_email,
        cta_phone: values.cta_phone,
        owner_name: values.owner_name,
        owner_phone: values.owner_phone,
        owner_email: values.owner_email,
        category_id: values.category_id,
        subcategory_id: values.subcategory_id,
        cta_whatsapp: values.cta_whatsapp || null,
        cta_website: values.cta_website || null,
        is_active: false,
        commercial_status: "nao_contactado" as const,
        subscription_status: "inactive" as const,
        subscription_plan: "free" as const,
        registration_source: "self_service",
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast({
        title: "Erro ao registar",
        description: err.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full text-center space-y-6">
            <CheckCircle className="mx-auto h-16 w-16 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Obrigado pelo seu registo!</h1>
            <p className="text-muted-foreground">
              O seu negócio foi registado com sucesso. A nossa equipa comercial irá analisar os dados
              e contactá-lo brevemente para concluir a ativação.
            </p>
            <Button onClick={() => (window.location.href = "/")} variant="outline">
              Voltar à página inicial
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <Building2 className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Registe o seu negócio na PEDE DIRETO
            </h1>
            <p className="text-muted-foreground">
              Preencha os dados abaixo. Após validação, a nossa equipa entrará em contacto.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Business info */}
              <div className="space-y-4 rounded-lg border border-border p-4">
                <h2 className="font-semibold text-foreground">Dados do Negócio</h2>

                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Negócio *</FormLabel>
                    <FormControl><Input placeholder="Ex: Restaurante Boa Mesa" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="nif" render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIF *</FormLabel>
                      <FormControl><Input placeholder="123456789" maxLength={9} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="cta_phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone do Negócio *</FormLabel>
                      <FormControl><Input placeholder="+351 912 345 678" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Morada *</FormLabel>
                    <FormControl><Input placeholder="Rua, número, localidade" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="cta_email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email do Negócio *</FormLabel>
                      <FormControl><Input type="email" placeholder="geral@empresa.pt" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="cta_whatsapp" render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp</FormLabel>
                      <FormControl><Input placeholder="+351 912 345 678" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="cta_website" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl><Input placeholder="https://www.exemplo.pt" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="category_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria *</FormLabel>
                      <Select onValueChange={(v) => { field.onChange(v); form.setValue("subcategory_id", ""); }} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="subcategory_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategoria *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategoryId}>
                        <FormControl><SelectTrigger><SelectValue placeholder={selectedCategoryId ? "Selecione" : "Escolha a categoria primeiro"} /></SelectTrigger></FormControl>
                        <SelectContent>
                          {subcategories.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Owner info */}
              <div className="space-y-4 rounded-lg border border-border p-4">
                <h2 className="font-semibold text-foreground">Dados do Responsável</h2>

                <FormField control={form.control} name="owner_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Responsável *</FormLabel>
                    <FormControl><Input placeholder="Nome completo" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="owner_phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone do Responsável *</FormLabel>
                      <FormControl><Input placeholder="+351 912 345 678" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="owner_email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email do Responsável *</FormLabel>
                      <FormControl><Input type="email" placeholder="responsavel@email.pt" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "A registar..." : "Registar Negócio"}
              </Button>
            </form>
          </Form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RegisterBusiness;
