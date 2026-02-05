import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, ExternalLink, Phone, MessageCircle, Smartphone, Star } from "lucide-react";
 import { useRestaurant } from "@/hooks/useRestaurants";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
 import { Loader2 } from "lucide-react";

const RestaurantPage = () => {
  const { slug } = useParams<{ slug: string }>();
   const { data: restaurant, isLoading, error } = useRestaurant(slug || "");

   if (isLoading) {
     return (
       <div className="min-h-screen flex flex-col">
         <Header />
         <main className="flex-1 flex items-center justify-center">
           <div className="text-center">
             <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
             <p className="text-muted-foreground">A carregar restaurante...</p>
           </div>
         </main>
         <Footer />
       </div>
     );
   }

   if (error || !restaurant) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Restaurante não encontrado
            </h1>
            <p className="text-muted-foreground mb-4">
              O restaurante que procuras não existe ou foi removido.
            </p>
            <Link to="/">
              <Button>Voltar à página inicial</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const formatWhatsAppLink = (number: string) => {
    const cleanNumber = number.replace(/\D/g, '');
    return `https://wa.me/${cleanNumber}`;
  };

   const zoneName = restaurant.zones?.name || "";
   const images = restaurant.images || [];
   const deliveryZones = restaurant.delivery_zones || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Back link */}
        <div className="container py-4">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos restaurantes
          </Link>
        </div>

        {/* Hero Image */}
        <div className="relative h-48 md:h-72 lg:h-96 bg-muted overflow-hidden">
          <img
             src={images[0] || restaurant.logo_url || "/placeholder.svg"}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title & Category */}
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-2">
                   {restaurant.is_featured && (
                    <span className="badge-featured">
                      <Star className="h-3 w-3 fill-current" />
                      Destaque
                    </span>
                  )}
                  <span className="badge-pede-direto">Pede Direto</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  {restaurant.name}
                </h1>
                <div className="mt-2 flex items-center gap-3 text-muted-foreground">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                    {restaurant.category}
                  </span>
                   {zoneName && (
                     <span className="flex items-center gap-1 text-sm">
                       <MapPin className="h-4 w-4" />
                       {zoneName}
                     </span>
                   )}
                </div>
              </div>

              {/* Description */}
               {restaurant.description && (
                 <div>
                   <h2 className="text-lg font-semibold text-foreground mb-2">Sobre</h2>
                   <p className="text-muted-foreground leading-relaxed">
                     {restaurant.description}
                   </p>
                 </div>
               )}

              {/* Schedule */}
               {(restaurant.schedule_weekdays || restaurant.schedule_weekend) && (
                 <div>
                   <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                     <Clock className="h-5 w-5 text-primary" />
                     Horário
                   </h2>
                   <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                     {restaurant.schedule_weekdays && (
                       <div className="flex justify-between">
                         <span className="text-muted-foreground">Segunda a Sexta</span>
                         <span className="font-medium text-foreground">{restaurant.schedule_weekdays}</span>
                       </div>
                     )}
                     {restaurant.schedule_weekend && (
                       <div className="flex justify-between">
                         <span className="text-muted-foreground">Fim de semana</span>
                         <span className="font-medium text-foreground">{restaurant.schedule_weekend}</span>
                       </div>
                     )}
                  </div>
                </div>
               )}

              {/* Delivery Zones */}
               {deliveryZones.length > 0 && (
                 <div>
                   <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                     <MapPin className="h-5 w-5 text-primary" />
                     Zonas de Entrega
                   </h2>
                   <div className="flex flex-wrap gap-2">
                     {deliveryZones.map((zone, index) => (
                       <span 
                         key={index}
                         className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm"
                       >
                         {zone}
                       </span>
                     ))}
                   </div>
                </div>
               )}

              {/* Images */}
               {images.length > 1 && (
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-3">Galeria</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                     {images.map((image, index) => (
                      <div key={index} className="aspect-square rounded-xl overflow-hidden bg-muted">
                        <img
                          src={image}
                          alt={`${restaurant.name} - Imagem ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - CTAs */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-card rounded-2xl p-6 shadow-card space-y-4">
                <h3 className="font-semibold text-foreground text-lg mb-4">
                  Faz a tua encomenda
                </h3>

                 {restaurant.cta_website && (
                  <a
                     href={restaurant.cta_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-cta-primary w-full"
                  >
                    <ExternalLink className="h-5 w-5" />
                    Encomendar Agora
                  </a>
                )}

                 {restaurant.cta_whatsapp && (
                  <a
                     href={formatWhatsAppLink(restaurant.cta_whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-cta-whatsapp w-full"
                  >
                    <MessageCircle className="h-5 w-5" />
                    WhatsApp
                  </a>
                )}

                 {restaurant.cta_phone && (
                  <a
                     href={`tel:${restaurant.cta_phone}`}
                    className="btn-cta-secondary w-full"
                  >
                    <Phone className="h-5 w-5" />
                     {restaurant.cta_phone}
                  </a>
                )}

                 {restaurant.cta_app && (
                  <a
                     href={restaurant.cta_app}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-cta-secondary w-full"
                  >
                    <Smartphone className="h-5 w-5" />
                    App Própria
                  </a>
                )}

                <p className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
                  Ao clicar, serás redirecionado para o canal de pedido do restaurante.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RestaurantPage;
