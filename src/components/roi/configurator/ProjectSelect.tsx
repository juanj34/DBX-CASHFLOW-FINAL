import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Building2, X, Clock } from "lucide-react";
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
import { useRecentProjects, RecentProject } from "@/hooks/useRecentProjects";

interface ProjectSelectProps {
  value: string;
  developer?: string;
  onValueChange: (name: string) => void;
  className?: string;
}

export const ProjectSelect = ({
  value,
  developer,
  onValueChange,
  className,
}: ProjectSelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const { recents, getRecents } = useRecentProjects();

  // Get recent projects, optionally filtered by current developer
  const filteredRecents = useMemo(() => {
    const all = getRecents();
    if (!searchValue.trim()) return all;
    
    const lowerSearch = searchValue.toLowerCase();
    return all.filter(p => p.name.toLowerCase().includes(lowerSearch));
  }, [getRecents, searchValue]);

  // Check if current search matches any recent
  const hasMatch = filteredRecents.some(p => 
    p.name.toLowerCase() === searchValue.toLowerCase()
  );
  
  const handleSelect = (name: string) => {
    onValueChange(name);
    setOpen(false);
    setSearchValue('');
  };
  
  const handleUseCustom = () => {
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
              className
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <Building2 className="w-4 h-4 text-theme-text-muted flex-shrink-0" />
              <span className="truncate">
                {value || "Enter project name..."}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 bg-theme-card border-theme-border">
          <Command className="bg-transparent">
            <CommandInput 
              placeholder="Type project name..." 
              className="text-theme-text" 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              {/* When typing, always show the option to use the typed value */}
              {searchValue.trim() && (
                <CommandGroup>
                  <CommandItem
                    onSelect={handleUseCustom}
                    className="text-theme-accent hover:bg-theme-border cursor-pointer"
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Use "{searchValue}"
                  </CommandItem>
                </CommandGroup>
              )}
              
              {/* Recent projects */}
              {filteredRecents.length > 0 && (
                <>
                  {searchValue.trim() && <CommandSeparator className="bg-theme-border" />}
                  <CommandGroup heading="Recent Projects">
                    {filteredRecents.map((project: RecentProject) => (
                      <CommandItem
                        key={`${project.name}-${project.developer}`}
                        value={project.name}
                        onSelect={() => handleSelect(project.name)}
                        className="text-theme-text hover:bg-theme-border cursor-pointer"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Clock className="w-3.5 h-3.5 text-theme-text-muted flex-shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="truncate">{project.name}</span>
                            {project.developer && (
                              <span className="text-xs text-theme-text-muted truncate">
                                {project.developer}
                              </span>
                            )}
                          </div>
                        </div>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4 flex-shrink-0",
                            value === project.name ? "opacity-100 text-theme-accent" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
              
              {/* Empty state when no recents and no search */}
              {!searchValue.trim() && filteredRecents.length === 0 && (
                <CommandEmpty className="text-theme-text-muted py-4 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="w-8 h-8 opacity-30" />
                    <span className="text-sm">Type a project name</span>
                    <span className="text-xs opacity-60">Your recent projects will appear here</span>
                  </div>
                </CommandEmpty>
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
