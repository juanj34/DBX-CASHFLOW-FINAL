import { useState, useRef, useCallback } from "react";
import { Mic, Square, Loader2, MessageCircle, Send, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ExtractedPaymentPlan, BookingDateOption } from "@/lib/paymentPlanTypes";

interface VoiceRecordingTabProps {
  bookingDate: BookingDateOption;
  onExtracted: (data: ExtractedPaymentPlan) => void;
  disabled?: boolean;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  isAudio?: boolean;
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'clarifying' | 'extracted';

export const VoiceRecordingTab = ({ bookingDate, onExtracted, disabled }: VoiceRecordingTabProps) => {
  const [state, setState] = useState<RecordingState>('idle');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedPaymentPlan | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      
      setState('recording');
      setRecordingDuration(0);
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    return new Promise<Blob>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        resolve(audioBlob);
      };
      
      mediaRecorder.stop();
    });
  }, []);

  const processAudio = useCallback(async (audioBlob: Blob) => {
    setState('processing');
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
      
      // Add user message showing they recorded
      const durationStr = formatDuration(recordingDuration);
      setMessages(prev => [...prev, { 
        role: 'user', 
        content: `🎤 Voice note (${durationStr})`, 
        isAudio: true 
      }]);
      
      // Send to edge function
      const { data, error } = await supabase.functions.invoke('extract-payment-plan-voice', {
        body: { 
          audio: base64Audio,
          bookingDate,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
        }
      });
      
      if (error) throw error;
      
      if (data.needsClarification) {
        // AI needs more info
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.question 
        }]);
        setState('clarifying');
      } else if (data.success && data.data) {
        // Got extracted data
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `✅ I've extracted the payment plan:\n\n${formatExtractedSummary(data.data)}` 
        }]);
        setExtractedData(data.data);
        setState('extracted');
      } else {
        throw new Error(data.error || 'Failed to process voice note');
      }
      
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process voice note');
      setState('idle');
    }
  }, [bookingDate, messages, recordingDuration]);

  const handleStopRecording = useCallback(async () => {
    const audioBlob = await stopRecording();
    if (audioBlob && audioBlob.size > 0) {
      await processAudio(audioBlob);
    } else {
      toast.error('No audio recorded');
      setState('idle');
    }
  }, [stopRecording, processAudio]);

  const sendClarification = useCallback(async () => {
    if (!userInput.trim()) return;
    
    const message = userInput.trim();
    setUserInput('');
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setState('processing');
    
    try {
      const { data, error } = await supabase.functions.invoke('extract-payment-plan-voice', {
        body: { 
          textMessage: message,
          bookingDate,
          conversationHistory: [...messages, { role: 'user', content: message }].map(m => ({ 
            role: m.role, 
            content: m.content 
          }))
        }
      });
      
      if (error) throw error;
      
      if (data.needsClarification) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.question }]);
        setState('clarifying');
      } else if (data.success && data.data) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `✅ I've extracted the payment plan:\n\n${formatExtractedSummary(data.data)}` 
        }]);
        setExtractedData(data.data);
        setState('extracted');
      } else {
        throw new Error(data.error || 'Failed to process response');
      }
      
    } catch (error) {
      console.error('Error sending clarification:', error);
      toast.error('Failed to send message');
      setState('clarifying');
    }
  }, [userInput, bookingDate, messages]);

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
    setRecordingDuration(0);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatExtractedSummary = (data: ExtractedPaymentPlan) => {
    const parts: string[] = [];
    
    if (data.property?.developer || data.property?.projectName) {
      parts.push(`**Property:** ${[data.property.developer, data.property.projectName].filter(Boolean).join(' - ')}`);
    }
    if (data.property?.basePrice) {
      parts.push(`**Price:** ${data.property.basePrice.toLocaleString()} ${data.property.currency || 'AED'}`);
    }
    if (data.paymentStructure.paymentSplit) {
      parts.push(`**Split:** ${data.paymentStructure.paymentSplit}`);
    }
    parts.push(`**Installments:** ${data.installments.length} payments`);
    if (data.paymentStructure.hasPostHandover) {
      parts.push(`**Post-handover:** Yes`);
    }
    
    return parts.join('\n');
  };

  return (
    <div className="space-y-4">
      {/* Recording button */}
      {state === 'idle' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <Button
            size="lg"
            onClick={startRecording}
            disabled={disabled}
            className="h-20 w-20 rounded-full"
          >
            <Mic className="h-8 w-8" />
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Tap to start recording your payment plan description
          </p>
        </div>
      )}

      {/* Recording in progress */}
      {state === 'recording' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="relative">
            <Button
              size="lg"
              variant="destructive"
              onClick={handleStopRecording}
              className="h-20 w-20 rounded-full animate-pulse"
            >
              <Square className="h-6 w-6" />
            </Button>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
              {formatDuration(recordingDuration)}
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Recording... Tap to stop
          </p>
        </div>
      )}

      {/* Processing */}
      {state === 'processing' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Analyzing your voice note...
          </p>
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
                <MessageCircle className="h-4 w-4 mb-1 text-muted-foreground" />
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Clarification input */}
      {state === 'clarifying' && (
        <div className="flex gap-2">
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your answer..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendClarification();
              }
            }}
          />
          <div className="flex flex-col gap-2">
            <Button onClick={sendClarification} size="icon" disabled={!userInput.trim()}>
              <Send className="h-4 w-4" />
            </Button>
            <Button onClick={startRecording} size="icon" variant="outline" title="Record another voice note">
              <Mic className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Extracted - Apply button */}
      {state === 'extracted' && extractedData && (
        <div className="flex gap-2">
          <Button onClick={handleReset} variant="outline" className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" />
            Start Over
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Apply Payment Plan
          </Button>
        </div>
      )}
    </div>
  );
};
