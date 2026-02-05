 import { 
   UtensilsCrossed, 
   MapPin, 
   Star, 
   Lightbulb
 } from "lucide-react";
 import { Restaurant } from "@/hooks/useRestaurants";
 import { Zone } from "@/hooks/useZones";
 import { Suggestion } from "@/hooks/useSuggestions";
 import { Badge } from "@/components/ui/badge";
 
 interface DashboardContentProps {
   restaurants: Restaurant[];
   zones: Zone[];
   suggestions: Suggestion[];
 }
 
 const StatCard = ({ title, value, icon: Icon }: { title: string; value: number; icon: React.ElementType }) => (
   <div className="bg-card rounded-xl p-6 shadow-card">
     <div className="flex items-center justify-between">
       <div>
         <p className="text-sm text-muted-foreground">{title}</p>
         <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
       </div>
       <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
         <Icon className="h-6 w-6 text-primary" />
       </div>
     </div>
   </div>
 );
 
 const DashboardContent = ({ restaurants, zones, suggestions }: DashboardContentProps) => {
   const featuredCount = restaurants.filter(r => r.is_featured).length;
 
   return (
     <div className="space-y-6">
       <div>
         <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
         <p className="text-muted-foreground">Visão geral da plataforma</p>
       </div>
 
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <StatCard 
           title="Total Restaurantes" 
           value={restaurants.length} 
           icon={UtensilsCrossed}
         />
         <StatCard 
           title="Em Destaque" 
           value={featuredCount} 
           icon={Star}
         />
         <StatCard 
           title="Zonas Ativas" 
           value={zones.filter(z => z.is_active).length} 
           icon={MapPin}
         />
         <StatCard 
           title="Sugestões" 
           value={suggestions.length} 
           icon={Lightbulb}
         />
       </div>
 
       <div className="bg-card rounded-xl p-6 shadow-card">
         <h2 className="text-lg font-semibold text-foreground mb-4">Restaurantes Recentes</h2>
         <div className="space-y-3">
           {restaurants.slice(0, 5).map((restaurant) => (
             <div key={restaurant.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30">
               <img 
                 src={restaurant.logo_url || "/placeholder.svg"} 
                 alt={restaurant.name}
                 className="w-12 h-12 rounded-lg object-cover"
               />
               <div className="flex-1 min-w-0">
                 <h3 className="font-medium text-foreground truncate">{restaurant.name}</h3>
                 <p className="text-sm text-muted-foreground">{restaurant.zones?.name}</p>
               </div>
               {restaurant.is_featured && (
                 <Badge variant="secondary" className="bg-primary/10 text-primary">
                   Destaque
                 </Badge>
               )}
             </div>
           ))}
           {restaurants.length === 0 && (
             <p className="text-muted-foreground text-center py-4">
               Nenhum restaurante adicionado ainda.
             </p>
           )}
         </div>
       </div>
     </div>
   );
 };
 
 export default DashboardContent;