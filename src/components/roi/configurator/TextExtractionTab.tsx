import { useState, useCallback } from "react";
import { Loader2, MessageCircle, Send, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ExtractedPaymentPlan, BookingDateOption } from "@/lib/paymentPlanTypes";

interface TextExtractionTabProps {
  bookingDate: BookingDateOption;
  onExtracted: (data: ExtractedPaymentPlan) => void;
  disabled?: boolean;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

type ExtractionState = 'idle' | 'processing' | 'clarifying' | 'extracted';

export const TextExtractionTab = ({ bookingDate, onExtracted, disabled }: TextExtractionTabProps) => {
  const [state, setState] = useState<ExtractionState>('idle');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedPaymentPlan | null>(null);

  const processMessage = useCallback(async (message: string, history: ConversationMessage[]) => {
    setState('processing');
    
    try {
      const { data, error } = await supabase.functions.invoke('extract-payment-plan-text', {
        body: { 
          message,
          bookingDate,
          conversationHistory: history.map(m => ({ role: m.role, content: m.content }))
        }
      });
      
      if (error) throw error;
      
      if (data.needsClarification) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.question
        }]);
        setState('clarifying');
      } else if (data.success && data.data) {
        const responseText = data.responseText || `✅ He extraído el plan de pago:\n\n${formatExtractedSummary(data.data)}`;
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: responseText
        }]);
        setExtractedData(data.data);
        setState('extracted');
      } else {
        throw new Error(data.error || 'Error al procesar el mensaje');
      }
      
    } catch (error) {
      console.error('Error processing message:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar el mensaje');
      setState(messages.length > 0 ? 'clarifying' : 'idle');
    }
  }, [bookingDate, messages]);

  const handleSend = useCallback(async () => {
    if (!userInput.trim()) return;
    
    const message = userInput.trim();
    setUserInput('');
    const newMessages = [...messages, { role: 'user' as const, content: message }];
    setMessages(newMessages);
    
    await processMessage(message, newMessages);
  }, [userInput, messages, processMessage]);

  const handleApply = useCallback(() => {
    if (extractedData) {
      onExtracted(extractedData);
    }
  }, [extractedData, onExtracted]);

  const handleReset = useCallback(() => {
    setState('idle');
    setMessages([]);
    setExtractedData(null);
    setUserInput('');
  }, []);

  const formatExtractedSummary = (data: ExtractedPaymentPlan) => {
    const parts: string[] = [];
    
    if (data.property?.developer || data.property?.projectName) {
      parts.push(`**Propiedad:** ${[data.property.developer, data.property.projectName].filter(Boolean).join(' - ')}`);
    }
    if (data.property?.basePrice) {
      parts.push(`**Precio:** ${data.property.basePrice.toLocaleString()} ${data.property.currency || 'AED'}`);
    }
    if (data.paymentStructure.paymentSplit) {
      parts.push(`**División:** ${data.paymentStructure.paymentSplit}`);
    }
    parts.push(`**Cuotas:** ${data.installments.length} pagos`);
    if (data.paymentStructure.hasPostHandover) {
      parts.push(`**Post-handover:** Sí`);
    }
    
    return parts.join('\n');
  };

  return (
    <div className="space-y-4">
      {/* Initial prompt */}
      {state === 'idle' && messages.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Describe tu plan de pago</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Escribe los detalles del plan de pago en tus propias palabras. Te haré preguntas si necesito más información.
            </p>
          </div>
        </div>
      )}

      {/* Conversation history */}
      {messages.length > 0 && (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={cn(
                "p-3 rounded-lg text-sm",
                msg.role === 'user' 
                  ? "bg-primary/10 ml-8" 
                  : "bg-muted mr-8"
              )}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Processing indicator */}
      {state === 'processing' && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Analizando...</span>
        </div>
      )}

      {/* Input area */}
      {(state === 'idle' || state === 'clarifying') && (
        <div className="flex gap-2">
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={
              state === 'idle' 
                ? "Ej: Propiedad de 2M AED, 20% de entrada, 40% durante construcción en cuotas trimestrales, 40% al handover en Q4 2027..."
                : "Escribe tu respuesta..."
            }
            className="min-h-[80px] resize-none"
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button 
            onClick={handleSend} 
            size="icon" 
            disabled={!userInput.trim() || disabled}
            className="h-auto"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Extracted - Apply button */}
      {state === 'extracted' && extractedData && (
        <div className="flex gap-2">
          <Button onClick={handleReset} variant="outline" className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" />
            Empezar de nuevo
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Aplicar Plan de Pago
          </Button>
        </div>
      )}
    </div>
  );
};
