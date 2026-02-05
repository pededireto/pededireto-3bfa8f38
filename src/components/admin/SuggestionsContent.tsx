 import { Trash2 } from "lucide-react";
 import { Suggestion, useDeleteSuggestion } from "@/hooks/useSuggestions";
 import { Button } from "@/components/ui/button";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { useToast } from "@/hooks/use-toast";
 import { format } from "date-fns";
 import { pt } from "date-fns/locale";
 
 interface SuggestionsContentProps {
   suggestions: Suggestion[];
 }
 
 const SuggestionsContent = ({ suggestions }: SuggestionsContentProps) => {
   const deleteSuggestion = useDeleteSuggestion();
   const { toast } = useToast();
 
   const handleDelete = async (id: string) => {
     if (!confirm("Tens a certeza que queres eliminar esta sugestão?")) return;
     
     try {
       await deleteSuggestion.mutateAsync(id);
       toast({ title: "Sugestão eliminada" });
     } catch {
       toast({ title: "Erro ao eliminar", variant: "destructive" });
     }
   };
 
   return (
     <div className="space-y-6">
       <div>
         <h1 className="text-2xl md:text-3xl font-bold text-foreground">Sugestões</h1>
         <p className="text-muted-foreground">Sugestões de cidades enviadas pelos utilizadores</p>
       </div>
 
       <div className="bg-card rounded-xl shadow-card overflow-hidden">
         <div className="overflow-x-auto">
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Cidade</TableHead>
                 <TableHead>Email</TableHead>
                 <TableHead>Mensagem</TableHead>
                 <TableHead>Data</TableHead>
                 <TableHead className="text-right">Ações</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {suggestions.map((suggestion) => (
                 <TableRow key={suggestion.id}>
                   <TableCell className="font-medium">{suggestion.city_name}</TableCell>
                   <TableCell>{suggestion.email || "-"}</TableCell>
                   <TableCell className="max-w-xs truncate">{suggestion.message || "-"}</TableCell>
                   <TableCell>
                     {format(new Date(suggestion.created_at), "dd MMM yyyy, HH:mm", { locale: pt })}
                   </TableCell>
                   <TableCell className="text-right">
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="text-destructive"
                       onClick={() => handleDelete(suggestion.id)}
                       disabled={deleteSuggestion.isPending}
                     >
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </TableCell>
                 </TableRow>
               ))}
               {suggestions.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                     Nenhuma sugestão recebida ainda.
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
 
 export default SuggestionsContent;