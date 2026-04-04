import { useState } from "react";
import { Briefcase, Loader2, Eye, Users, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminJobOffers, useUpdateJobOffer } from "@/hooks/useJobOffers";
import { differenceInDays } from "date-fns";

const JobOffersAdminContent = () => {
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data, isLoading } = useAdminJobOffers({
    city: cityFilter || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const updateMut = useUpdateJobOffer();

  const offers = data?.offers || [];
  const now = new Date();
  const activeCount = offers.filter((o) => o.is_active && new Date(o.expires_at) > now).length;
  const expiredCount = offers.filter((o) => new Date(o.expires_at) <= now).length;
  const totalApps = offers.reduce((s, o) => s + (o.applications_count || 0), 0);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Briefcase className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold">Ofertas de Emprego</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold">{offers.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          <p className="text-xs text-muted-foreground">Activas</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-orange-600">{expiredCount}</p>
          <p className="text-xs text-muted-foreground">Expiradas</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalApps}</p>
          <p className="text-xs text-muted-foreground">Candidaturas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Input placeholder="Filtrar por cidade..." value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="max-w-xs" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="expired">Expiradas</SelectItem>
            <SelectItem value="inactive">Desactivadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Negócio</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Candidatos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sem ofertas.</TableCell>
              </TableRow>
            ) : (
              offers.map((o) => {
                const isExpired = new Date(o.expires_at) <= now;
                const daysLeft = differenceInDays(new Date(o.expires_at), now);
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.title}</TableCell>
                    <TableCell className="text-sm">{o.businesses?.name}</TableCell>
                    <TableCell>{o.city}</TableCell>
                    <TableCell><span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{o.views_count}</span></TableCell>
                    <TableCell><span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{o.applications_count}</span></TableCell>
                    <TableCell>
                      {!o.is_active ? (
                        <Badge variant="secondary">Desactivada</Badge>
                      ) : isExpired ? (
                        <Badge variant="outline" className="text-orange-600">Expirada</Badge>
                      ) : (
                        <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30">{daysLeft}d restantes</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {o.is_active && (
                        <Button size="sm" variant="outline" onClick={() => updateMut.mutate({ id: o.id, is_active: false } as any)}>
                          <Ban className="h-4 w-4 mr-1" /> Desactivar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default JobOffersAdminContent;
