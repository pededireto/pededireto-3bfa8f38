 import { Navigate, useLocation } from "react-router-dom";
 import { useAuth } from "@/hooks/useAuth";
 import { Loader2 } from "lucide-react";
 
 interface ProtectedRouteProps {
   children: React.ReactNode;
   requireAdmin?: boolean;
 }
 
 const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
   const { user, isAdmin, isLoading } = useAuth();
   const location = useLocation();
 
   if (isLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background">
         <div className="text-center">
           <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
           <p className="text-muted-foreground">A carregar...</p>
         </div>
       </div>
     );
   }
 
   if (!user) {
     return <Navigate to="/admin/login" state={{ from: location }} replace />;
   }
 
   if (requireAdmin && !isAdmin) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background p-4">
         <div className="bg-card rounded-2xl shadow-card p-8 max-w-md w-full text-center">
           <h2 className="text-xl font-semibold text-foreground mb-2">
             Acesso Restrito
           </h2>
           <p className="text-muted-foreground mb-6">
             Não tens permissões de administrador para aceder a esta área.
           </p>
           <a 
             href="/" 
             className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
           >
             Voltar ao início
           </a>
         </div>
       </div>
     );
   }
 
   return <>{children}</>;
 };
 
 export default ProtectedRoute;