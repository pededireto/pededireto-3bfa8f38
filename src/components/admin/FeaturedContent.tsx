 import { Loader2 } from "lucide-react";
 import { Restaurant, useUpdateRestaurant } from "@/hooks/useRestaurants";
 import { Input } from "@/components/ui/input";
 import { Switch } from "@/components/ui/switch";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { useToast } from "@/hooks/use-toast";
 import { useState } from "react";
 
 interface FeaturedContentProps {
   restaurants: Restaurant[];
 }
 
 const FeaturedContent = ({ restaurants }: FeaturedContentProps) => {
   const updateRestaurant = useUpdateRestaurant();
   const { toast } = useToast();
   const [updatingId, setUpdatingId] = useState<string | null>(null);
 
   const sortedRestaurants = [...restaurants].sort((a, b) => {
     if (a.is_featured && !b.is_featured) return -1;
     if (!a.is_featured && b.is_featured) return 1;
     return a.display_order - b.display_order;
   });
 
   const handleToggleFeatured = async (restaurant: Restaurant) => {
     setUpdatingId(restaurant.id);
     try {
       await updateRestaurant.mutateAsync({
         id: restaurant.id,
         is_featured: !restaurant.is_featured,
       });
       toast({ 
         title: restaurant.is_featured ? "Removido dos destaques" : "Adicionado aos destaques" 
       });
     } catch {
       toast({ title: "Erro ao atualizar", variant: "destructive" });
     } finally {
       setUpdatingId(null);
     }
   };
 
   const handleOrderChange = async (restaurant: Restaurant, newOrder: number) => {
     try {
       await updateRestaurant.mutateAsync({
         id: restaurant.id,
         display_order: newOrder,
       });
     } catch {
       toast({ title: "Erro ao atualizar ordem", variant: "destructive" });
     }
   };
 
   return (
     <div className="space-y-6">
       <div>
         <h1 className="text-2xl md:text-3xl font-bold text-foreground">Destaques</h1>
         <p className="text-muted-foreground">Gerir restaurantes em destaque na homepage</p>
       </div>
 
       <div className="bg-card rounded-xl shadow-card overflow-hidden">
         <div className="overflow-x-auto">
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Restaurante</TableHead>
                 <TableHead>Zona</TableHead>
                 <TableHead>Prioridade</TableHead>
                 <TableHead>Destaque</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {sortedRestaurants.map((restaurant) => (
                 <TableRow key={restaurant.id}>
                   <TableCell>
                     <div className="flex items-center gap-3">
                       <img 
                         src={restaurant.logo_url || "/placeholder.svg"} 
                         alt={restaurant.name}
                         className="w-10 h-10 rounded-lg object-cover"
                       />
                       <span className="font-medium">{restaurant.name}</span>
                     </div>
                   </TableCell>
                   <TableCell>{restaurant.zones?.name}</TableCell>
                   <TableCell>
                     <Input 
                       type="number" 
                       defaultValue={restaurant.display_order}
                       className="w-20"
                       min={0}
                       onBlur={(e) => {
                         const newOrder = parseInt(e.target.value) || 0;
                         if (newOrder !== restaurant.display_order) {
                           handleOrderChange(restaurant, newOrder);
                         }
                       }}
                     />
                   </TableCell>
                   <TableCell>
                     {updatingId === restaurant.id ? (
                       <Loader2 className="h-4 w-4 animate-spin" />
                     ) : (
                       <Switch 
                         checked={restaurant.is_featured}
                         onCheckedChange={() => handleToggleFeatured(restaurant)}
                       />
                     )}
                   </TableCell>
                 </TableRow>
               ))}
               {restaurants.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                     Nenhum restaurante disponível.
                   </TableCell>
                 </TableRow>
               )}
             </TableBody>
           </Table>
         </div>
       </div>
     </div>
   );
 };
 
 export default FeaturedContent;