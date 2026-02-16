import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Mail, MapPin, Phone, Globe, CheckCircle, Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const businessSuggestionSchema = z.object({
  businessName: z.string().trim().min(2, "Nome do negócio é obrigatório").max(200),
  city: z.string().trim().min(2, "Cidade é obrigatória").max(100),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  website: z.string().trim().url("URL inválido (deve começar com http:// ou https://)").max(500).optional().or(z.literal("")),
  additionalInfo: z.string().trim().max(1000).optional().or(z.literal("")),
});

interface BusinessSuggestionFormProps {
  categoryName?: string;
  cityName?: string | null;
}

const BusinessSuggestionForm = ({ categoryName, cityName }: BusinessSuggestionFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    city: cityName || "",
    email: "",
    phone: "",
    website: "",
    additionalInfo: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const result = businessSuggestionSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Construir mensagem formatada para a tabela suggestions existente
      const message = `
🏢 **Sugestão de Negócio**
━━━━━━━━━━━━━━━━━━━━━━
📂 **Categoria:** ${categoryName || 'N/A'}
🏪 **Nome:** ${formData.businessName}
📍 **Cidade:** ${formData.city}
${formData.email ? `📧 **Email:** ${formData.email}` : ''}
${formData.phone ? `📞 **Telefone:** ${formData.phone}` : ''}
${formData.website ? `🌐 **Website:** ${formData.website}` : ''}
${formData.additionalInfo ? `\n📝 **Informação Adicional:**\n${formData.additionalInfo}` : ''}
      `.trim();

      // Inserir na tabela suggestions existente
      const { error } = await supabase
        .from("suggestions")
        .insert({
          city_name: formData.city,
          email: formData.email || null,
          message: message,
        });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Sugestão enviada com sucesso!",
        description: "Obrigado pela sua contribuição. Vamos analisar e adicionar o negócio em breve.",
      });
    } catch (error) {
      console.error("Erro ao enviar sugestão:", error);
      toast({
        title: "Erro ao enviar sugestão",
        description: "Por favor, tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-card rounded-2xl p-8 text-center border shadow-sm">
        <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-foreground mb-2">
          Sugestão Enviada!
        </h3>
        <p className="text-muted-foreground">
          Obrigado por nos ajudar a crescer o Pede Direto! Vamos adicionar{" "}
          <span className="font-semibold text-foreground">{formData.businessName}</span>
          {formData.city && (
            <> em <span className="font-semibold text-foreground">{formData.city}</span></>
          )} em breve.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 border shadow-sm">
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">Sugira um negócio</h3>
        <p className="text-muted-foreground">
          {cityName 
            ? `Conhece outro negócio de ${categoryName} em ${cityName} que deveria estar aqui?`
            : `Conhece outro negócio de ${categoryName} que deveria estar aqui?`
          }
          {" "}Ajude-nos a melhorar o Pede Direto!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome do Negócio */}
        <div className="space-y-2">
          <Label htmlFor="businessName">Nome do Negócio *</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="businessName"
              placeholder="Ex: Farmácia Central"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className={`pl-10 ${errors.businessName ? "border-destructive" : ""}`}
              disabled={isSubmitting}
            />
          </div>
          {errors.businessName && (
            <p className="text-sm text-destructive">{errors.businessName}</p>
          )}
        </div>

        {/* Cidade */}
        <div className="space-y-2">
          <Label htmlFor="city">Cidade *</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="city"
              placeholder="Ex: Lisboa"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className={`pl-10 ${errors.city ? "border-destructive" : ""}`}
              disabled={isSubmitting || !!cityName}
            />
          </div>
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city}</p>
          )}
        </div>

        {/* Email (opcional) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email do Negócio (opcional)</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Ex: contacto@farmaciacentral.pt"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
              disabled={isSubmitting}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        {/* Telefone (opcional) */}
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone do Negócio (opcional)</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="Ex: 912 345 678"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`pl-10 ${errors.phone ? "border-destructive" : ""}`}
              disabled={isSubmitting}
            />
          </div>
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone}</p>
          )}
        </div>

        {/* Website (opcional) */}
        <div className="space-y-2">
          <Label htmlFor="website">Website do Negócio (opcional)</Label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="website"
              type="url"
              placeholder="Ex: https://farmaciacentral.pt"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className={`pl-10 ${errors.website ? "border-destructive" : ""}`}
              disabled={isSubmitting}
            />
          </div>
          {errors.website && (
            <p className="text-sm text-destructive">{errors.website}</p>
          )}
        </div>

        {/* Informação Adicional */}
        <div className="space-y-2">
          <Label htmlFor="additionalInfo">Informação Adicional (opcional)</Label>
          <Textarea
            id="additionalInfo"
            placeholder="Ex: Morada completa, horário, especialidades..."
            value={formData.additionalInfo}
            onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
            rows={4}
            disabled={isSubmitting}
            className={errors.additionalInfo ? "border-destructive" : ""}
          />
          {errors.additionalInfo && (
            <p className="text-sm text-destructive">{errors.additionalInfo}</p>
          )}
        </div>

        {/* Botão Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              A enviar...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Enviar Sugestão
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          A sua sugestão será analisada pela nossa equipa e adicionada em breve.
        </p>
      </form>
    </div>
  );
};

export default BusinessSuggestionForm;
