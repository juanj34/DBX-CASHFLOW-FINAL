import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus, Building2 } from "lucide-react";
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-[#0d1117] border-[#2a3142] text-white hover:bg-[#1a1f2e] hover:text-white",
            !displayValue && "text-gray-500",
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
              <Building2 className="w-4 h-4 text-gray-500" />
            )}
            <span className="truncate">
              {displayValue || "Select developer..."}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-[#1a1f2e] border-[#2a3142]">
        <Command className="bg-transparent">
          <CommandInput placeholder="Search developers..." className="text-white" />
          <CommandList>
            <CommandEmpty className="text-gray-400 py-6 text-center">
              {loading ? "Loading..." : "No developer found."}
            </CommandEmpty>
            <CommandGroup>
              {developers.map((developer) => (
                <CommandItem
                  key={developer.id}
                  value={developer.name}
                  onSelect={() => {
                    onValueChange(developer.id, developer.name);
                    setOpen(false);
                  }}
                  className="text-gray-300 hover:bg-[#2a3142] cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-1">
                    {developer.logo_url ? (
                      <img 
                        src={developer.logo_url} 
                        alt="" 
                        className="w-6 h-6 rounded object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded bg-[#2a3142] flex items-center justify-center">
                        <Building2 className="w-3 h-3 text-gray-500" />
                      </div>
                    )}
                    <span>{developer.name}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === developer.id ? "opacity-100 text-[#CCFF00]" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator className="bg-[#2a3142]" />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onManualMode();
                  setOpen(false);
                }}
                className="text-[#CCFF00] hover:bg-[#2a3142] cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add manually
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};