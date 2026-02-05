 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 
 export interface Restaurant {
   id: string;
   zone_id: string;
   name: string;
   slug: string;
   logo_url: string | null;
   images: string[];
   category: string;
   description: string | null;
   schedule_weekdays: string | null;
   schedule_weekend: string | null;
   delivery_zones: string[];
   cta_website: string | null;
   cta_whatsapp: string | null;
   cta_phone: string | null;
   cta_app: string | null;
   is_featured: boolean;
   is_active: boolean;
   display_order: number;
   created_at: string;
   updated_at: string;
   // Joined data
   zones?: {
     id: string;
     name: string;
     slug: string;
   };
 }
 
 export interface RestaurantInput {
   zone_id: string;
   name: string;
   slug: string;
   logo_url?: string | null;
   images?: string[];
   category: string;
   description?: string | null;
   schedule_weekdays?: string | null;
   schedule_weekend?: string | null;
   delivery_zones?: string[];
   cta_website?: string | null;
   cta_whatsapp?: string | null;
   cta_phone?: string | null;
   cta_app?: string | null;
   is_featured?: boolean;
   is_active?: boolean;
   display_order?: number;
 }
 
 // Fetch restaurants by zone (public, only active)
 export const useRestaurants = (zoneId?: string) => {
   return useQuery({
     queryKey: ["restaurants", zoneId],
     queryFn: async () => {
       let query = supabase
         .from("restaurants")
         .select("*, zones(id, name, slug)")
         .eq("is_active", true)
         .order("display_order");
       
       if (zoneId) {
         query = query.eq("zone_id", zoneId);
       }
       
       const { data, error } = await query;
       if (error) throw error;
       return data as Restaurant[];
     },
     enabled: !!zoneId || zoneId === undefined,
   });
 };
 
 // Fetch featured restaurants
 export const useFeaturedRestaurants = (zoneId?: string) => {
   return useQuery({
     queryKey: ["restaurants", "featured", zoneId],
     queryFn: async () => {
       let query = supabase
         .from("restaurants")
         .select("*, zones(id, name, slug)")
         .eq("is_active", true)
         .eq("is_featured", true)
         .order("display_order");
       
       if (zoneId) {
         query = query.eq("zone_id", zoneId);
       }
       
       const { data, error } = await query;
       if (error) throw error;
       return data as Restaurant[];
     },
   });
 };
 
 // Fetch single restaurant by slug
 export const useRestaurant = (slug: string) => {
   return useQuery({
     queryKey: ["restaurant", slug],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("restaurants")
         .select("*, zones(id, name, slug)")
         .eq("slug", slug)
         .eq("is_active", true)
         .single();
       
       if (error) throw error;
       return data as Restaurant;
     },
     enabled: !!slug,
   });
 };
 
 // Fetch all restaurants (admin only)
 export const useAllRestaurants = () => {
   return useQuery({
     queryKey: ["restaurants", "all"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("restaurants")
         .select("*, zones(id, name, slug)")
         .order("display_order");
       
       if (error) throw error;
       return data as Restaurant[];
     },
   });
 };
 
 // Create restaurant
 export const useCreateRestaurant = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: async (restaurant: RestaurantInput) => {
       const { data, error } = await supabase
         .from("restaurants")
         .insert(restaurant)
         .select("*, zones(id, name, slug)")
         .single();
       
       if (error) throw error;
       return data as Restaurant;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["restaurants"] });
     },
   });
 };
 
 // Update restaurant
 export const useUpdateRestaurant = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: async ({ id, ...restaurant }: Partial<Restaurant> & { id: string }) => {
       // Remove joined data before update
       const { zones, ...updateData } = restaurant as any;
       
       const { data, error } = await supabase
         .from("restaurants")
         .update(updateData)
         .eq("id", id)
         .select("*, zones(id, name, slug)")
         .single();
       
       if (error) throw error;
       return data as Restaurant;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["restaurants"] });
     },
   });
 };
 
 // Delete restaurant
 export const useDeleteRestaurant = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from("restaurants")
         .delete()
         .eq("id", id);
       
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["restaurants"] });
     },
   });
 };