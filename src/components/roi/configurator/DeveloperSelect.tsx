import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus, Building2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";

interface Developer {
  id: string;
  name: string;
  logo_url: string | null;
}

interface DeveloperSelectProps {
  value: string | null;
  manualValue?: string;
  onValueChange: (id: string | null, name: string) => void;
  onManualMode: () => void;
  className?: string;
}

export const DeveloperSelect = ({
  value,
  manualValue,
  onValueChange,
  onManualMode,
  className,
}: DeveloperSelectProps) => {
  const [open, setOpen] = useState(false);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const fetchDevelopers = async () => {
      const { data, error } = await supabase
        .from('developers')
        .select('id, name, logo_url')
        .order('name');
      
      if (!error && data) {
        setDevelopers(data);
      }
      setLoading(false);
    };
    
    fetchDevelopers();
  }, []);

  const selectedDeveloper = developers.find(d => d.id === value);
  const displayValue = selectedDeveloper?.name || manualValue || "";
  const isManualEntry = !value && !!manualValue;
  
  // Check if there's a matching developer for the current search
  const hasExactMatch = developers.some(d => 
    d.name.toLowerCase() === searchValue.toLowerCase()
  );
  
  const handleCreateNew = () => {
    if (searchValue.trim()) {
      onValueChange(null, searchValue.trim());
      setOpen(false);
      setSearchValue('');
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange(null, '');
  };

  return (
    <div className="relative flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between bg-theme-bg border-theme-border text-theme-text hover:bg-theme-card hover:text-theme-text",
              !displayValue && "text-theme-text-muted",
              isManualEntry && "border-theme-accent/30",
              className
            )}
          >
            <div className="flex items-center gap-2 truncate">
              {selectedDeveloper?.logo_url ? (
                <img 
                  src={selectedDeveloper.logo_url} 
                  alt="" 
                  className="w-5 h-5 rounded object-cover"
                />
              ) : (
                <Building2 className="w-4 h-4 text-theme-text-muted" />
              )}
              <span className="truncate">
                {displayValue || "Select developer..."}
              </span>
              {isManualEntry && (
                <span className="text-[10px] text-theme-accent bg-theme-accent/10 px-1.5 py-0.5 rounded">
                  Manual
                </span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 bg-theme-card border-theme-border">
          <Command className="bg-transparent">
            <CommandInput 
              placeholder="Search or type new..." 
              className="text-theme-text" 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty className="text-theme-text-muted py-3 text-center">
                {loading ? "Loading..." : (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-sm">No developer found</span>
                    {searchValue.trim() && (
                      <Button 
                        size="sm" 
                        onClick={handleCreateNew}
                        className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Create "{searchValue}"
                      </Button>
                    )}
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {developers.map((developer) => (
                  <CommandItem
                    key={developer.id}
                    value={developer.name}
                    onSelect={() => {
                      onValueChange(developer.id, developer.name);
                      setOpen(false);
                      setSearchValue('');
                    }}
                    className="text-theme-text hover:bg-theme-border cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {developer.logo_url ? (
                        <img 
                          src={developer.logo_url} 
                          alt="" 
                          className="w-6 h-6 rounded object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded bg-theme-border flex items-center justify-center">
                          <Building2 className="w-3 h-3 text-theme-text-muted" />
                        </div>
                      )}
                      <span>{developer.name}</span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === developer.id ? "opacity-100 text-theme-accent" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              {/* Show create option when typing something not in list */}
              {searchValue.trim() && !hasExactMatch && (
                <>
                  <CommandSeparator className="bg-theme-border" />
                  <CommandGroup>
                    <CommandItem
                      onSelect={handleCreateNew}
                      className="text-theme-accent hover:bg-theme-border cursor-pointer"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create "{searchValue}"
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Clear button for manual entries or selected values */}
      {displayValue && (
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-theme-text-muted hover:text-theme-text hover:bg-theme-border"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
