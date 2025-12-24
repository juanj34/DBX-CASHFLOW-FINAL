import { useState, useMemo, useCallback } from "react";
import { FileText, Copy, Check, Edit3, RotateCcw, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { OIInputs, OICalculations } from "./useOICalculations";
import { ClientUnitData } from "./ClientUnitInfo";
import { MortgageAnalysis, MortgageInputs } from "./useMortgageCalculations";
import { Currency } from "./currencyUtils";
import { generateCashflowSummary } from "./cashflowSummaryGenerator";
import { toast } from "sonner";

interface CashflowSummaryCardProps {
  inputs: OIInputs;
  clientInfo: ClientUnitData;
  calculations: OICalculations;
  mortgageAnalysis?: MortgageAnalysis;
  mortgageInputs?: MortgageInputs;
  exitScenarios?: number[];
  currency: Currency;
  rate: number;
  className?: string;
}

export const CashflowSummaryCard = ({
  inputs,
  clientInfo,
  calculations,
  mortgageAnalysis,
  mortgageInputs,
  exitScenarios,
  currency,
  rate,
  className,
}: CashflowSummaryCardProps) => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate the summary
  const generatedSummary = useMemo(() => {
    return generateCashflowSummary({
      inputs,
      clientInfo,
      calculations,
      mortgageAnalysis,
      mortgageInputs,
      exitScenarios,
      currency,
      rate,
      language: language as 'en' | 'es',
    });
  }, [inputs, clientInfo, calculations, mortgageAnalysis, mortgageInputs, exitScenarios, currency, rate, language]);

  const displayText = editedText ?? generatedSummary.fullText;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(displayText);
      setCopied(true);
      toast.success(t('copiedToClipboard'));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  }, [displayText, t]);

  const handleEdit = () => {
    if (!isEditing) {
      setEditedText(displayText);
    }
    setIsEditing(!isEditing);
  };

  const handleReset = () => {
    setEditedText(null);
    setIsEditing(false);
  };

  const hasEdits = editedText !== null && editedText !== generatedSummary.fullText;

  return (
    <div className={cn("mb-6", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[#1a1f2e] border border-[#2a3142] rounded-xl hover:bg-[#1a1f2e]/80 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#CCFF00]/10 rounded-lg">
            <FileText className="w-5 h-5 text-[#CCFF00]" />
          </div>
          <div className="text-left">
            <h3 className="text-sm sm:text-base font-semibold text-white">{t('summaryTitle')}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{t('summarySubtitle')}</p>
          </div>
          {hasEdits && (
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
              {t('edited')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 hidden sm:inline">
            {isOpen ? t('clickToCollapse') : t('clickToExpand')}
          </span>
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          )}
        </div>
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[2000px] opacity-100 mt-4" : "max-h-0 opacity-0"
        )}
      >
        <div className="bg-[#0d1117] border border-[#2a3142] rounded-xl p-4 sm:p-6">
          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 mb-4">
            {hasEdits && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-gray-400 hover:text-white h-8 px-2"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                {t('resetSummary')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className={cn(
                "h-8 px-2",
                isEditing ? "text-[#CCFF00]" : "text-gray-400 hover:text-white"
              )}
            >
              <Edit3 className="w-4 h-4 mr-1" />
              {isEditing ? t('doneEditing') : t('editSummary')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-gray-400 hover:text-white h-8 px-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1 text-green-500" />
                  <span className="text-green-500">{t('copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  {t('copyToClipboard')}
                </>
              )}
            </Button>
          </div>

          {/* Summary content */}
          {isEditing ? (
            <Textarea
              value={editedText || ''}
              onChange={(e) => setEditedText(e.target.value)}
              className="min-h-[400px] bg-[#1a1f2e] border-[#2a3142] text-white font-mono text-sm leading-relaxed resize-y"
              placeholder="Edit summary..."
            />
          ) : (
            <div className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed font-mono">
              {displayText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
