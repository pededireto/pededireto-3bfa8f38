import { useState } from "react";
import { BusinessWithCategory, useCreateBusiness, useUpdateBusiness, useDeleteBusiness } from "@/hooks/useBusinesses";
import { Category } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Search, Building2 } from "lucide-react";

interface BusinessesContentProps {
  businesses: BusinessWithCategory[];
  categories: Category[];
}

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const BusinessesContent = ({ businesses, categories }: BusinessesContentProps) => {
  const { toast } = useToast();
  const createBusiness = useCreateBusiness();
  const updateBusiness = useUpdateBusiness();
  const deleteBusiness = useDeleteBusiness();

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessWithCategory | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category_id: "",
    description: "",
    logo_url: "",
    city: "",
    zone: "",
    alcance: "local" as "local" | "nacional" | "hibrido",
    schedule_weekdays: "",
    schedule_weekend: "",
    cta_website: "",
    cta_whatsapp: "",
    cta_phone: "",
    cta_email: "",
    is_featured: false,
    is_premium: false,
    is_active: true,
    display_order: 0,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      category_id: "",
      description: "",
      logo_url: "",
      city: "",
      zone: "",
      alcance: "local",
      schedule_weekdays: "",
      schedule_weekend: "",
      cta_website: "",
      cta_whatsapp: "",
      cta_phone: "",
      cta_email: "",
      is_featured: false,
      is_premium: false,
      is_active: true,
      display_order: 0,
    });
    setEditingBusiness(null);
  };

  const openEditDialog = (business: BusinessWithCategory) => {
    setEditingBusiness(business);
    setFormData({
      name: business.name,
      slug: business.slug,
      category_id: business.category_id || "",
      description: business.description || "",
      logo_url: business.logo_url || "",
      city: business.city || "",
      zone: business.zone || "",
      alcance: business.alcance,
      schedule_weekdays: business.schedule_weekdays || "",
      schedule_weekend: business.schedule_weekend || "",
      cta_website: business.cta_website || "",
      cta_whatsapp: business.cta_whatsapp || "",
      cta_phone: business.cta_phone || "",
      cta_email: business.cta_email || "",
      is_featured: business.is_featured,
      is_premium: business.is_premium,
      is_active: business.is_active,
      display_order: business.display_order,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const businessData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.name),
        category_id: formData.category_id || null,
        description: formData.description || null,
        logo_url: formData.logo_url || null,
        city: formData.city || null,
        zone: formData.zone || null,
        schedule_weekdays: formData.schedule_weekdays || null,
        schedule_weekend: formData.schedule_weekend || null,
        cta_website: formData.cta_website || null,
        cta_whatsapp: formData.cta_whatsapp || null,
        cta_phone: formData.cta_phone || null,
        cta_email: formData.cta_email || null,
        cta_app: null,
        images: [],
        coordinates: null,
      };

      if (editingBusiness) {
        await updateBusiness.mutateAsync({ id: editingBusiness.id, ...businessData });
        toast({ title: "Negócio atualizado com sucesso" });
      } else {
        await createBusiness.mutateAsync(businessData);
        toast({ title: "Negócio criado com sucesso" });
      }
      
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ 
        title: "Erro", 
        description: "Não foi possível guardar o negócio", 
        variant: "destructive" 
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este negócio?")) return;
    
    try {
      await deleteBusiness.mutateAsync(id);
      toast({ title: "Negócio removido com sucesso" });
    } catch (error) {
      toast({ 
        title: "Erro", 
        description: "Não foi possível remover o negócio", 
        variant: "destructive" 
      });
    }
  };

  const filteredBusinesses = businesses.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.categories?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = createBusiness.isPending || updateBusiness.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Negócios</h1>
          <p className="text-muted-foreground">Gerir todos os negócios da plataforma</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="btn-cta-primary">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Negócio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBusiness ? "Editar Negócio" : "Novo Negócio"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="gerado automaticamente"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alcance">Alcance</Label>
                  <Select
                    value={formData.alcance}
                    onValueChange={(value: "local" | "nacional" | "hibrido") => 
                      setFormData({ ...formData, alcance: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="nacional">Nacional</SelectItem>
                      <SelectItem value="hibrido">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo_url">URL do Logo</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cta_whatsapp">WhatsApp</Label>
                  <Input
                    id="cta_whatsapp"
                    value={formData.cta_whatsapp}
                    onChange={(e) => setFormData({ ...formData, cta_whatsapp: e.target.value })}
                    placeholder="+351..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cta_phone">Telefone</Label>
                  <Input
                    id="cta_phone"
                    value={formData.cta_phone}
                    onChange={(e) => setFormData({ ...formData, cta_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cta_website">Website</Label>
                  <Input
                    id="cta_website"
                    value={formData.cta_website}
                    onChange={(e) => setFormData({ ...formData, cta_website: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cta_email">Email</Label>
                  <Input
                    id="cta_email"
                    type="email"
                    value={formData.cta_email}
                    onChange={(e) => setFormData({ ...formData, cta_email: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Ativo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label htmlFor="is_featured">Destaque</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_premium"
                    checked={formData.is_premium}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_premium: checked })}
                  />
                  <Label htmlFor="is_premium">Premium</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingBusiness ? "Guardar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar negócios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* List */}
      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Negócio</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Categoria</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Cidade</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Estado</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.map((business) => (
                <tr key={business.id} className="border-t border-border">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {business.logo_url ? (
                        <img
                          src={business.logo_url}
                          alt={business.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary/50" />
                        </div>
                      )}
                      <span className="font-medium">{business.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {business.categories?.name || "-"}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {business.city || "-"}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {business.is_active ? (
                        <Badge variant="secondary" className="bg-success/10 text-success">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground">
                          Inativo
                        </Badge>
                      )}
                      {business.is_featured && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          Destaque
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(business)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(business.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBusinesses.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Nenhum negócio encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BusinessesContent;
