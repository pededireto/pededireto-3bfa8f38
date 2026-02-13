import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, ArrowUpDown } from "lucide-react";
import * as XLSX from "xlsx";

interface TopTermsTableProps {
  terms: { term: string; total: number }[];
  noResultPercent: number;
}

const TopTermsTable = ({ terms, noResultPercent }: TopTermsTableProps) => {
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = [...terms].sort((a, b) => sortAsc ? a.total - b.total : b.total - a.total);

  const exportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(sorted.map((t) => ({ Termo: t.term, Pesquisas: t.total })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Top Termos");
    XLSX.writeFile(wb, "top-termos-pesquisa.xlsx");
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground">Top Termos de Pesquisa</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{noResultPercent}% sem resultados</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} className="h-7 text-xs gap-1">
          <Download className="h-3 w-3" /> CSV
        </Button>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Sem dados</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Termo</TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => setSortAsc(!sortAsc)}>
                  <span className="inline-flex items-center gap-1">
                    Pesquisas <ArrowUpDown className="h-3 w-3" />
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((t) => (
                <TableRow key={t.term}>
                  <TableCell className="text-sm">{t.term}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{t.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default TopTermsTable;
