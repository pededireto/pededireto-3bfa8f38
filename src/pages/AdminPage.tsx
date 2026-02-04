import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  MapPin, 
  Star, 
  Settings,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Menu,
  X
} from "lucide-react";
import { restaurants, zones, categories, Restaurant, Zone } from "@/data/mockData";
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
import { cn } from "@/lib/utils";

type AdminTab = "dashboard" | "restaurants" | "zones" | "featured";

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [restaurantList, setRestaurantList] = useState<Restaurant[]>(restaurants);
  const [zoneList, setZoneList] = useState<Zone[]>(zones);

  const sidebarItems = [
    { id: "dashboard" as AdminTab, label: "Dashboard", icon: LayoutDashboard },
    { id: "restaurants" as AdminTab, label: "Restaurantes", icon: UtensilsCrossed },
    { id: "zones" as AdminTab, label: "Zonas", icon: MapPin },
    { id: "featured" as AdminTab, label: "Destaques", icon: Star },
  ];

  const toggleFeatured = (restaurantId: string) => {
    setRestaurantList(prev => 
      prev.map(r => 
        r.id === restaurantId ? { ...r, isFeatured: !r.isFeatured } : r
      )
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardContent restaurants={restaurantList} zones={zoneList} />;
      case "restaurants":
        return <RestaurantsContent restaurants={restaurantList} zones={zoneList} />;
      case "zones":
        return <ZonesContent zones={zoneList} restaurants={restaurantList} />;
      case "featured":
        return <FeaturedContent restaurants={restaurantList} onToggleFeatured={toggleFeatured} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <Link to="/" className="text-lg font-bold text-primary">
          Pede Direto
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
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
            <div className="p-4 border-t border-sidebar-border">
              <Link 
                to="/"
                className="flex items-center gap-2 text-sm text-sidebar-foreground hover:text-sidebar-primary-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Ver site público
              </Link>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen lg:min-h-[calc(100vh)] p-4 md:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

// Dashboard Content
const DashboardContent = ({ restaurants, zones }: { restaurants: Restaurant[]; zones: Zone[] }) => {
  const featuredCount = restaurants.filter(r => r.isFeatured).length;

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
          value={zones.length} 
          icon={MapPin}
        />
        <StatCard 
          title="Categorias" 
          value={categories.length} 
          icon={Settings}
        />
      </div>

      <div className="bg-card rounded-xl p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4">Restaurantes Recentes</h2>
        <div className="space-y-3">
          {restaurants.slice(0, 5).map((restaurant) => (
            <div key={restaurant.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30">
              <img 
                src={restaurant.logo} 
                alt={restaurant.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{restaurant.name}</h3>
                <p className="text-sm text-muted-foreground">{restaurant.zoneName}</p>
              </div>
              {restaurant.isFeatured && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  Destaque
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon }: { title: string; value: number; icon: any }) => (
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

// Restaurants Content
const RestaurantsContent = ({ restaurants, zones }: { restaurants: Restaurant[]; zones: Zone[] }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Restaurantes</h1>
          <p className="text-muted-foreground">Gerir restaurantes da plataforma</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="btn-cta-primary">
              <Plus className="h-4 w-4" />
              Adicionar Restaurante
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Restaurante</DialogTitle>
              <DialogDescription>
                Preenche os dados do novo restaurante
              </DialogDescription>
            </DialogHeader>
            <RestaurantForm zones={zones} />
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
                        src={restaurant.logo} 
                        alt={restaurant.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <span className="font-medium">{restaurant.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{restaurant.category}</TableCell>
                  <TableCell>{restaurant.zoneName}</TableCell>
                  <TableCell>
                    {restaurant.isFeatured ? (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        Sim
                      </Badge>
                    ) : (
                      <Badge variant="outline">Não</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

// Restaurant Form
const RestaurantForm = ({ zones }: { zones: Zone[] }) => {
  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" placeholder="Nome do restaurante" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Select>
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="zone">Zona</Label>
        <Select>
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

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" placeholder="Descrição curta do restaurante" rows={3} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo">URL do Logótipo</Label>
        <Input id="logo" placeholder="https://..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weekdays">Horário (Dias úteis)</Label>
          <Input id="weekdays" placeholder="12:00 - 22:00" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weekend">Horário (Fim de semana)</Label>
          <Input id="weekend" placeholder="12:00 - 23:00" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Links de Contacto</Label>
        <div className="space-y-2">
          <Input placeholder="Website (https://...)" />
          <Input placeholder="WhatsApp (351912345678)" />
          <Input placeholder="Telefone (+351 ...)" />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" className="btn-cta-primary">
          Guardar Restaurante
        </Button>
      </DialogFooter>
    </div>
  );
};

// Zones Content
const ZonesContent = ({ zones, restaurants }: { zones: Zone[]; restaurants: Restaurant[] }) => {
  const getRestaurantCount = (zoneId: string) => 
    restaurants.filter(r => r.zoneId === zoneId).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Zonas</h1>
          <p className="text-muted-foreground">Gerir cidades e zonas de entrega</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="btn-cta-primary">
              <Plus className="h-4 w-4" />
              Adicionar Zona
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Zona</DialogTitle>
              <DialogDescription>
                Cria uma nova cidade ou zona de entrega
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="zoneName">Nome da Zona</Label>
                <Input id="zoneName" placeholder="Ex: Aveiro" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zoneSlug">Slug (URL)</Label>
                <Input id="zoneSlug" placeholder="Ex: aveiro" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="btn-cta-primary">
                Criar Zona
              </Button>
            </DialogFooter>
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
                <Button variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{getRestaurantCount(zone.id)}</span> restaurantes
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Featured Content
const FeaturedContent = ({ 
  restaurants, 
  onToggleFeatured 
}: { 
  restaurants: Restaurant[]; 
  onToggleFeatured: (id: string) => void;
}) => {
  const sortedRestaurants = [...restaurants].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return a.order - b.order;
  });

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
                        src={restaurant.logo} 
                        alt={restaurant.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <span className="font-medium">{restaurant.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{restaurant.zoneName}</TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      defaultValue={restaurant.order}
                      className="w-20"
                      min={1}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch 
                      checked={restaurant.isFeatured}
                      onCheckedChange={() => onToggleFeatured(restaurant.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
