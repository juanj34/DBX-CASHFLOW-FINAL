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

interface AIResponse {
  type: "message" | "preview" | "clarification" | "request_coordinates";
  message: string;
  itemType?: "project" | "hotspot";
  data?: any;
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
  const [needsCoordinates, setNeedsCoordinates] = useState(false);
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
      const { data: result, error } = await supabase.functions.invoke("ai-assistant", {
        body: { action: "confirm", data },
      });

      if (error) throw error;

      toast.success(result.message);
      setPreviewData(null);
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
    setNeedsCoordinates(false);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Operación cancelada. ¿En qué más puedo ayudarte?" },
    ]);
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
                  Puedo ayudarte a agregar proyectos y hotspots. 
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

            {/* Preview Card */}
            {previewData && (
              <PreviewCard
                data={previewData}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                needsCoordinates={needsCoordinates}
                isLoading={isLoading}
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
