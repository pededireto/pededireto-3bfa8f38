import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, ArrowUpDown, Search } from "lucide-react";
import * as XLSX from "xlsx";

interface TopTermsTableProps {
  terms: { term: string; total: number }[];
  noResultPercent: number;
}

const PAGE_SIZE = 5;

const TopTermsTable = ({ terms, noResultPercent }: TopTermsTableProps) => {
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const sorted = [...terms].sort((a, b) => (sortAsc ? a.total - b.total : b.total - a.total));

  const filtered = search ? sorted.filter((t) => t.term.toLowerCase().includes(search.toLowerCase())) : sorted;

  const visible = showAll ? filtered : filtered.slice(0, PAGE_SIZE);
  const maxTotal = filtered[0]?.total ?? 1;

  const exportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(sorted.map((t) => ({ Termo: t.term, Pesquisas: t.total })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Top Termos");
    XLSX.writeFile(wb, "top-termos-pesquisa.xlsx");
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Termos de Pesquisa</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{noResultPercent}% sem resultados</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Pesquisa */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filtrar termos..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowAll(false);
                }}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary w-40"
              />
            </div>
            <Button variant="outline" size="sm" onClick={exportCSV} className="h-7 text-xs gap-1">
              <Download className="h-3 w-3" /> CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {search ? "Nenhum termo encontrado." : "Sem dados"}
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8 text-muted-foreground">#</TableHead>
                  <TableHead>Termo</TableHead>
                  <TableHead className="w-32">Volume</TableHead>
                  <TableHead className="text-right cursor-pointer w-24" onClick={() => setSortAsc(!sortAsc)}>
                    <span className="inline-flex items-center gap-1">
                      Pesquisas <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((t, i) => {
                  const pct = maxTotal > 0 ? (t.total / maxTotal) * 100 : 0;
                  return (
                    <TableRow key={t.term}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="text-sm font-medium">{t.term}</TableCell>
                      <TableCell>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden w-full">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">{t.total}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filtered.length > PAGE_SIZE && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="mt-3 w-full text-xs text-primary hover:underline"
              >
                {showAll ? "Ver menos" : `Ver mais (${filtered.length - PAGE_SIZE} termos restantes)`}
              </button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TopTermsTable;
