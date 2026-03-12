import { useState, createContext, useContext } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStudioAccess, StudioBusiness } from "@/hooks/useStudioAccess";
import { Loader2 } from "lucide-react";
import StudioSidebar from "@/components/studio/StudioSidebar";
import StudioTopbar from "@/components/studio/StudioTopbar";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Building2 } from "lucide-react";

// Context for selected business
interface StudioContextValue {
  selectedBusiness: StudioBusiness | null;
  setSelectedBusinessId: (id: string) => void;
  isAdmin: boolean;
}

const StudioContext = createContext<StudioContextValue>({
  selectedBusiness: null,
  setSelectedBusinessId: () => {},
  isAdmin: false,
});

export const useStudioContext = () => useContext(StudioContext);

const StudioLayout = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { businesses, isAdmin, isLoading: accessLoading } = useStudioAccess();
  const [selectedId, setSelectedId] = useState<string>("");
  const [search, setSearch] = useState("");

  if (authLoading || accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  // Auto-select first business if only one
  const effectiveId = selectedId || (businesses.length === 1 ? businesses[0].id : "");
  const selectedBusiness = businesses.find((b) => b.id === effectiveId) || null;

  const filteredBusinesses = search
    ? businesses.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
    : businesses;

  return (
    <StudioContext.Provider value={{ selectedBusiness, setSelectedBusinessId: setSelectedId, isAdmin }}>
      <div className="min-h-screen flex bg-background">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed lg:sticky top-0 left-0 z-50 h-screen w-[260px] flex-shrink-0 transition-transform duration-300 lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <StudioSidebar onClose={() => setSidebarOpen(false)} selectedBusinessId={effectiveId} />
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          <StudioTopbar onMenuClick={() => setSidebarOpen(true)} />

          {/* Business Selector Bar */}
          {businesses.length > 0 && (
            <div className="border-b border-border bg-card px-4 lg:px-6 py-3">
              <div className="flex items-center gap-3 max-w-[1400px]">
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                {businesses.length <= 5 ? (
                  <Select value={effectiveId} onValueChange={setSelectedId}>
                    <SelectTrigger className="w-full max-w-sm">
                      <SelectValue placeholder="Seleccionar negócio..." />
                    </SelectTrigger>
                    <SelectContent>
                      {businesses.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name} {b.city ? `· ${b.city}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar negócio..."
                      value={search || (selectedBusiness?.name || "")}
                      onChange={(e) => setSearch(e.target.value)}
                      onFocus={() => setSearch("")}
                      className="pl-9"
                    />
                    {search && (
                      <div className="absolute top-full left-0 right-0 mt-1 border border-border rounded-lg max-h-48 overflow-auto bg-popover z-10 shadow-lg">
                        {filteredBusinesses.slice(0, 15).map((b) => (
                          <button
                            key={b.id}
                            onClick={() => { setSelectedId(b.id); setSearch(""); }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                          >
                            {b.name} <span className="text-muted-foreground">· {b.city}</span>
                          </button>
                        ))}
                        {filteredBusinesses.length === 0 && (
                          <p className="px-3 py-2 text-sm text-muted-foreground">Sem resultados</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {isAdmin && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded flex-shrink-0">
                    Admin · todos os negócios
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-auto p-4 lg:p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </StudioContext.Provider>
  );
};

export default StudioLayout;
