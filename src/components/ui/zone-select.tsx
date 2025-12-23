import { useState, useMemo, useEffect } from "react";
import { Check, ChevronsUpDown, Search, Loader2, AlertCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface Zone {
  id: string;
  name: string;
  maturity_level: number | null;
  maturity_label: string | null;
}

interface ZoneSelectProps {
  value: string;
  onValueChange: (value: string, zone?: Zone) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// Maturity group definitions
const MATURITY_GROUPS = {
  emerging: { 
    min: 0, max: 25, 
    icon: "🟠", 
    labelEn: "★ Emerging", 
    labelEs: "★ Emergente",
    descEn: "High potential, higher risk",
    descEs: "Alto potencial, mayor riesgo"
  },
  developing: { 
    min: 26, max: 50, 
    icon: "🟡", 
    labelEn: "📈 Developing", 
    labelEs: "📈 En Desarrollo",
    descEn: "Good growth potential",
    descEs: "Buen potencial de crecimiento"
  },
  growing: { 
    min: 51, max: 75, 
    icon: "🟢", 
    labelEn: "🌱 Growing", 
    labelEs: "🌱 Crecimiento",
    descEn: "Balanced growth/stability",
    descEs: "Equilibrio crecimiento/estabilidad"
  },
  mature: { 
    min: 76, max: 90, 
    icon: "🔵", 
    labelEn: "🏢 Mature", 
    labelEs: "🏢 Maduro",
    descEn: "Stable, moderate growth",
    descEs: "Estable, crecimiento moderado"
  },
  established: { 
    min: 91, max: 100, 
    icon: "⚪", 
    labelEn: "🏛️ Established", 
    labelEs: "🏛️ Establecido",
    descEn: "Lowest risk, lower returns",
    descEs: "Menor riesgo, menores retornos"
  },
};

const getMaturityGroup = (level: number | null) => {
  if (level === null) return null;
  if (level <= 25) return "emerging";
  if (level <= 50) return "developing";
  if (level <= 75) return "growing";
  if (level <= 90) return "mature";
  return "established";
};

const getMaturityColor = (level: number | null) => {
  if (level === null) return "text-gray-400";
  if (level <= 25) return "text-orange-400";
  if (level <= 50) return "text-yellow-400";
  if (level <= 75) return "text-green-400";
  if (level <= 90) return "text-blue-400";
  return "text-gray-300";
};

export const ZoneSelect = ({ value, onValueChange, placeholder, className, disabled }: ZoneSelectProps) => {
  const [open, setOpen] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();
  
  // Fetch zones from database
  useEffect(() => {
    const fetchZones = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('zones')
          .select('id, name, maturity_level, maturity_label')
          .not('maturity_level', 'is', null)
          .order('name');
        
        if (fetchError) throw fetchError;
        
        if (data && data.length > 0) {
          setZones(data);
        } else {
          setError(language === 'es' ? 'No hay zonas disponibles' : 'No zones available');
        }
      } catch (e) {
        console.error("Error fetching zones:", e);
        setError(language === 'es' ? 'Error al cargar zonas' : 'Failed to load zones');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchZones();
  }, [language]);
  
  const selectedZone = useMemo(() => zones.find(z => z.id === value), [zones, value]);
  
  // Group zones by maturity level
  const groupedZones = useMemo(() => {
    const groups: Record<string, Zone[]> = {
      emerging: [],
      developing: [],
      growing: [],
      mature: [],
      established: [],
    };
    
    zones.forEach(zone => {
      const group = getMaturityGroup(zone.maturity_level);
      if (group && groups[group]) {
        groups[group].push(zone);
      }
    });
    
    // Sort each group by name
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return groups;
  }, [zones]);

  const handleSelect = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    onValueChange(zoneId, zone);
    setOpen(false);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    // Re-fetch will happen via useEffect
    setZones([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outlineDark"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn("justify-between h-9 font-normal", className)}
        >
          {isLoading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{language === 'es' ? 'Cargando...' : 'Loading...'}</span>
            </span>
          ) : error ? (
            <span className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span>{language === 'es' ? 'Error' : 'Error'}</span>
            </span>
          ) : selectedZone ? (
            <span className="flex items-center gap-2 truncate">
              <MapPin className={cn("h-4 w-4", getMaturityColor(selectedZone.maturity_level))} />
              <span className="truncate">{selectedZone.name}</span>
              {selectedZone.maturity_level !== null && (
                <span className={cn("text-xs", getMaturityColor(selectedZone.maturity_level))}>
                  {selectedZone.maturity_level}%
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {placeholder || (language === 'es' ? 'Seleccionar zona...' : 'Select zone...')}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 bg-[#1a1f2e] border-[#2a3142]" align="start">
        {error ? (
          <div className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-400 mb-3">{error}</p>
            <Button
              variant="outlineDark"
              size="sm"
              onClick={handleRetry}
              className="gap-2"
            >
              {language === 'es' ? 'Reintentar' : 'Retry'}
            </Button>
          </div>
        ) : (
          <Command className="bg-transparent">
            <div className="flex items-center border-b border-[#2a3142] px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
              <CommandInput 
                placeholder={language === 'es' ? 'Buscar zona...' : 'Search zone...'}
                className="h-10 bg-transparent text-white placeholder:text-gray-500 border-0 focus:ring-0"
              />
            </div>
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty className="py-4 text-center text-sm text-gray-400">
                {language === 'es' ? 'No se encontró zona.' : 'No zone found.'}
              </CommandEmpty>
              
              {Object.entries(groupedZones).map(([groupKey, zonesInGroup]) => {
                if (zonesInGroup.length === 0) return null;
                
                const group = MATURITY_GROUPS[groupKey as keyof typeof MATURITY_GROUPS];
                
                return (
                  <CommandGroup 
                    key={groupKey} 
                    heading={
                      <div className="flex items-center justify-between">
                        <span>{language === 'es' ? group.labelEs : group.labelEn}</span>
                        <span className="text-xs text-gray-500">
                          {language === 'es' ? group.descEs : group.descEn}
                        </span>
                      </div>
                    }
                    className="text-gray-400 [&_[cmdk-group-heading]]:text-gray-500 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
                  >
                    {zonesInGroup.map((zone) => (
                      <CommandItem
                        key={zone.id}
                        value={`${zone.name} ${zone.maturity_label || ''}`}
                        onSelect={() => handleSelect(zone.id)}
                        className="flex items-center gap-2 px-2 py-1.5 text-white cursor-pointer hover:bg-[#2a3142] data-[selected]:bg-[#2a3142] aria-selected:bg-[#2a3142]"
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            value === zone.id ? "opacity-100 text-[#CCFF00]" : "opacity-0"
                          )}
                        />
                        <span className="text-base">{group.icon}</span>
                        <span className="flex-1 truncate">{zone.name}</span>
                        {zone.maturity_level !== null && (
                          <span className={cn("text-xs font-mono", getMaturityColor(zone.maturity_level))}>
                            {zone.maturity_level}%
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
};
