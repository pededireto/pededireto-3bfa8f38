 import { Link } from "react-router-dom";
 import { 
   LayoutDashboard, 
   UtensilsCrossed, 
   MapPin, 
   Star, 
   ExternalLink,
   LogOut,
   Lightbulb
 } from "lucide-react";
 import { useAuth } from "@/hooks/useAuth";
 import { cn } from "@/lib/utils";
 
 export type AdminTab = "dashboard" | "restaurants" | "zones" | "featured" | "suggestions";
 
 interface AdminSidebarProps {
   activeTab: AdminTab;
   setActiveTab: (tab: AdminTab) => void;
   setSidebarOpen: (open: boolean) => void;
 }
 
 const sidebarItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
   { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
   { id: "restaurants", label: "Restaurantes", icon: UtensilsCrossed },
   { id: "zones", label: "Zonas", icon: MapPin },
   { id: "featured", label: "Destaques", icon: Star },
   { id: "suggestions", label: "Sugestões", icon: Lightbulb },
 ];
 
 const AdminSidebar = ({ activeTab, setActiveTab, setSidebarOpen }: AdminSidebarProps) => {
   const { signOut } = useAuth();
 
   const handleSignOut = async () => {
     await signOut();
   };
 
   return (
     <div className="flex flex-col h-full">
       {/* Brand */}
       <div className="p-6 border-b border-sidebar-border hidden lg:block">
         <Link to="/" className="block">
           <h1 className="text-xl font-bold text-sidebar-primary-foreground">
             Pede Direto
           </h1>
           <p className="text-xs text-sidebar-foreground/70">Área de Gestão</p>
         </Link>
       </div>
 
       {/* Navigation */}
       <nav className="flex-1 p-4 space-y-1">
         {sidebarItems.map((item) => (
           <button
             key={item.id}
             onClick={() => {
               setActiveTab(item.id);
               setSidebarOpen(false);
             }}
             className={cn(
               "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
               activeTab === item.id
                 ? "bg-sidebar-primary text-sidebar-primary-foreground"
                 : "text-sidebar-foreground hover:bg-sidebar-accent"
             )}
           >
             <item.icon className="h-5 w-5" />
             {item.label}
           </button>
         ))}
       </nav>
 
       {/* Footer */}
       <div className="p-4 border-t border-sidebar-border space-y-2">
         <Link 
           to="/"
           className="flex items-center gap-2 text-sm text-sidebar-foreground hover:text-sidebar-primary-foreground transition-colors"
         >
           <ExternalLink className="h-4 w-4" />
           Ver site público
         </Link>
         <button
           onClick={handleSignOut}
           className="flex items-center gap-2 text-sm text-sidebar-foreground hover:text-destructive transition-colors w-full"
         >
           <LogOut className="h-4 w-4" />
           Sair
         </button>
       </div>
     </div>
   );
 };
 
 export default AdminSidebar;