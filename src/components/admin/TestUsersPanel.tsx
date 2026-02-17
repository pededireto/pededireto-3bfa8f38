import { Bot, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const TestUsersPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bots = [], isLoading } = useQuery({
    queryKey: ["test-users"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("*")
        .like("email", "%@pededireto.test");
      if (error) throw error;
      return data || [];
    },
  });

  const recreate = useMutation({
    mutationFn: async () => {
      await (supabase as any).rpc("create_test_users");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-users"] });
      toast({ title: "BOTs recriados com sucesso" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao recriar BOTs", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Utilizadores de Teste (BOTs)</h2>
        </div>
        <Button onClick={() => recreate.mutate()} disabled={recreate.isPending}>
          <RefreshCw className={`w-4 h-4 ${recreate.isPending ? "animate-spin" : ""}`} />
          Recriar BOTs
        </Button>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Credenciais:</strong> test_user_[1-10]@pededireto.test | Password: TestPassword123!
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {bots.length} BOTs encontrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    A carregar...
                  </TableCell>
                </TableRow>
              ) : bots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Nenhum BOT encontrado. Clique "Recriar BOTs" para criar.
                  </TableCell>
                </TableRow>
              ) : (
                bots.map((bot: any) => (
                  <TableRow key={bot.id}>
                    <TableCell className="flex items-center gap-2">
                      {bot.full_name || bot.name || "—"}
                      <Badge variant="secondary" className="text-xs">BOT</Badge>
                    </TableCell>
                    <TableCell>{bot.email}</TableCell>
                    <TableCell>{bot.phone || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestUsersPanel;
