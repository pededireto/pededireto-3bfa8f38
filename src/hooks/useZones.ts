 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 
 export interface Zone {
   id: string;
   name: string;
   slug: string;
   is_active: boolean;
   created_at: string;
   updated_at: string;
 }
 
 export interface ZoneInput {
   name: string;
   slug: string;
   is_active?: boolean;
 }
 
 // Fetch all active zones (public)
 export const useZones = () => {
   return useQuery({
     queryKey: ["zones"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("zones")
         .select("*")
         .eq("is_active", true)
         .order("name");
       
       if (error) throw error;
       return data as Zone[];
     },
   });
 };
 
 // Fetch all zones (admin only)
 export const useAllZones = () => {
   return useQuery({
     queryKey: ["zones", "all"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("zones")
         .select("*")
         .order("name");
       
       if (error) throw error;
       return data as Zone[];
     },
   });
 };
 
 // Create zone
 export const useCreateZone = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: async (zone: ZoneInput) => {
       const { data, error } = await supabase
         .from("zones")
         .insert(zone)
         .select()
         .single();
       
       if (error) throw error;
       return data as Zone;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["zones"] });
     },
   });
 };
 
 // Update zone
 export const useUpdateZone = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: async ({ id, ...zone }: Partial<Zone> & { id: string }) => {
       const { data, error } = await supabase
         .from("zones")
         .update(zone)
         .eq("id", id)
         .select()
         .single();
       
       if (error) throw error;
       return data as Zone;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["zones"] });
     },
   });
 };
 
 // Delete zone
 export const useDeleteZone = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from("zones")
         .delete()
         .eq("id", id);
       
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["zones"] });
     },
   });
 };