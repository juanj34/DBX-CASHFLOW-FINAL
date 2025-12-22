import { useState, useMemo, useEffect } from "react";
import { Check, ChevronsUpDown, Search, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { COUNTRIES, CONTINENT_LABELS, getCountryByCode, type Country } from "@/data/countries";
import { useLanguage } from "@/contexts/LanguageContext";

interface CountrySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const CountrySelect = ({ value, onValueChange, placeholder, className, disabled }: CountrySelectProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();
  
  const selectedCountry = getCountryByCode(value);
  
  // Simulate initial loading for large list
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (COUNTRIES.length === 0) {
          setError(language === 'es' ? 'No hay países disponibles' : 'No countries available');
        }
        setIsLoading(false);
      } catch (e) {
        setError(language === 'es' ? 'Error al cargar países' : 'Failed to load countries');
        setIsLoading(false);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [language]);
  
  const groupedCountries = useMemo(() => {
    const groups: Record<string, Country[]> = {
      priority: [],
      middleeast: [],
      europe: [],
      americas: [],
      asia: [],
      africa: [],
      oceania: [],
    };
    
    COUNTRIES.forEach(country => {
      if (groups[country.continent]) {
        groups[country.continent].push(country);
      }
    });
    
    return groups;
  }, []);

  const handleSelect = (countryCode: string) => {
    onValueChange(countryCode);
    setOpen(false);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      try {
        if (COUNTRIES.length === 0) {
          setError(language === 'es' ? 'No hay países disponibles' : 'No countries available');
        }
        setIsLoading(false);
      } catch (e) {
        setError(language === 'es' ? 'Error al cargar países' : 'Failed to load countries');
        setIsLoading(false);
      }
    }, 100);
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
          ) : selectedCountry ? (
            <span className="flex items-center gap-2 truncate">
              <span>{selectedCountry.flag}</span>
              <span className="truncate">
                {language === 'es' ? selectedCountry.nameEs : selectedCountry.name}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder || (language === 'es' ? 'Seleccionar país...' : 'Select country...')}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 bg-[#1a1f2e] border-[#2a3142]" align="start">
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
                placeholder={language === 'es' ? 'Buscar país...' : 'Search country...'}
                className="h-10 bg-transparent text-white placeholder:text-gray-500 border-0 focus:ring-0"
              />
            </div>
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty className="py-4 text-center text-sm text-gray-400">
                {language === 'es' ? 'No se encontró país.' : 'No country found.'}
              </CommandEmpty>
              
              {Object.entries(groupedCountries).map(([continent, countries]) => {
                if (countries.length === 0) return null;
                
                const label = CONTINENT_LABELS[continent as keyof typeof CONTINENT_LABELS];
                
                return (
                  <CommandGroup 
                    key={continent} 
                    heading={language === 'es' ? label.es : label.en}
                    className="text-gray-400 [&_[cmdk-group-heading]]:text-gray-500 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
                  >
                    {countries.map((country) => (
                      <CommandItem
                        key={country.code}
                        value={`${country.name} ${country.nameEs} ${country.code}`}
                        onSelect={() => handleSelect(country.code)}
                        className="flex items-center gap-2 px-2 py-1.5 text-white cursor-pointer hover:bg-[#2a3142] data-[selected]:bg-[#2a3142] aria-selected:bg-[#2a3142]"
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            value === country.code ? "opacity-100 text-[#CCFF00]" : "opacity-0"
                          )}
                        />
                        <span className="text-base">{country.flag}</span>
                        <span className="truncate">
                          {language === 'es' ? country.nameEs : country.name}
                        </span>
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
