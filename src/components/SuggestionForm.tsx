 import { useState } from "react";
 import { z } from "zod";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { useToast } from "@/hooks/use-toast";
 import { useCreateSuggestion } from "@/hooks/useSuggestions";
 import { Loader2, Send, CheckCircle } from "lucide-react";
 
 const suggestionSchema = z.object({
   city_name: z.string().trim().min(2, "Nome da cidade é obrigatório").max(100),
   email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
   message: z.string().trim().max(500).optional(),
 });
 
 interface SuggestionFormProps {
   searchTerm?: string;
 }
 
 const SuggestionForm = ({ searchTerm = "" }: SuggestionFormProps) => {
   const { toast } = useToast();
   const createSuggestion = useCreateSuggestion();
 
   const [cityName, setCityName] = useState(searchTerm);
   const [email, setEmail] = useState("");
   const [message, setMessage] = useState("");
   const [errors, setErrors] = useState<{ city_name?: string; email?: string; message?: string }>({});
   const [submitted, setSubmitted] = useState(false);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setErrors({});
 
     const result = suggestionSchema.safeParse({
       city_name: cityName,
       email: email || undefined,
       message: message || undefined,
     });
 
     if (!result.success) {
       const fieldErrors: typeof errors = {};
       result.error.errors.forEach((err) => {
         const field = err.path[0] as keyof typeof errors;
         fieldErrors[field] = err.message;
       });
       setErrors(fieldErrors);
       return;
     }
 
     try {
       await createSuggestion.mutateAsync({
         city_name: cityName,
         email: email || null,
         message: message || null,
       });
 
       setSubmitted(true);
       toast({
         title: "Sugestão enviada!",
         description: "Obrigado pela tua sugestão. Vamos analisar em breve.",
       });
     } catch {
       toast({
         title: "Erro",
         description: "Não foi possível enviar a sugestão. Tenta novamente.",
         variant: "destructive",
       });
     }
   };
 
   if (submitted) {
     return (
       <div className="bg-card rounded-xl p-6 text-center">
         <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
         <h3 className="text-lg font-semibold text-foreground mb-2">
           Sugestão Enviada!
         </h3>
         <p className="text-muted-foreground">
           Obrigado por nos ajudares a crescer. Vamos adicionar restaurantes em{" "}
           <span className="font-medium text-foreground">{cityName}</span> em breve!
         </p>
       </div>
     );
   }
 
   return (
     <div className="bg-card rounded-xl p-6">
       <h3 className="text-lg font-semibold text-foreground mb-2">
         Não encontras a tua cidade?
       </h3>
       <p className="text-muted-foreground text-sm mb-4">
         Sugere a tua cidade e avisamos-te quando tivermos restaurantes disponíveis.
       </p>
 
       <form onSubmit={handleSubmit} className="space-y-4">
         <div className="space-y-2">
           <Label htmlFor="city_name">Cidade *</Label>
           <Input
             id="city_name"
             placeholder="Nome da cidade"
             value={cityName}
             onChange={(e) => setCityName(e.target.value)}
             className={errors.city_name ? "border-destructive" : ""}
             disabled={createSuggestion.isPending}
           />
           {errors.city_name && (
             <p className="text-sm text-destructive">{errors.city_name}</p>
           )}
         </div>
 
         <div className="space-y-2">
           <Label htmlFor="email">Email (opcional)</Label>
           <Input
             id="email"
             type="email"
             placeholder="teu@email.pt"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             className={errors.email ? "border-destructive" : ""}
             disabled={createSuggestion.isPending}
           />
           {errors.email && (
             <p className="text-sm text-destructive">{errors.email}</p>
           )}
         </div>
 
         <div className="space-y-2">
           <Label htmlFor="message">Mensagem (opcional)</Label>
           <Textarea
             id="message"
             placeholder="Conheces algum restaurante que devíamos adicionar?"
             value={message}
             onChange={(e) => setMessage(e.target.value)}
             rows={3}
             disabled={createSuggestion.isPending}
           />
         </div>
 
         <Button
           type="submit"
           className="w-full btn-cta-primary"
           disabled={createSuggestion.isPending}
         >
           {createSuggestion.isPending ? (
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
       </form>
     </div>
   );
 };
 
 export default SuggestionForm;