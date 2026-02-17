import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Search, Eye } from "lucide-react";
import { TicketStatusBadge, TicketPriorityBadge, CATEGORY_LABELS } from "./TicketStatusBadge";
import TicketDetailModal from "./TicketDetailModal";
import CreateTicketDialog from "./CreateTicketDialog";
import { useTickets } from "@/hooks/useTickets";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

interface TicketsTableProps {
  department?: string;
  showAll?: boolean;
  allowedCreateDepartments?: string[];
  creatorRole?: string;
}

const TicketsTable = ({
  department,
  showAll = false,
  allowedCreateDepartments = ["cs", "commercial", "onboarding", "it_admin"],
  creatorRole = "cs",
}: TicketsTableProps) => {
  const { data: tickets = [], isPending } = useTickets(department, showAll);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [page, setPage] = useState(0);
  const perPage = 20;

  const filtered = useMemo(() => {
    return tickets.filter((t: any) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (deptFilter !== "all" && t.assigned_to_department !== deptFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return t.title?.toLowerCase().includes(s) || t.description?.toLowerCase().includes(s);
      }
      return true;
    });
  }, [tickets, search, statusFilter, priorityFilter, categoryFilter, deptFilter]);

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  if (isPending) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar tickets..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="open">Aberto</SelectItem>
            <SelectItem value="assigned">Atribuído</SelectItem>
            <SelectItem value="in_progress">Em Progresso</SelectItem>
            <SelectItem value="waiting_response">Aguardando</SelectItem>
            <SelectItem value="resolved">Resolvido</SelectItem>
            <SelectItem value="closed">Fechado</SelectItem>
            <SelectItem value="escalated">Escalado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(0); }}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
        {showAll && (
          <Select value={deptFilter} onValueChange={(v) => { setDeptFilter(v); setPage(0); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Departamento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Depts</SelectItem>
              <SelectItem value="cs">CS</SelectItem>
              <SelectItem value="commercial">Comercial</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="it_admin">IT / Admin</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Button onClick={() => setCreateOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
          <Plus className="h-4 w-4 mr-1" /> Novo Ticket
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Título</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Negócio</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Prioridade</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Categoria</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Criado</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((t: any) => (
              <tr key={t.id} className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelectedTicket(t)}>
                <td className="p-3">
                  <p className="text-sm font-medium truncate max-w-[250px]">{t.title}</p>
                </td>
                <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">{t.businesses?.name || "—"}</td>
                <td className="p-3"><TicketStatusBadge status={t.status} /></td>
                <td className="p-3"><TicketPriorityBadge priority={t.priority} /></td>
                <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">{CATEGORY_LABELS[t.category] || t.category}</td>
                <td className="p-3 text-xs text-muted-foreground hidden lg:table-cell">
                  {formatDistanceToNow(new Date(t.created_at), { addSuffix: true, locale: pt })}
                </td>
                <td className="p-3">
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedTicket(t); }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {paged.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">Nenhum ticket encontrado.</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtered.length} tickets</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button>
            <span className="flex items-center px-2">{page + 1} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Seguinte</Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <TicketDetailModal ticket={selectedTicket} open={!!selectedTicket} onOpenChange={(v) => !v && setSelectedTicket(null)} userRole={creatorRole} />
      <CreateTicketDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultDepartment={department || "cs"}
        allowedDepartments={allowedCreateDepartments}
        creatorRole={creatorRole}
      />
    </div>
  );
};

export default TicketsTable;
