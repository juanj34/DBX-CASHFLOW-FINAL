import { useState } from "react";
import { Check, ChevronsUpDown, Building2, X } from "lucide-react";
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
import { DEVELOPERS, searchDevelopers } from "@/data/developers";

interface DeveloperSelectProps {
  value: string;
  onValueChange: (name: string) => void;
  className?: string;
}

export const DeveloperSelect = ({
  value,
  onValueChange,
  className,
}: DeveloperSelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Filter developers based on search
  const filteredDevelopers = searchDevelopers(searchValue);
  
  // Check if there's an exact match for custom entry detection
  const hasExactMatch = DEVELOPERS.some(d => 
    d.toLowerCase() === searchValue.toLowerCase()
  );
  
  // Check if current value is a custom entry (not in the list)
  const isCustomValue = value && !DEVELOPERS.some(d => 
    d.toLowerCase() === value.toLowerCase()
  );
  
  const handleSelect = (name: string) => {
    onValueChange(name);
    setOpen(false);
    setSearchValue('');
  };
  
  const handleCreateCustom = () => {
    if (searchValue.trim()) {
      onValueChange(searchValue.trim());
      setOpen(false);
      setSearchValue('');
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange('');
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
              !value && "text-theme-text-muted",
              isCustomValue && "border-theme-accent/30",
              className
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <Building2 className="w-4 h-4 text-theme-text-muted flex-shrink-0" />
              <span className="truncate">
                {value || "Select developer..."}
              </span>
              {isCustomValue && (
                <span className="text-[10px] text-theme-accent bg-theme-accent/10 px-1.5 py-0.5 rounded flex-shrink-0">
                  Custom
                </span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 bg-theme-card border-theme-border">
          <Command className="bg-transparent">
            <CommandInput 
              placeholder="Search or type custom..." 
              className="text-theme-text" 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty className="text-theme-text-muted py-3 text-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-sm">No developer found</span>
                  {searchValue.trim() && (
                    <Button 
                      size="sm" 
                      onClick={handleCreateCustom}
                      className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
                    >
                      Use "{searchValue}"
                    </Button>
                  )}
                </div>
              </CommandEmpty>
              <CommandGroup heading={`${filteredDevelopers.length} developers`}>
                {filteredDevelopers.slice(0, 50).map((developer) => (
                  <CommandItem
                    key={developer}
                    value={developer}
                    onSelect={() => handleSelect(developer)}
                    className="text-theme-text hover:bg-theme-border cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-6 h-6 rounded bg-theme-border flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-3 h-3 text-theme-text-muted" />
                      </div>
                      <span>{developer}</span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === developer ? "opacity-100 text-theme-accent" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              {/* Show custom entry option when typing something not in list */}
              {searchValue.trim() && !hasExactMatch && (
                <>
                  <CommandSeparator className="bg-theme-border" />
                  <CommandGroup>
                    <CommandItem
                      onSelect={handleCreateCustom}
                      className="text-theme-accent hover:bg-theme-border cursor-pointer"
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Use "{searchValue}" as custom developer
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Clear button */}
      {value && (
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
