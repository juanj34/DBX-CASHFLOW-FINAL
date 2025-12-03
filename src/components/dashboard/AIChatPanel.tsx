import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import FileUploadZone, { FileWithPreview } from "./FileUploadZone";
import PreviewCard from "./PreviewCard";

interface Message {
  role: "user" | "assistant";
  content: string;
  images?: string[];
}

interface SearchResult {
  projects: Array<{ id: string; name: string; description?: string; developer?: string }>;
  hotspots: Array<{ id: string; title: string; category: string; description?: string }>;
}

interface AIResponse {
  type: "message" | "preview" | "update_preview" | "clarification" | "request_coordinates" | "search_results";
  message: string;
  itemType?: "project" | "hotspot";
  data?: any;
  originalData?: any;
  results?: SearchResult;
  query?: string;
  missingFields?: string[];
}

interface AIChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AIChatPanel = ({ open, onOpenChange }: AIChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [needsCoordinates, setNeedsCoordinates] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFilesSelected = (newFiles: FileWithPreview[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput && files.length === 0) return;

    const images = files.map((f) => f.preview);
    const userMessage: Message = {
      role: "user",
      content: trimmedInput || "Analiza estos archivos",
      images: images.length > 0 ? images : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setFiles([]);
    setIsLoading(true);
    setSearchResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
            images: m.images,
          })),
          images,
        },
      });

      if (error) throw error;

      const response = data as AIResponse;

      if (response.type === "preview") {
        setPreviewData(response.data);
        setIsEditing(false);
        setNeedsCoordinates(false);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.message },
        ]);
      } else if (response.type === "update_preview") {
        setPreviewData(response.data);
        setIsEditing(true);
        setNeedsCoordinates(false);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.message },
        ]);
      } else if (response.type === "request_coordinates") {
        setPreviewData(response.data);
        setNeedsCoordinates(true);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.message },
        ]);
      } else if (response.type === "search_results") {
        setSearchResults(response.results || null);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.message },
        ]);
      } else if (response.type === "clarification") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.message },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.message },
        ]);
      }
    } catch (error) {
      console.error("Error calling AI assistant:", error);
      toast.error("Error al comunicarse con el asistente");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Lo siento, hubo un error. Por favor intenta de nuevo." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (data: any) => {
    setIsLoading(true);
    try {
      const action = isEditing ? "update" : "confirm";
      const { data: result, error } = await supabase.functions.invoke("ai-assistant", {
        body: { action, data },
      });

      if (error) throw error;

      toast.success(result.message);
      setPreviewData(null);
      setIsEditing(false);
      setNeedsCoordinates(false);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `✅ ${result.message}` },
      ]);
    } catch (error) {
      console.error("Error confirming:", error);
      toast.error("Error al guardar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPreviewData(null);
    setIsEditing(false);
    setNeedsCoordinates(false);
    setSearchResults(null);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Operación cancelada. ¿En qué más puedo ayudarte?" },
    ]);
  };

  const handleSelectSearchResult = (item: any, type: "project" | "hotspot") => {
    const displayName = type === "project" ? item.name : item.title;
    setSearchResults(null);
    setInput(`Editar ${type === "project" ? "proyecto" : "hotspot"} con ID ${item.id}: ${displayName}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Assistant
          </SheetTitle>
        </SheetHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">¡Hola! Soy tu asistente de IA</p>
                <p className="text-sm mt-2">
                  Puedo ayudarte a agregar y editar proyectos y hotspots. 
                  Escribe una descripción o sube un brochure.
                </p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.images && msg.images.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {msg.images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt=""
                          className="h-16 w-16 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <p className="text-sm text-muted-foreground">Procesando...</p>
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchResults && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Resultados encontrados:</p>
                {searchResults.projects.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Proyectos:</p>
                    {searchResults.projects.map((p) => (
                      <Button
                        key={p.id}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => handleSelectSearchResult(p, "project")}
                      >
                        <div>
                          <p className="font-medium">{p.name}</p>
                          {p.developer && <p className="text-xs text-muted-foreground">{p.developer}</p>}
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
                {searchResults.hotspots.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Hotspots:</p>
                    {searchResults.hotspots.map((h) => (
                      <Button
                        key={h.id}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => handleSelectSearchResult(h, "hotspot")}
                      >
                        <div>
                          <p className="font-medium">{h.title}</p>
                          <p className="text-xs text-muted-foreground">{h.category}</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={() => setSearchResults(null)}>
                  Cerrar
                </Button>
              </div>
            )}

            {/* Preview Card */}
            {previewData && (
              <PreviewCard
                data={previewData}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                needsCoordinates={needsCoordinates}
                isLoading={isLoading}
                isEditing={isEditing}
              />
            )}
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t p-4 space-y-3">
          <FileUploadZone
            files={files}
            onFilesSelected={handleFilesSelected}
            onRemoveFile={handleRemoveFile}
            disabled={isLoading}
          />

          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe una descripción o pega información del proyecto..."
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || (!input.trim() && files.length === 0)}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AIChatPanel;
