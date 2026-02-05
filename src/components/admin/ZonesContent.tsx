 import { useState } from "react";
 import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
 import { Zone, ZoneInput, useCreateZone, useUpdateZone, useDeleteZone } from "@/hooks/useZones";
 import { Restaurant } from "@/hooks/useRestaurants";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Switch } from "@/components/ui/switch";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from "@/components/ui/dialog";
 import { useToast } from "@/hooks/use-toast";
 
 interface ZonesContentProps {
   zones: Zone[];
   restaurants: Restaurant[];
 }
 
 const ZonesContent = ({ zones, restaurants }: ZonesContentProps) => {
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [editingZone, setEditingZone] = useState<Zone | null>(null);
   const { toast } = useToast();
   
   const deleteZone = useDeleteZone();
 
   const getRestaurantCount = (zoneId: string) => 
     restaurants.filter(r => r.zone_id === zoneId).length;
 
   const handleEdit = (zone: Zone) => {
     setEditingZone(zone);
     setIsDialogOpen(true);
   };
 
   const handleDelete = async (id: string) => {
     const count = getRestaurantCount(id);
     if (count > 0) {
       toast({ 
         title: "Não é possível eliminar", 
         description: `Esta zona tem ${count} restaurante(s) associado(s).`,
         variant: "destructive" 
       });
       return;
     }
     
     if (!confirm("Tens a certeza que queres eliminar esta zona?")) return;
     
     try {
       await deleteZone.mutateAsync(id);
       toast({ title: "Zona eliminada" });
     } catch {
       toast({ title: "Erro ao eliminar", variant: "destructive" });
     }
   };
 
   const handleCloseDialog = () => {
     setIsDialogOpen(false);
     setEditingZone(null);
   };
 
   return (
     <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
           <h1 className="text-2xl md:text-3xl font-bold text-foreground">Zonas</h1>
           <p className="text-muted-foreground">Gerir cidades e zonas de entrega</p>
         </div>
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
           <DialogTrigger asChild>
             <Button className="btn-cta-primary" onClick={() => setEditingZone(null)}>
               <Plus className="h-4 w-4" />
               Adicionar Zona
             </Button>
           </DialogTrigger>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>{editingZone ? "Editar Zona" : "Adicionar Zona"}</DialogTitle>
               <DialogDescription>
                 {editingZone ? "Atualiza os dados da zona" : "Cria uma nova cidade ou zona de entrega"}
               </DialogDescription>
             </DialogHeader>
             <ZoneForm zone={editingZone} onClose={handleCloseDialog} />
           </DialogContent>
         </Dialog>
       </div>
 
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {zones.map((zone) => (
           <div key={zone.id} className="bg-card rounded-xl p-6 shadow-card">
             <div className="flex items-start justify-between">
               <div>
                 <h3 className="text-lg font-semibold text-foreground">{zone.name}</h3>
                 <p className="text-sm text-muted-foreground">/{zone.slug}</p>
               </div>
               <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon" onClick={() => handleEdit(zone)}>
                   <Pencil className="h-4 w-4" />
                 </Button>
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="text-destructive"
                   onClick={() => handleDelete(zone.id)}
                   disabled={deleteZone.isPending}
                 >
                   <Trash2 className="h-4 w-4" />
                 </Button>
               </div>
             </div>
             <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
               <p className="text-sm text-muted-foreground">
                 <span className="font-semibold text-foreground">{getRestaurantCount(zone.id)}</span> restaurantes
               </p>
               <span className={`text-xs px-2 py-1 rounded-full ${zone.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                 {zone.is_active ? 'Ativa' : 'Inativa'}
               </span>
             </div>
           </div>
         ))}
         {zones.length === 0 && (
           <div className="col-span-full text-center py-8 text-muted-foreground">
             Nenhuma zona adicionada ainda.
           </div>
         )}
       </div>
     </div>
   );
 };
 
 // Zone Form Component
 interface ZoneFormProps {
   zone: Zone | null;
   onClose: () => void;
 }
 
 const ZoneForm = ({ zone, onClose }: ZoneFormProps) => {
   const { toast } = useToast();
   const createZone = useCreateZone();
   const updateZone = useUpdateZone();
 
   const [formData, setFormData] = useState({
     name: zone?.name || "",
     slug: zone?.slug || "",
     is_active: zone?.is_active ?? true,
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
 
     if (!formData.name) {
       toast({ title: "Nome é obrigatório", variant: "destructive" });
       return;
     }
 
     try {
       const data: ZoneInput = {
         name: formData.name,
         slug: formData.slug || generateSlug(formData.name),
         is_active: formData.is_active,
       };
 
       if (zone) {
         await updateZone.mutateAsync({ id: zone.id, ...data });
         toast({ title: "Zona atualizada" });
       } else {
         await createZone.mutateAsync(data);
         toast({ title: "Zona criada" });
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
 
   const isPending = createZone.isPending || updateZone.isPending;
 
   return (
     <form onSubmit={handleSubmit} className="space-y-4 py-4">
       <div className="space-y-2">
         <Label htmlFor="zoneName">Nome da Zona *</Label>
         <Input 
           id="zoneName" 
           placeholder="Ex: Aveiro" 
           value={formData.name}
           onChange={(e) => handleNameChange(e.target.value)}
           required
         />
       </div>
       <div className="space-y-2">
         <Label htmlFor="zoneSlug">Slug (URL)</Label>
         <Input 
           id="zoneSlug" 
           placeholder="Ex: aveiro" 
           value={formData.slug}
           onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
         />
       </div>
       <div className="flex items-center gap-2">
         <Switch 
           id="is_active"
           checked={formData.is_active}
           onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
         />
         <Label htmlFor="is_active">Zona ativa</Label>
       </div>
       <DialogFooter>
         <Button type="submit" className="btn-cta-primary" disabled={isPending}>
           {isPending ? (
             <>
               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
               A guardar...
             </>
           ) : (
             zone ? "Guardar Alterações" : "Criar Zona"
           )}
         </Button>
       </DialogFooter>
     </form>
   );
 };
 
 export default ZonesContent;