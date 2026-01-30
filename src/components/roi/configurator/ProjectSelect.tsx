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

interface Project {
  id: string;
  name: string | null;
  developer_id: string | null;
  logo_url: string | null;
  zone_id: string | null;
  delivery_date: string | null;
  zones?: { name: string } | null;
}

interface ProjectSelectProps {
  value: string | null;
  developerId: string | null;
  manualValue?: string;
  onValueChange: (id: string | null, project: Project | null) => void;
  onManualMode: () => void;
  className?: string;
}

export const ProjectSelect = ({
  value,
  developerId,
  manualValue,
  onValueChange,
  onManualMode,
  className,
}: ProjectSelectProps) => {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      let query = supabase
        .from('projects')
        .select('id, name, developer_id, logo_url, zone_id, delivery_date, zones(name)')
        .order('name');
      
      if (developerId) {
        query = query.eq('developer_id', developerId);
      }
      
      const { data, error } = await query;
      
      if (!error && data) {
        setProjects(data as unknown as Project[]);
      }
      setLoading(false);
    };
    
    fetchProjects();
  }, [developerId]);

  const selectedProject = projects.find(p => p.id === value);
  const displayValue = selectedProject?.name || manualValue || "";
  const isManualEntry = !value && !!manualValue;
  
  // Check if there's a matching project for the current search
  const hasExactMatch = projects.some(p => 
    p.name?.toLowerCase() === searchValue.toLowerCase()
  );
  
  const handleCreateNew = () => {
    if (searchValue.trim()) {
      // Create a minimal project object for manual entry
      const manualProject: Project = {
        id: '',
        name: searchValue.trim(),
        developer_id: developerId,
        logo_url: null,
        zone_id: null,
        delivery_date: null,
      };
      onValueChange(null, manualProject);
      setOpen(false);
      setSearchValue('');
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange(null, null);
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
              {selectedProject?.logo_url ? (
                <img 
                  src={selectedProject.logo_url} 
                  alt="" 
                  className="w-5 h-5 rounded object-cover"
                />
              ) : (
                <Building2 className="w-4 h-4 text-theme-text-muted" />
              )}
              <span className="truncate">
                {displayValue || "Select project..."}
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
                    <span className="text-sm">
                      {developerId ? "No projects found for this developer" : "No projects found"}
                    </span>
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
                {projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={project.name || ''}
                    onSelect={() => {
                      onValueChange(project.id, project);
                      setOpen(false);
                      setSearchValue('');
                    }}
                    className="text-theme-text hover:bg-theme-border cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {project.logo_url ? (
                        <img 
                          src={project.logo_url} 
                          alt="" 
                          className="w-6 h-6 rounded object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded bg-theme-border flex items-center justify-center">
                          <Building2 className="w-3 h-3 text-theme-text-muted" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span>{project.name}</span>
                        {project.zones?.name && (
                          <span className="text-xs text-theme-text-muted">{project.zones.name}</span>
                        )}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === project.id ? "opacity-100 text-theme-accent" : "opacity-0"
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
