import { useState } from "react";
import { Bot, RefreshCw, Play, Eye, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type BotAction = "views" | "clicks" | "reviews";

export const TestUsersPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedActions, setSelectedActions] = useState<BotAction[]>([]);
  const [reviewRating, setReviewRating] = useState(4);
  const [reviewCount, setReviewCount] = useState(1);
  const [viewCount, setViewCount] = useState(3);
  const [clickCount, setClickCount] = useState(2);

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

  const simulate = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("simulate-bot-activity", {
        body: {
          actions: selectedActions,
          reviewRating,
          reviewCount,
          viewCount,
          clickCount,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      const r = data.results;
      const parts: string[] = [];
      if (r.views > 0) parts.push(`${r.views} views`);
      if (r.clicks > 0) parts.push(`${r.clicks} clicks`);
      if (r.reviews > 0) parts.push(`${r.reviews} reviews`);
      toast({ title: "Simulação concluída", description: parts.join(", ") || "Nenhuma ação executada" });
    },
    onError: (error: any) => {
      toast({ title: "Erro na simulação", description: error.message, variant: "destructive" });
    },
  });

  const toggleAction = (action: BotAction) => {
    setSelectedActions((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Utilizadores de Teste (BOTs)</h2>
        </div>
        <Button variant="outline" onClick={() => recreate.mutate()} disabled={recreate.isPending}>
          <RefreshCw className={`w-4 h-4 ${recreate.isPending ? "animate-spin" : ""}`} />
          Recriar BOTs
        </Button>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Credenciais:</strong> test_user_[1-10]@pededireto.test | Password: TestPassword123!
        </AlertDescription>
      </Alert>

      {/* Simulation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Play className="w-5 h-5" />
            Simular Actividade dos BOTs
          </CardTitle>
          <CardDescription>
            Seleciona as ações que os {bots.length} BOTs devem executar em negócios activos aleatórios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Action checkboxes */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Views */}
            <Card className={`cursor-pointer transition-colors ${selectedActions.includes("views") ? "border-primary bg-primary/5" : ""}`}
              onClick={() => toggleAction("views")}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedActions.includes("views")}
                    onCheckedChange={() => toggleAction("views")}
                  />
                  <Eye className="w-4 h-4 text-blue-500" />
                  <Label className="font-medium cursor-pointer">Gerar Views</Label>
                </div>
                {selectedActions.includes("views") && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Views por BOT</Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={viewCount}
                      onChange={(e) => setViewCount(Number(e.target.value) || 1)}
                      className="h-8"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Clicks */}
            <Card className={`cursor-pointer transition-colors ${selectedActions.includes("clicks") ? "border-primary bg-primary/5" : ""}`}
              onClick={() => toggleAction("clicks")}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedActions.includes("clicks")}
                    onCheckedChange={() => toggleAction("clicks")}
                  />
                  <Phone className="w-4 h-4 text-green-500" />
                  <Label className="font-medium cursor-pointer">Gerar Clicks</Label>
                </div>
                {selectedActions.includes("clicks") && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Clicks por BOT</Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={clickCount}
                      onChange={(e) => setClickCount(Number(e.target.value) || 1)}
                      className="h-8"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card className={`cursor-pointer transition-colors ${selectedActions.includes("reviews") ? "border-primary bg-primary/5" : ""}`}
              onClick={() => toggleAction("reviews")}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedActions.includes("reviews")}
                    onCheckedChange={() => toggleAction("reviews")}
                  />
                  <Star className="w-4 h-4 text-yellow-500" />
                  <Label className="font-medium cursor-pointer">Criar Reviews</Label>
                </div>
                {selectedActions.includes("reviews") && (
                  <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Estrelas</Label>
                      <Select value={String(reviewRating)} onValueChange={(v) => setReviewRating(Number(v))}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {"★".repeat(n)}{"☆".repeat(5 - n)} ({n})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Reviews por BOT</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={reviewCount}
                        onChange={(e) => setReviewCount(Number(e.target.value) || 1)}
                        className="h-8"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Summary & Execute */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedActions.length === 0 ? (
                "Seleciona pelo menos uma ação"
              ) : (
                <>
                  <strong>{bots.length} BOTs</strong> vão executar:{" "}
                  {selectedActions.includes("views") && <Badge variant="secondary" className="mr-1">{viewCount * bots.length} views</Badge>}
                  {selectedActions.includes("clicks") && <Badge variant="secondary" className="mr-1">{clickCount * bots.length} clicks</Badge>}
                  {selectedActions.includes("reviews") && (
                    <Badge variant="secondary">
                      {reviewCount * bots.length} reviews ({reviewRating}★)
                    </Badge>
                  )}
                </>
              )}
            </div>
            <Button
              onClick={() => simulate.mutate()}
              disabled={simulate.isPending || selectedActions.length === 0 || bots.length === 0}
            >
              {simulate.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Executar Simulação
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bot list */}
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
