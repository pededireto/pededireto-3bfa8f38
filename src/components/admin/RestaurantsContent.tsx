 import { useState } from "react";
 import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
 import { Restaurant, RestaurantInput, useCreateRestaurant, useUpdateRestaurant, useDeleteRestaurant } from "@/hooks/useRestaurants";
 import { Zone } from "@/hooks/useZones";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Switch } from "@/components/ui/switch";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from "@/components/ui/dialog";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { Badge } from "@/components/ui/badge";
 import { useToast } from "@/hooks/use-toast";
 
 const categories = [
   "Pizza",
   "Sushi",
   "Hambúrguer",
   "Churrasqueira",
   "Portuguesa",
   "Italiana",
   "Brasileira",
   "Asiática",
   "Vegetariana",
   "Padaria",
 ];
 
 interface RestaurantsContentProps {
   restaurants: Restaurant[];
   zones: Zone[];
 }
 
 const RestaurantsContent = ({ restaurants, zones }: RestaurantsContentProps) => {
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
   const { toast } = useToast();
   
   const createRestaurant = useCreateRestaurant();
   const updateRestaurant = useUpdateRestaurant();
   const deleteRestaurant = useDeleteRestaurant();
 
   const handleEdit = (restaurant: Restaurant) => {
     setEditingRestaurant(restaurant);
     setIsDialogOpen(true);
   };
 
   const handleDelete = async (id: string) => {
     if (!confirm("Tens a certeza que queres eliminar este restaurante?")) return;
     
     try {
       await deleteRestaurant.mutateAsync(id);
       toast({ title: "Restaurante eliminado" });
     } catch {
       toast({ title: "Erro ao eliminar", variant: "destructive" });
     }
   };
 
   const handleCloseDialog = () => {
     setIsDialogOpen(false);
     setEditingRestaurant(null);
   };
 
   return (
     <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
           <h1 className="text-2xl md:text-3xl font-bold text-foreground">Restaurantes</h1>
           <p className="text-muted-foreground">Gerir restaurantes da plataforma</p>
         </div>
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
           <DialogTrigger asChild>
             <Button className="btn-cta-primary" onClick={() => setEditingRestaurant(null)}>
               <Plus className="h-4 w-4" />
               Adicionar Restaurante
             </Button>
           </DialogTrigger>
           <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle>{editingRestaurant ? "Editar Restaurante" : "Adicionar Restaurante"}</DialogTitle>
               <DialogDescription>
                 {editingRestaurant ? "Atualiza os dados do restaurante" : "Preenche os dados do novo restaurante"}
               </DialogDescription>
             </DialogHeader>
             <RestaurantForm 
               zones={zones} 
               restaurant={editingRestaurant}
               onClose={handleCloseDialog}
             />
           </DialogContent>
         </Dialog>
       </div>
 
       <div className="bg-card rounded-xl shadow-card overflow-hidden">
         <div className="overflow-x-auto">
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Restaurante</TableHead>
                 <TableHead>Categoria</TableHead>
                 <TableHead>Zona</TableHead>
                 <TableHead>Estado</TableHead>
                 <TableHead>Destaque</TableHead>
                 <TableHead className="text-right">Ações</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {restaurants.map((restaurant) => (
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
                   <TableCell>{restaurant.category}</TableCell>
                   <TableCell>{restaurant.zones?.name}</TableCell>
                   <TableCell>
                     {restaurant.is_active ? (
                       <Badge variant="secondary" className="bg-green-100 text-green-800">
                         Ativo
                       </Badge>
                     ) : (
                       <Badge variant="outline">Inativo</Badge>
                     )}
                   </TableCell>
                   <TableCell>
                     {restaurant.is_featured ? (
                       <Badge variant="secondary" className="bg-primary/10 text-primary">
                         Sim
                       </Badge>
                     ) : (
                       <Badge variant="outline">Não</Badge>
                     )}
                   </TableCell>
                   <TableCell className="text-right">
                     <div className="flex items-center justify-end gap-2">
                       <Button variant="ghost" size="icon" onClick={() => handleEdit(restaurant)}>
                         <Pencil className="h-4 w-4" />
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="text-destructive"
                         onClick={() => handleDelete(restaurant.id)}
                         disabled={deleteRestaurant.isPending}
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                   </TableCell>
                 </TableRow>
               ))}
               {restaurants.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                     Nenhum restaurante adicionado ainda.
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
 
 // Restaurant Form Component
 interface RestaurantFormProps {
   zones: Zone[];
   restaurant: Restaurant | null;
   onClose: () => void;
 }
 
 const RestaurantForm = ({ zones, restaurant, onClose }: RestaurantFormProps) => {
   const { toast } = useToast();
   const createRestaurant = useCreateRestaurant();
   const updateRestaurant = useUpdateRestaurant();
 
   const [formData, setFormData] = useState({
     name: restaurant?.name || "",
     slug: restaurant?.slug || "",
     zone_id: restaurant?.zone_id || "",
     category: restaurant?.category || "",
     description: restaurant?.description || "",
     logo_url: restaurant?.logo_url || "",
     schedule_weekdays: restaurant?.schedule_weekdays || "",
     schedule_weekend: restaurant?.schedule_weekend || "",
     cta_website: restaurant?.cta_website || "",
     cta_whatsapp: restaurant?.cta_whatsapp || "",
     cta_phone: restaurant?.cta_phone || "",
     cta_app: restaurant?.cta_app || "",
     is_featured: restaurant?.is_featured || false,
     is_active: restaurant?.is_active ?? true,
     display_order: restaurant?.display_order || 0,
   });
 
   const generateSlug = (name: string) => {
     return name
       .toLowerCase()
       .normalize("NFD")
       .replace(/[\u0300-\u036f]/g, "")
       .replace(/[^a-z0-9]+/g, "-")
       .replace(/^-|-$/g, "");
   };
 
   const handleNameChange = (name: string) => {
     setFormData(prev => ({
       ...prev,
       name,
       slug: prev.slug || generateSlug(name),
     }));
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
 
     if (!formData.name || !formData.zone_id || !formData.category) {
       toast({ title: "Preenche os campos obrigatórios", variant: "destructive" });
       return;
     }
 
     try {
       const data: RestaurantInput = {
         name: formData.name,
         slug: formData.slug || generateSlug(formData.name),
         zone_id: formData.zone_id,
         category: formData.category,
         description: formData.description || null,
         logo_url: formData.logo_url || null,
         schedule_weekdays: formData.schedule_weekdays || null,
         schedule_weekend: formData.schedule_weekend || null,
         cta_website: formData.cta_website || null,
         cta_whatsapp: formData.cta_whatsapp || null,
         cta_phone: formData.cta_phone || null,
         cta_app: formData.cta_app || null,
         is_featured: formData.is_featured,
         is_active: formData.is_active,
         display_order: formData.display_order,
       };
 
       if (restaurant) {
         await updateRestaurant.mutateAsync({ id: restaurant.id, ...data });
         toast({ title: "Restaurante atualizado" });
       } else {
         await createRestaurant.mutateAsync(data);
         toast({ title: "Restaurante criado" });
       }
       onClose();
     } catch (error: any) {
       toast({ 
         title: "Erro ao guardar", 
         description: error?.message || "Tenta novamente",
         variant: "destructive" 
       });
     }
   };
 
   const isPending = createRestaurant.isPending || updateRestaurant.isPending;
 
   return (
     <form onSubmit={handleSubmit} className="space-y-4 py-4">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="space-y-2">
           <Label htmlFor="name">Nome *</Label>
           <Input 
             id="name" 
             placeholder="Nome do restaurante" 
             value={formData.name}
             onChange={(e) => handleNameChange(e.target.value)}
             required
           />
         </div>
         <div className="space-y-2">
           <Label htmlFor="slug">Slug (URL)</Label>
           <Input 
             id="slug" 
             placeholder="nome-do-restaurante" 
             value={formData.slug}
             onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
           />
         </div>
       </div>
 
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="space-y-2">
           <Label htmlFor="category">Categoria *</Label>
           <Select 
             value={formData.category}
             onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
           >
             <SelectTrigger>
               <SelectValue placeholder="Selecionar categoria" />
             </SelectTrigger>
             <SelectContent>
               {categories.map((cat) => (
                 <SelectItem key={cat} value={cat}>{cat}</SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
         <div className="space-y-2">
           <Label htmlFor="zone">Zona *</Label>
           <Select
             value={formData.zone_id}
             onValueChange={(value) => setFormData(prev => ({ ...prev, zone_id: value }))}
           >
             <SelectTrigger>
               <SelectValue placeholder="Selecionar zona" />
             </SelectTrigger>
             <SelectContent>
               {zones.map((zone) => (
                 <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
       </div>
 
       <div className="space-y-2">
         <Label htmlFor="description">Descrição</Label>
         <Textarea 
           id="description" 
           placeholder="Descrição curta do restaurante" 
           rows={3}
           value={formData.description}
           onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
         />
       </div>
 
       <div className="space-y-2">
         <Label htmlFor="logo">URL do Logótipo</Label>
         <Input 
           id="logo" 
           placeholder="https://..." 
           value={formData.logo_url}
           onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
         />
       </div>
 
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="space-y-2">
           <Label htmlFor="weekdays">Horário (Dias úteis)</Label>
           <Input 
             id="weekdays" 
             placeholder="12:00 - 22:00" 
             value={formData.schedule_weekdays}
             onChange={(e) => setFormData(prev => ({ ...prev, schedule_weekdays: e.target.value }))}
           />
         </div>
         <div className="space-y-2">
           <Label htmlFor="weekend">Horário (Fim de semana)</Label>
           <Input 
             id="weekend" 
             placeholder="12:00 - 23:00" 
             value={formData.schedule_weekend}
             onChange={(e) => setFormData(prev => ({ ...prev, schedule_weekend: e.target.value }))}
           />
         </div>
       </div>
 
       <div className="space-y-2">
         <Label>Links de Contacto</Label>
         <div className="space-y-2">
           <Input 
             placeholder="Website (https://...)" 
             value={formData.cta_website}
             onChange={(e) => setFormData(prev => ({ ...prev, cta_website: e.target.value }))}
           />
           <Input 
             placeholder="WhatsApp (351912345678)" 
             value={formData.cta_whatsapp}
             onChange={(e) => setFormData(prev => ({ ...prev, cta_whatsapp: e.target.value }))}
           />
           <Input 
             placeholder="Telefone (+351 ...)" 
             value={formData.cta_phone}
             onChange={(e) => setFormData(prev => ({ ...prev, cta_phone: e.target.value }))}
           />
           <Input 
             placeholder="App (link para a app)" 
             value={formData.cta_app}
             onChange={(e) => setFormData(prev => ({ ...prev, cta_app: e.target.value }))}
           />
         </div>
       </div>
 
       <div className="flex items-center gap-6">
         <div className="flex items-center gap-2">
           <Switch 
             id="is_active"
             checked={formData.is_active}
             onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
           />
           <Label htmlFor="is_active">Ativo</Label>
         </div>
         <div className="flex items-center gap-2">
           <Switch 
             id="is_featured"
             checked={formData.is_featured}
             onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
           />
           <Label htmlFor="is_featured">Destaque</Label>
         </div>
         <div className="flex items-center gap-2">
           <Label htmlFor="display_order">Ordem</Label>
           <Input 
             id="display_order"
             type="number" 
             className="w-20"
             value={formData.display_order}
             onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
           />
         </div>
       </div>
 
       <DialogFooter>
         <Button type="submit" className="btn-cta-primary" disabled={isPending}>
           {isPending ? (
             <>
               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
               A guardar...
             </>
           ) : (
             restaurant ? "Guardar Alterações" : "Criar Restaurante"
           )}
         </Button>
       </DialogFooter>
     </form>
   );
 };
 
 export default RestaurantsContent;