import { useState, useEffect } from "react";
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
  const [claimedBusinessId, setClaimedBusinessId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

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

  // Preencher formulário com dados do negócio reclamado
  useEffect(() => {
    const storedBusinessId = localStorage.getItem('claimedBusinessId');
    if (storedBusinessId && user) {
      setClaimedBusinessId(storedBusinessId);
      supabase
        .from('businesses')
        .select('*')
        .eq('id', storedBusinessId)
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            form.reset({
              name: data.name || '',
              nif: data.nif || '',
              address: data.address || '',
              cta_email: data.cta_email || data.email || '',
              cta_phone: data.cta_phone || data.phone || '',
              owner_name: data.owner_name || '',
              owner_phone: data.owner_phone || '',
              owner_email: data.owner_email || user.email || '',
              category_id: data.category_id || '',
              subcategory_id: data.subcategory_id || '',
              cta_whatsapp: data.cta_whatsapp || data.whatsapp || '',
              cta_website: data.cta_website || data.website || '',
            });
          }
          localStorage.removeItem('claimedBusinessId');
        });
    }
  }, [user, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (claimedBusinessId && user) {
        // Atualizar negócio existente + criar claim
        const { error: updateError } = await supabase
          .from("businesses")
          .update({
            nif: values.nif,
            address: values.address,
            cta_email: values.cta_email,
            cta_phone: values.cta_phone,
            owner_name: values.owner_name,
            owner_phone: values.owner_phone,
            owner_email: values.owner_email,
            cta_whatsapp: values.cta_whatsapp || null,
            cta_website: values.cta_website || null,
            claim_status: 'pending',
            claim_requested_by:
