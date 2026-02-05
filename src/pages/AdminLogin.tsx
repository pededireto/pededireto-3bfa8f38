 import { useState } from "react";
 import { useNavigate, Link } from "react-router-dom";
 import { z } from "zod";
 import { useAuth } from "@/hooks/useAuth";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { useToast } from "@/hooks/use-toast";
 import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
 
 const loginSchema = z.object({
   email: z.string().trim().email("Email inválido").max(255),
   password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(100),
 });
 
 const AdminLogin = () => {
   const navigate = useNavigate();
   const { signIn, isLoading: authLoading } = useAuth();
   const { toast } = useToast();
 
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [showPassword, setShowPassword] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setErrors({});
 
     // Validate inputs
     const result = loginSchema.safeParse({ email, password });
     if (!result.success) {
       const fieldErrors: { email?: string; password?: string } = {};
       result.error.errors.forEach((err) => {
         if (err.path[0] === "email") fieldErrors.email = err.message;
         if (err.path[0] === "password") fieldErrors.password = err.message;
       });
       setErrors(fieldErrors);
       return;
     }
 
     setIsLoading(true);
 
     try {
       const { error } = await signIn(email, password);
       
       if (error) {
         let message = "Erro ao fazer login. Tenta novamente.";
         if (error.message.includes("Invalid login credentials")) {
           message = "Email ou senha incorretos.";
         } else if (error.message.includes("Email not confirmed")) {
           message = "Por favor confirma o teu email antes de fazer login.";
         }
         toast({
           title: "Erro de autenticação",
           description: message,
           variant: "destructive",
         });
       } else {
         toast({
           title: "Login efetuado",
           description: "Bem-vindo de volta!",
         });
         navigate("/admin");
       }
     } finally {
       setIsLoading(false);
     }
   };
 
   return (
     <div className="min-h-screen bg-background flex items-center justify-center p-4">
       <div className="w-full max-w-md">
         <div className="bg-card rounded-2xl shadow-card p-8">
           {/* Header */}
           <div className="text-center mb-8">
             <Link to="/" className="inline-block mb-6">
               <h1 className="text-2xl font-bold text-primary">Pede Direto</h1>
             </Link>
             <h2 className="text-xl font-semibold text-foreground">Área de Gestão</h2>
             <p className="text-muted-foreground mt-1">Faz login para aceder ao painel</p>
           </div>
 
           {/* Form */}
           <form onSubmit={handleSubmit} className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="email">Email</Label>
               <Input
                 id="email"
                 type="email"
                 placeholder="admin@pededireto.pt"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className={errors.email ? "border-destructive" : ""}
                 disabled={isLoading}
               />
               {errors.email && (
                 <p className="text-sm text-destructive">{errors.email}</p>
               )}
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="password">Senha</Label>
               <div className="relative">
                 <Input
                   id="password"
                   type={showPassword ? "text" : "password"}
                   placeholder="••••••••"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className={errors.password ? "border-destructive pr-10" : "pr-10"}
                   disabled={isLoading}
                 />
                 <button
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                   tabIndex={-1}
                 >
                   {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                 </button>
               </div>
               {errors.password && (
                 <p className="text-sm text-destructive">{errors.password}</p>
               )}
             </div>
 
             <Button 
               type="submit" 
               className="w-full btn-cta-primary" 
               disabled={isLoading}
             >
               {isLoading ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   A entrar...
                 </>
               ) : (
                 "Entrar"
               )}
             </Button>
           </form>
 
           {/* Back link */}
           <div className="mt-6 text-center">
             <Link 
               to="/" 
               className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
             >
               <ArrowLeft className="h-4 w-4" />
               Voltar ao site
             </Link>
           </div>
         </div>
 
         {/* Signup hint */}
         <p className="text-center text-sm text-muted-foreground mt-6">
           Não tens conta?{" "}
           <Link to="/admin/register" className="text-primary hover:underline">
             Regista-te aqui
           </Link>
         </p>
       </div>
     </div>
   );
 };
 
 export default AdminLogin;