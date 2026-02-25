import { useState, useCallback, useEffect } from "react";
import { Sparkles, Loader2, AlertCircle, Calendar, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import FileUploadZone, { FileWithPreview } from "@/components/dashboard/FileUploadZone";
import { ExtractedDataPreview } from "./ExtractedDataPreview";
import type { AIPaymentPlanResult, AIUploadResponse } from "@/lib/aiExtractionTypes";

interface PaymentPlanExtractorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingBookingMonth?: number;
  existingBookingYear?: number;
  onApply: (data: AIPaymentPlanResult, bookingDate: { month: number; year: number }) => void;
  initialFiles?: FileWithPreview[];
}

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 13 }, (_, i) => currentYear - 8 + i);

export const PaymentPlanExtractor = ({
  open,
  onOpenChange,
  existingBookingMonth,
  existingBookingYear,
  onApply,
  initialFiles,
}: PaymentPlanExtractorProps) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<AIPaymentPlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [dateOption, setDateOption] = useState<'today' | 'existing' | 'custom'>('today');
  const [customMonth, setCustomMonth] = useState(new Date().getMonth() + 1);
  const [customYear, setCustomYear] = useState(currentYear);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0 && open) {
      setFiles(initialFiles);
    }
  }, [initialFiles, open]);

  const handleFilesSelected = useCallback((newFiles: FileWithPreview[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    setError(null);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const getBookingDate = () => {
    const now = new Date();
    switch (dateOption) {
      case 'today':
        return { month: now.getMonth() + 1, year: now.getFullYear() };
      case 'existing':
        return {
          month: existingBookingMonth || now.getMonth() + 1,
          year: existingBookingYear || now.getFullYear()
        };
      case 'custom':
        return { month: customMonth, year: customYear };
      default:
        return { month: now.getMonth() + 1, year: now.getFullYear() };
    }
  };

  const handleExtract = async () => {
    if (files.length === 0) {
      setError("Please upload at least one image or PDF");
      return;
    }

    setIsExtracting(true);
    setError(null);
    setExtractedData(null);

    try {
      const images = files
        .map(f => f.preview)
        .filter((p): p is string => typeof p === 'string' && p.length > 0 && p.startsWith('data:'));

      if (images.length === 0) {
        setError("No valid files to process. Please re-upload your files.");
        return;
      }

      const bookingDate = getBookingDate();

      const { data, error: fnError } = await supabase.functions.invoke<AIUploadResponse>(
        'extract-payment-plan',
        { body: { images, bookingDate } }
      );

      if (fnError) {
        let errorMsg = fnError.message;
        try {
          if ((fnError as any).context) {
            const body = await (fnError as any).context.json();
            if (body?.error) errorMsg = body.error;
          }
        } catch { /* ignore */ }
        throw new Error(errorMsg);
      }

      if (!data?.success || !data?.data) {
        throw new Error(data?.error || "Extraction failed");
      }

      setExtractedData(data.data);
      toast.success("Payment plan extracted successfully!");

    } catch (err) {
      console.error("Extraction error:", err);
      const message = err instanceof Error ? err.message : "Failed to extract payment plan";
      setError(message);
      toast.error(message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApply = (data: AIPaymentPlanResult) => {
    const booking = getBookingDate();
    onApply(data, { month: booking.month, year: booking.year });
    onOpenChange(false);
    setFiles([]);
    setExtractedData(null);
    setError(null);
  };

  const handleBack = () => {
    setExtractedData(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setFiles([]);
      setExtractedData(null);
      setError(null);
    }, 300);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Payment Plan Extractor
          </SheetTitle>
          <SheetDescription>
            Upload a payment plan PDF or image — AI extracts all details
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {!extractedData ? (
            <>
              {/* Booking Date Selection */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Booking Date Reference</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Used to calculate payment dates from "Month X" triggers
                </p>

                <RadioGroup
                  value={dateOption}
                  onValueChange={(v) => setDateOption(v as 'today' | 'existing' | 'custom')}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="today" id="today" />
                    <Label htmlFor="today" className="text-sm cursor-pointer">
                      Use today's date ({new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})
                    </Label>
                  </div>

                  {existingBookingMonth && existingBookingYear && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="existing" id="existing" />
                      <Label htmlFor="existing" className="text-sm cursor-pointer">
                        Use configurator date (
                        {new Date(existingBookingYear, existingBookingMonth - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        )
                      </Label>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="text-sm cursor-pointer">
                      Specify custom date
                    </Label>
                  </div>
                </RadioGroup>

                {dateOption === 'custom' && (
                  <div className="flex gap-2 ml-6 mt-2">
                    <Select value={customMonth.toString()} onValueChange={(v) => setCustomMonth(parseInt(v))}>
                      <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MONTHS.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={customYear.toString()} onValueChange={(v) => setCustomYear(parseInt(v))}>
                      <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Upload Zone */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Upload Payment Plan</Label>
                <p className="text-xs text-muted-foreground">
                  Supports multiple pages — Drag & drop, paste (Ctrl+V), or click
                </p>
                <FileUploadZone
                  files={files}
                  onFilesSelected={handleFilesSelected}
                  onRemoveFile={handleRemoveFile}
                  disabled={isExtracting}
                  acceptPaste={true}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button onClick={handleExtract} disabled={files.length === 0 || isExtracting} className="w-full" size="lg">
                {isExtracting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing with AI...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Extract Payment Plan</>
                )}
              </Button>
            </>
          ) : (
            <ExtractedDataPreview
              data={extractedData}
              onDataChange={setExtractedData}
              onApply={handleApply}
              onBack={handleBack}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
