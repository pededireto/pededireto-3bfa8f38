 import { useState, useMemo } from "react";
 import { Search, MapPin } from "lucide-react";
 import { Input } from "@/components/ui/input";
 import { Zone } from "@/hooks/useZones";
 import { cn } from "@/lib/utils";
 
 interface CitySearchProps {
   zones: Zone[];
   selectedZone: Zone | null;
   onSelectZone: (zone: Zone | null) => void;
   isLoading?: boolean;
 }
 
 const CitySearch = ({ zones, selectedZone, onSelectZone, isLoading }: CitySearchProps) => {
   const [searchTerm, setSearchTerm] = useState("");
   const [isFocused, setIsFocused] = useState(false);
 
   const filteredZones = useMemo(() => {
     if (!searchTerm.trim()) return zones;
     const term = searchTerm.toLowerCase();
     return zones.filter((zone) =>
       zone.name.toLowerCase().includes(term) ||
       zone.slug.toLowerCase().includes(term)
     );
   }, [zones, searchTerm]);
 
   const handleSelectZone = (zone: Zone) => {
     onSelectZone(zone);
     setSearchTerm("");
     setIsFocused(false);
   };
 
   const showDropdown = isFocused && (searchTerm.trim() || filteredZones.length > 0);
 
   return (
     <div className="relative w-full max-w-md mx-auto">
       {/* Search Input */}
       <div className="relative">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
         <Input
           type="text"
           placeholder="Pesquisar cidade..."
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
           onFocus={() => setIsFocused(true)}
           onBlur={() => setTimeout(() => setIsFocused(false), 200)}
           className="pl-12 pr-4 h-12 text-base rounded-xl border-2 border-border focus:border-primary transition-colors"
           disabled={isLoading}
         />
       </div>
 
       {/* Dropdown */}
       {showDropdown && (
         <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-lg border border-border overflow-hidden z-50">
           {filteredZones.length > 0 ? (
             <ul className="py-2 max-h-60 overflow-y-auto">
               {filteredZones.map((zone) => (
                 <li key={zone.id}>
                   <button
                     onClick={() => handleSelectZone(zone)}
                     className={cn(
                       "w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left",
                       selectedZone?.id === zone.id && "bg-primary/10"
                     )}
                   >
                     <MapPin className="h-4 w-4 text-primary shrink-0" />
                     <span className="font-medium text-foreground">{zone.name}</span>
                   </button>
                 </li>
               ))}
             </ul>
           ) : searchTerm.trim() ? (
             <div className="p-4 text-center text-muted-foreground">
               <p>Nenhuma cidade encontrada para "{searchTerm}"</p>
             </div>
           ) : null}
         </div>
       )}
 
       {/* Quick Select Chips */}
       {!isFocused && zones.length > 0 && (
         <div className="flex flex-wrap gap-2 mt-4 justify-center">
           {zones.slice(0, 5).map((zone) => (
             <button
               key={zone.id}
               onClick={() => handleSelectZone(zone)}
               className={cn(
                 "px-4 py-2 rounded-full text-sm font-medium transition-all",
                 selectedZone?.id === zone.id
                   ? "bg-primary text-primary-foreground shadow-md"
                   : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
               )}
             >
               {zone.name}
             </button>
           ))}
         </div>
       )}
     </div>
   );
 };
 
 export default CitySearch;