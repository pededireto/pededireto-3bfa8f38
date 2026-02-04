// Mock data for Pede Direto MVP

export interface Zone {
  id: string;
  name: string;
  slug: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo: string;
  images: string[];
  category: string;
  description: string;
  zoneId: string;
  zoneName: string;
  schedule: {
    weekdays: string;
    weekend: string;
  };
  deliveryZones: string[];
  cta: {
    website?: string;
    whatsapp?: string;
    phone?: string;
    app?: string;
  };
  isFeatured: boolean;
  order: number;
}

export const zones: Zone[] = [
  { id: "1", name: "Porto", slug: "porto" },
  { id: "2", name: "Lisboa", slug: "lisboa" },
  { id: "3", name: "Setúbal", slug: "setubal" },
  { id: "4", name: "Braga", slug: "braga" },
  { id: "5", name: "Coimbra", slug: "coimbra" },
];

export const categories = [
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

export const restaurants: Restaurant[] = [
  {
    id: "1",
    name: "Good Sushi",
    slug: "good-sushi",
    logo: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&h=200&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800",
      "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800",
    ],
    category: "Sushi",
    description: "O melhor sushi do Porto, feito com ingredientes frescos todos os dias. Especialidade em combinados e pratos quentes.",
    zoneId: "1",
    zoneName: "Porto",
    schedule: {
      weekdays: "12:00 - 15:00, 19:00 - 23:00",
      weekend: "12:00 - 23:00",
    },
    deliveryZones: ["Porto Centro", "Matosinhos", "Maia"],
    cta: {
      website: "https://goodsushi.pt",
      whatsapp: "351912345678",
      phone: "+351 22 123 4567",
    },
    isFeatured: true,
    order: 1,
  },
  {
    id: "2",
    name: "Bruto Burguer",
    slug: "bruto-burguer",
    logo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
      "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800",
    ],
    category: "Hambúrguer",
    description: "Hambúrgueres artesanais com carne de raças selecionadas. Pão brioche feito em casa.",
    zoneId: "1",
    zoneName: "Porto",
    schedule: {
      weekdays: "18:00 - 23:00",
      weekend: "12:00 - 23:00",
    },
    deliveryZones: ["Porto Centro", "Gaia", "Matosinhos"],
    cta: {
      website: "https://brutoburguer.pt",
      whatsapp: "351923456789",
    },
    isFeatured: true,
    order: 2,
  },
  {
    id: "3",
    name: "Nero Sushi & Pizzas",
    slug: "nero-sushi-pizzas",
    logo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&h=200&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
    ],
    category: "Pizza",
    description: "Fusão única de sushi e pizza italiana. Ingredientes premium importados.",
    zoneId: "1",
    zoneName: "Porto",
    schedule: {
      weekdays: "12:00 - 22:30",
      weekend: "12:00 - 23:00",
    },
    deliveryZones: ["Porto Centro", "Boavista", "Foz"],
    cta: {
      website: "https://nero.pt",
      phone: "+351 22 987 6543",
    },
    isFeatured: false,
    order: 5,
  },
  {
    id: "4",
    name: "Hambúrguer na Chapa",
    slug: "hamburguer-na-chapa",
    logo: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=200&h=200&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800",
    ],
    category: "Hambúrguer",
    description: "Hambúrgueres grelhados na chapa quente. Sabor autêntico de churrasco.",
    zoneId: "2",
    zoneName: "Lisboa",
    schedule: {
      weekdays: "12:00 - 22:00",
      weekend: "12:00 - 23:00",
    },
    deliveryZones: ["Lisboa Centro", "Almada", "Amadora"],
    cta: {
      whatsapp: "351934567890",
      phone: "+351 21 123 4567",
    },
    isFeatured: true,
    order: 1,
  },
  {
    id: "5",
    name: "Primu's Pizzeria",
    slug: "primus-pizzeria",
    logo: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=200&h=200&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
    ],
    category: "Pizza",
    description: "Pizza napolitana autêntica. Forno a lenha tradicional italiano.",
    zoneId: "2",
    zoneName: "Lisboa",
    schedule: {
      weekdays: "18:00 - 23:00",
      weekend: "12:00 - 23:30",
    },
    deliveryZones: ["Baixa", "Chiado", "Alfama"],
    cta: {
      website: "https://primuspizzeria.pt",
      whatsapp: "351945678901",
    },
    isFeatured: false,
    order: 3,
  },
  {
    id: "6",
    name: "Ateliê dos Sabores",
    slug: "atelie-dos-sabores",
    logo: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=200&h=200&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800",
    ],
    category: "Portuguesa",
    description: "Cozinha tradicional portuguesa reinventada. Ingredientes locais e sazonais.",
    zoneId: "3",
    zoneName: "Setúbal",
    schedule: {
      weekdays: "12:00 - 15:00, 19:00 - 22:00",
      weekend: "12:00 - 22:30",
    },
    deliveryZones: ["Setúbal Centro", "Azeitão"],
    cta: {
      website: "https://ateliedossabores.pt",
      phone: "+351 265 123 456",
    },
    isFeatured: true,
    order: 1,
  },
  {
    id: "7",
    name: "Cantinho da Nonô",
    slug: "cantinho-da-nono",
    logo: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&h=200&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
    ],
    category: "Brasileira",
    description: "Sabores autênticos do Brasil. Feijoada aos sábados, moqueca toda a semana.",
    zoneId: "2",
    zoneName: "Lisboa",
    schedule: {
      weekdays: "12:00 - 22:00",
      weekend: "12:00 - 23:00",
    },
    deliveryZones: ["Lisboa Centro", "Saldanha", "Marquês"],
    cta: {
      whatsapp: "351956789012",
    },
    isFeatured: false,
    order: 4,
  },
  {
    id: "8",
    name: "Wine & Sushi",
    slug: "wine-and-sushi",
    logo: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=200&h=200&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800",
    ],
    category: "Sushi",
    description: "Experiência de sushi premium com carta de vinhos selecionada.",
    zoneId: "4",
    zoneName: "Braga",
    schedule: {
      weekdays: "19:00 - 23:00",
      weekend: "12:00 - 23:00",
    },
    deliveryZones: ["Braga Centro", "Gualtar"],
    cta: {
      website: "https://wineandsushi.pt",
      phone: "+351 253 123 456",
    },
    isFeatured: true,
    order: 1,
  },
  {
    id: "9",
    name: "150 Gramas",
    slug: "150-gramas",
    logo: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=200&h=200&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800",
    ],
    category: "Hambúrguer",
    description: "Hambúrgueres de 150g de carne premium. Acompanhamentos artesanais.",
    zoneId: "1",
    zoneName: "Porto",
    schedule: {
      weekdays: "12:00 - 22:00",
      weekend: "12:00 - 23:00",
    },
    deliveryZones: ["Porto Centro", "Paranhos"],
    cta: {
      website: "https://150gramas.pt",
      whatsapp: "351967890123",
    },
    isFeatured: false,
    order: 6,
  },
  {
    id: "10",
    name: "Amapizza",
    slug: "amapizza",
    logo: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200&h=200&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800",
    ],
    category: "Pizza",
    description: "Pizzas artesanais com massa fermentada 48 horas. Ingredientes italianos autênticos.",
    zoneId: "3",
    zoneName: "Setúbal",
    schedule: {
      weekdays: "18:00 - 22:30",
      weekend: "12:00 - 23:00",
    },
    deliveryZones: ["Setúbal Centro", "Palmela"],
    cta: {
      whatsapp: "351978901234",
      phone: "+351 265 987 654",
    },
    isFeatured: false,
    order: 2,
  },
  {
    id: "11",
    name: "Churrasqueira Regional",
    slug: "churrasqueira-regional",
    logo: "https://images.unsplash.com/photo-1544025162-d76694265947?w=200&h=200&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
    ],
    category: "Churrasqueira",
    description: "Frango no churrasco, espetadas e grelhados tradicionais. Sabor caseiro desde 1985.",
    zoneId: "5",
    zoneName: "Coimbra",
    schedule: {
      weekdays: "11:00 - 22:00",
      weekend: "11:00 - 22:30",
    },
    deliveryZones: ["Coimbra Centro", "Santa Clara"],
    cta: {
      phone: "+351 239 123 456",
    },
    isFeatured: true,
    order: 1,
  },
  {
    id: "12",
    name: "O Teu Restaurante",
    slug: "o-teu-restaurante",
    logo: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
    ],
    category: "Portuguesa",
    description: "Comida portuguesa de conforto. Pratos do dia variados e sempre frescos.",
    zoneId: "1",
    zoneName: "Porto",
    schedule: {
      weekdays: "12:00 - 15:00, 19:00 - 22:00",
      weekend: "12:00 - 22:00",
    },
    deliveryZones: ["Porto Centro", "Campanhã"],
    cta: {
      website: "https://oteurestaurante.pt",
      whatsapp: "351989012345",
      phone: "+351 22 456 7890",
    },
    isFeatured: true,
    order: 3,
  },
];

export const getRestaurantsByZone = (zoneId: string): Restaurant[] => {
  return restaurants
    .filter((r) => r.zoneId === zoneId)
    .sort((a, b) => {
      // Featured restaurants first, then by order
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return a.order - b.order;
    });
};

export const getFeaturedRestaurants = (zoneId?: string): Restaurant[] => {
  return restaurants
    .filter((r) => r.isFeatured && (!zoneId || r.zoneId === zoneId))
    .sort((a, b) => a.order - b.order);
};

export const getRestaurantBySlug = (slug: string): Restaurant | undefined => {
  return restaurants.find((r) => r.slug === slug);
};

export const getZoneBySlug = (slug: string): Zone | undefined => {
  return zones.find((z) => z.slug === slug);
};
