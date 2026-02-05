 import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 
 export interface Suggestion {
   id: string;
   city_name: string;
   email: string | null;
   message: string | null;
   created_at: string;
 }
 
 export interface SuggestionInput {
   city_name: string;
   email?: string | null;
   message?: string | null;
 }
 
 // Create suggestion (public)
 export const useCreateSuggestion = () => {
   return useMutation({
     mutationFn: async (suggestion: SuggestionInput) => {
       const { data, error } = await supabase
         .from("suggestions")
         .insert(suggestion)
         .select()
         .single();
       
       if (error) throw error;
       return data as Suggestion;
     },
   });
 };
 
 // Fetch all suggestions (admin only)
 export const useSuggestions = () => {
   return useQuery({
     queryKey: ["suggestions"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("suggestions")
         .select("*")
         .order("created_at", { ascending: false });
       
       if (error) throw error;
       return data as Suggestion[];
     },
   });
 };
 
 // Delete suggestion (admin only)
 export const useDeleteSuggestion = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from("suggestions")
         .delete()
         .eq("id", id);
       
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["suggestions"] });
     },
   });
 };