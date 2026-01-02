import { useState, useMemo, useEffect } from "react";
import { Check, ChevronsUpDown, Search, Loader2, AlertCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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

// Format zone name properly (not all caps)
const formatZoneName = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
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
  
  // Sort zones alphabetically
  const sortedZones = useMemo(() => {
    return [...zones].sort((a, b) => a.name.localeCompare(b.name));
  }, [zones]);

  const handleSelect = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    onValueChange(zoneId, zone);
    setOpen(false);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
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
              <MapPin className="h-4 w-4 text-theme-accent" />
              <span className="truncate">{formatZoneName(selectedZone.name)}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              {placeholder || (language === 'es' ? 'Seleccionar zona...' : 'Select zone...')}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 bg-theme-card border-theme-border z-50" align="start">
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
            <div className="flex items-center border-b border-theme-border px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 text-theme-text-muted" />
              <CommandInput 
                placeholder={language === 'es' ? 'Buscar zona...' : 'Search zone...'}
                className="h-10 bg-transparent text-theme-text placeholder:text-theme-text-muted border-0 focus:ring-0"
              />
            </div>
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty className="py-4 text-center text-sm text-theme-text-muted">
                {language === 'es' ? 'No se encontró zona.' : 'No zone found.'}
              </CommandEmpty>
              
              {sortedZones.map((zone) => (
                <CommandItem
                  key={zone.id}
                  value={zone.name}
                  onSelect={() => handleSelect(zone.id)}
                  className="flex items-center gap-2 px-3 py-2 text-theme-text cursor-pointer hover:bg-theme-border data-[selected]:bg-theme-border aria-selected:bg-theme-border"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      value === zone.id ? "opacity-100 text-[#CCFF00]" : "opacity-0"
                    )}
                  />
                  <MapPin className="h-3.5 w-3.5 text-theme-text-muted" />
                  <span className="flex-1 truncate">{formatZoneName(zone.name)}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
};