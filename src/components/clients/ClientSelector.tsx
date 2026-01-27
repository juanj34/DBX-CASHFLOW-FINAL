import { useState } from "react";
import { Check, ChevronsUpDown, Plus, User } from "lucide-react";
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
import { useClients, Client } from "@/hooks/useClients";

interface ClientSelectorProps {
  value: string | null;
  onValueChange: (clientId: string | null, client: Client | null) => void;
  onCreateNew?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ClientSelector = ({
  value,
  onValueChange,
  onCreateNew,
  placeholder = "Select client...",
  disabled = false,
}: ClientSelectorProps) => {
  const { clients, loading } = useClients();
  const [open, setOpen] = useState(false);

  const selectedClient = clients.find(c => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className="w-full justify-between bg-[#0d1117] border-[#2a3142] text-white h-9 hover:bg-[#161b22]"
        >
          <span className="flex items-center gap-2 truncate">
            <User className="w-4 h-4 text-theme-text-muted shrink-0" />
            {selectedClient ? (
              <span className="truncate">{selectedClient.name}</span>
            ) : (
              <span className="text-theme-text-muted">{loading ? "Loading..." : placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-[#1a1f2e] border-[#2a3142]" align="start">
        <Command className="bg-transparent">
          <CommandInput placeholder="Search clients..." className="text-white" />
          <CommandList>
            <CommandEmpty className="py-4 text-center text-sm text-theme-text-muted">
              No clients found.
            </CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.name}
                  onSelect={() => {
                    onValueChange(client.id === value ? null : client.id, client.id === value ? null : client);
                    setOpen(false);
                  }}
                  className="text-white hover:bg-[#2a3142] cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === client.id ? "opacity-100 text-[#CCFF00]" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{client.name}</span>
                    {client.email && (
                      <span className="text-xs text-theme-text-muted">{client.email}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {onCreateNew && (
              <>
                <CommandSeparator className="bg-[#2a3142]" />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      onCreateNew();
                    }}
                    className="text-[#CCFF00] hover:bg-[#2a3142] cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create new client
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
