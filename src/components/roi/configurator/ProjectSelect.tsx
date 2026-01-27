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
            {selectedProject?.logo_url ? (
              <img 
                src={selectedProject.logo_url} 
                alt="" 
                className="w-5 h-5 rounded object-cover"
              />
            ) : (
              <Building2 className="w-4 h-4 text-gray-500" />
            )}
            <span className="truncate">
              {displayValue || "Select project..."}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-[#1a1f2e] border-[#2a3142]">
        <Command className="bg-transparent">
          <CommandInput 
            placeholder="Search or type new..." 
            className="text-white" 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty className="text-gray-400 py-3 text-center">
              {loading ? "Loading..." : (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-sm">
                    {developerId ? "No projects found for this developer" : "No projects found"}
                  </span>
                  {searchValue.trim() && (
                    <Button 
                      size="sm" 
                      onClick={handleCreateNew}
                      className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90"
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
                  className="text-gray-300 hover:bg-[#2a3142] cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-1">
                    {project.logo_url ? (
                      <img 
                        src={project.logo_url} 
                        alt="" 
                        className="w-6 h-6 rounded object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded bg-[#2a3142] flex items-center justify-center">
                        <Building2 className="w-3 h-3 text-gray-500" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span>{project.name}</span>
                      {project.zones?.name && (
                        <span className="text-xs text-gray-500">{project.zones.name}</span>
                      )}
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === project.id ? "opacity-100 text-[#CCFF00]" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            {/* Show create option when typing something not in list */}
            {searchValue.trim() && !hasExactMatch && (
              <>
                <CommandSeparator className="bg-[#2a3142]" />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleCreateNew}
                    className="text-[#CCFF00] hover:bg-[#2a3142] cursor-pointer"
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
  );
};