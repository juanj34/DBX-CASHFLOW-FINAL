import { useState, useCallback, useMemo } from "react";
import { LogOut, Plus, Trash2, Calendar, Sparkles, AlertTriangle, Info, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ConfiguratorSectionProps } from "./types";
import { formatCurrency } from "../currencyUtils";
import { calculateExitScenario, ExitScenarioResult, constructionToMonth, monthToConstruction } from "../constructionProgress";
import { ROEBreakdownTooltip } from "../ROEBreakdownTooltip";
import { InfoTooltip } from "../InfoTooltip";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ExitScenario {
  id: string;
  monthsFromBooking: number;
}

export const ExitsSection = ({ inputs, setInputs, currency }: ConfiguratorSectionProps) => {
  const [exitScenariosEnabled, setExitScenariosEnabled] = useState(
    inputs.enabledSections?.exitStrategy ?? true
  );
  const [showExitCosts, setShowExitCosts] = useState(false);

  const [exits, setExits] = useState<ExitScenario[]>(() => {
    const months = (inputs._exitScenarios || []).filter((m) => typeof m === "number" && m > 0);
    return months
      .sort((a, b) => a - b)
      .map((monthsFromBooking, index) => ({
        id: `exit-${monthsFromBooking}-${index}`,
        monthsFromBooking,
      }));
  });

  // Calculate months from booking to handover
  const bookingDate = useMemo(() => new Date(inputs.bookingYear, inputs.bookingMonth - 1), [inputs.bookingYear, inputs.bookingMonth]);
  const handoverQuarterMonth = useMemo(() => (inputs.handoverQuarter - 1) * 3 + 1, [inputs.handoverQuarter]);
  const handoverDate = useMemo(() => new Date(inputs.handoverYear, handoverQuarterMonth - 1), [inputs.handoverYear, handoverQuarterMonth]);
  const totalMonths = useMemo(() => Math.max(1, Math.round((handoverDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24 * 30))), [bookingDate, handoverDate]);

  // Calculate entry costs (DLD 4% + Oqood fee)
  const DLD_FEE_PERCENT = 4;
  const entryCosts = useMemo(() => {
    const dldFee = inputs.basePrice * DLD_FEE_PERCENT / 100;
    const oqoodFee = inputs.oqoodFee || 0;
    return dldFee + oqoodFee;
  }, [inputs.basePrice, inputs.oqoodFee]);

  const syncExitsToInputs = useCallback((newExits: ExitScenario[]) => {
    setInputs((p) => ({ ...p, _exitScenarios: newExits.map((e) => e.monthsFromBooking).sort((a, b) => a - b) }));
  }, [setInputs]);

  const getExitDetails = useCallback((monthsFromBooking: number): ExitScenarioResult => {
    return calculateExitScenario(
      monthsFromBooking,
      inputs.basePrice,
      totalMonths,
      inputs,
      entryCosts
    );
  }, [inputs, totalMonths, entryCosts]);

  const handleToggle = (enabled: boolean) => {
    setExitScenariosEnabled(enabled);
    setInputs(prev => ({
      ...prev,
      enabledSections: { ...prev.enabledSections, exitStrategy: enabled, longTermHold: prev.enabledSections?.longTermHold ?? true },
      // Clear exit scenarios when disabling to prevent stale data from showing
      ...(enabled ? {} : { _exitScenarios: [] }),
    }));
    // Also clear local exits state when disabling
    if (!enabled) {
      setExits([]);
    }
  };

  // Maximum exit is 5 years post-handover
  const maxExitMonth = totalMonths + 60;

  const handleAddExit = () => {
    let newMonth = Math.round(totalMonths * 0.5);
    
    // Find an available slot, now allowing post-handover
    while (exits.some(e => e.monthsFromBooking === newMonth) && newMonth < maxExitMonth) {
      newMonth++;
    }
    
    if (newMonth > 0 && newMonth <= maxExitMonth) {
      const newExit: ExitScenario = {
        id: `exit-${Date.now()}`,
        monthsFromBooking: newMonth,
      };
      const newExits = [...exits, newExit].sort((a, b) => a.monthsFromBooking - b.monthsFromBooking);
      setExits(newExits);
      syncExitsToInputs(newExits);
    }
  };

  const handleAddExitAtMonth = (month: number) => {
    // Allow exits up to 5 years post-handover
    if (month > 0 && month <= maxExitMonth && !exits.some(e => e.monthsFromBooking === month)) {
      const newExit: ExitScenario = {
        id: `exit-${Date.now()}`,
        monthsFromBooking: month,
      };
      const newExits = [...exits, newExit].sort((a, b) => a.monthsFromBooking - b.monthsFromBooking);
      setExits(newExits);
      syncExitsToInputs(newExits);
    }
  };

  const handleRemoveExit = (exitId: string) => {
    const newExits = exits.filter((e) => e.id !== exitId);
    setExits(newExits);
    syncExitsToInputs(newExits);
  };

  const handleUpdateExitMonth = (exitId: string, newMonth: number) => {
    // Allow updates up to 5 years post-handover
    if (newMonth > 0 && newMonth <= maxExitMonth) {
      const exists = exits.some((e) => e.id !== exitId && e.monthsFromBooking === newMonth);
      if (!exists) {
        const newExits = exits.map((e) =>
          e.id === exitId ? { ...e, monthsFromBooking: newMonth } : e
        ).sort((a, b) => a.monthsFromBooking - b.monthsFromBooking);
        setExits(newExits);
        syncExitsToInputs(newExits);
      }
    }
  };

  // Get phase label for post-handover exits
  const getPhaseLabel = (month: number): { label: string; color: string } => {
    if (month <= totalMonths) {
      return { label: 'Construction', color: 'text-orange-400' };
    }
    const monthsAfterHandover = month - totalMonths;
    const growthPeriodMonths = (inputs.growthPeriodYears || 5) * 12;
    if (monthsAfterHandover <= growthPeriodMonths) {
      return { label: 'Growth', color: 'text-green-400' };
    }
    return { label: 'Mature', color: 'text-blue-400' };
  };

  // Format post-handover offset
  const formatPostHandoverOffset = (month: number): string => {
    const offset = month - totalMonths;
    if (offset >= 12 && offset % 12 === 0) {
      return `+${offset / 12}yr`;
    }
    return `+${offset}mo`;
  };

  const getExitDate = (monthsFromBooking: number): string => {
    const date = new Date(bookingDate);
    date.setMonth(date.getMonth() + monthsFromBooking);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const handleThresholdChange = (value: number[]) => {
    setInputs(prev => ({ ...prev, minimumExitThreshold: value[0] }));
  };

  const getDisplayROE = (details: ExitScenarioResult) => {
    return details.exitCosts > 0 ? details.netROE : details.trueROE;
  };

  // Format number with commas
  const formatWithCommas = (num: number) => num.toLocaleString();

  return (
    <div className="space-y-3">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-theme-text">Exit Scenarios</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-theme-text-muted cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-theme-card border-theme-border text-theme-text">
                <p className="text-xs">Exit points let you simulate selling during construction. Add points at different stages to compare returns based on appreciation and equity deployed.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch checked={exitScenariosEnabled} onCheckedChange={handleToggle} className="data-[state=checked]:bg-theme-accent" />
      </div>

      {exitScenariosEnabled && (
        <>
          {/* Minimum Exit Threshold - Compact */}
          <div className="p-2.5 bg-theme-card rounded-lg border border-theme-border">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1">
                <label className="text-xs text-theme-text-muted">Min Exit Threshold</label>
                <InfoTooltip translationKey="tooltipMinExitThreshold" />
              </div>
              <span className="text-sm text-theme-accent font-mono font-semibold">{inputs.minimumExitThreshold}%</span>
            </div>
            <Slider
              value={[inputs.minimumExitThreshold]}
              onValueChange={handleThresholdChange}
              min={20}
              max={80}
              step={5}
              className="w-full"
            />
          </div>

          {/* Exit Costs - Collapsible */}
          <Collapsible open={showExitCosts} onOpenChange={setShowExitCosts}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between h-8 px-2 text-theme-text-muted hover:text-theme-text">
                <span className="text-xs">Exit Costs</span>
                {showExitCosts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="p-2.5 bg-theme-card rounded-lg border border-theme-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-theme-text-muted">Agent Commission (2%)</span>
                  <Switch 
                    checked={inputs.exitAgentCommissionEnabled ?? false} 
                    onCheckedChange={(checked) => setInputs(prev => ({ ...prev, exitAgentCommissionEnabled: checked }))}
                    className="data-[state=checked]:bg-theme-accent scale-90"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-theme-text-muted">NOC Fee</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={inputs.exitNocFee ? formatWithCommas(inputs.exitNocFee) : ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                      setInputs(prev => ({ ...prev, exitNocFee: val }));
                    }}
                    className="w-24 h-7 text-xs bg-theme-bg-alt border-theme-border text-theme-text font-mono text-right"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Exit Points - All shortcuts in one row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-theme-text-muted">Add Exit Points</span>
              <div className="flex items-center gap-1 text-[10px] text-theme-text-muted">
                <Calendar className="w-3 h-3" />
                <span>{totalMonths}mo timeline</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {/* Pre-handover shortcuts */}
              {[18, 24, 30].map(month => (
                <Button
                  key={month}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddExitAtMonth(month)}
                  disabled={exits.some(e => e.monthsFromBooking === month) || month >= totalMonths}
                  className="h-6 text-[10px] px-2 border-theme-border text-theme-text-muted hover:text-theme-text hover:border-theme-accent/50 disabled:opacity-30"
                >
                  {month}mo
                </Button>
              ))}
              {[30, 50, 80].map(pct => {
                const month = constructionToMonth(pct, totalMonths);
                return (
                  <Button
                    key={`build-${pct}`}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddExitAtMonth(month)}
                    disabled={exits.some(e => e.monthsFromBooking === month)}
                    className="h-6 text-[10px] px-2 border-theme-border text-theme-text-muted hover:text-theme-text hover:border-theme-accent/50 disabled:opacity-30"
                  >
                    {pct}%
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddExitAtMonth(totalMonths)}
                disabled={exits.some(e => e.monthsFromBooking === totalMonths)}
                className="h-6 text-[10px] px-2 border-theme-border text-theme-text-muted hover:text-theme-text hover:border-theme-accent/50 disabled:opacity-30"
              >
                Handover
              </Button>
              
              {/* Divider */}
              <div className="w-px h-6 bg-theme-border/50" />
              
              {/* Post-handover shortcuts */}
              {[6, 12, 24, 36].map(offset => {
                const month = totalMonths + offset;
                const label = offset >= 12 ? `+${offset / 12}yr` : `+${offset}mo`;
                return (
                  <Button
                    key={`post-${offset}`}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddExitAtMonth(month)}
                    disabled={exits.some(e => e.monthsFromBooking === month)}
                    className="h-6 text-[10px] px-2 border-green-500/30 text-green-400/70 hover:text-green-400 hover:border-green-500/50 disabled:opacity-30"
                  >
                    {label}
                  </Button>
                );
              })}
              
              <Button
                size="sm"
                onClick={handleAddExit}
                className="h-6 text-[10px] px-2 bg-theme-accent hover:bg-theme-accent/90 text-black"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Exit Cards - Compact */}
          <div className="space-y-2">
            {exits.map((exit, index) => {
              const details = getExitDetails(exit.monthsFromBooking);
              const displayROE = getDisplayROE(details);
              const isPostHandover = exit.monthsFromBooking > totalMonths;
              const phase = getPhaseLabel(exit.monthsFromBooking);
              
              return (
                <div
                  key={exit.id}
                  className={`p-3 rounded-lg border bg-theme-card ${
                    !details.isThresholdMet 
                      ? 'border-amber-500/50' 
                      : isPostHandover 
                        ? 'border-green-500/30' 
                        : 'border-theme-border'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-theme-accent">Exit {index + 1}</span>
                      {isPostHandover ? (
                        <>
                          <span className={`text-[10px] font-medium ${phase.color}`}>
                            {formatPostHandoverOffset(exit.monthsFromBooking)}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${phase.color} bg-current/10`}>
                            {phase.label}
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] text-theme-text-muted">{getExitDate(exit.monthsFromBooking)}</span>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveExit(exit.id)} 
                      className="h-6 w-6 p-0 text-theme-text-muted hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Month Slider - Extended for post-handover */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-theme-text-muted">
                        {isPostHandover ? 'Post-Handover' : 'Month'}
                      </span>
                      <span className="text-xs font-mono text-theme-text">
                        {isPostHandover 
                          ? formatPostHandoverOffset(exit.monthsFromBooking)
                          : `${exit.monthsFromBooking}mo`
                        }
                      </span>
                    </div>
                    <Slider
                      value={[exit.monthsFromBooking]}
                      onValueChange={([v]) => handleUpdateExitMonth(exit.id, v)}
                      min={6}
                      max={maxExitMonth}
                      step={1}
                      className="w-full"
                    />
                    {/* Handover marker indicator */}
                    <div className="flex justify-between text-[8px] text-theme-text-muted mt-0.5">
                      <span>6mo</span>
                      <span className="text-theme-accent">Handover ({totalMonths}mo)</span>
                      <span className="text-green-400">+5yr</span>
                    </div>
                  </div>

                  {/* Metrics - Compact Grid */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="bg-theme-bg-alt rounded p-1.5 text-center">
                      <div className="text-xs font-mono text-theme-text font-semibold">{formatCurrency(details.exitPrice, currency)}</div>
                      <div className="text-[9px] text-theme-text-muted">Value</div>
                    </div>
                    <div className="bg-theme-bg-alt rounded p-1.5 text-center">
                      <div className="text-xs font-mono text-green-400 font-semibold">+{details.appreciationPercent.toFixed(1)}%</div>
                      <div className="text-[9px] text-theme-text-muted">Appr.</div>
                    </div>
                    <ROEBreakdownTooltip scenario={details} currency={currency}>
                      <div className="bg-theme-bg-alt rounded p-1.5 text-center cursor-help hover:bg-theme-accent/10 transition-colors">
                        <div className="text-xs font-mono text-theme-accent font-semibold flex items-center justify-center gap-0.5">
                          {displayROE.toFixed(0)}%
                          <Info className="w-2.5 h-2.5 text-theme-text-muted" />
                        </div>
                        <div className="text-[9px] text-theme-text-muted">ROE</div>
                      </div>
                    </ROEBreakdownTooltip>
                  </div>

                  {/* Threshold warning */}
                  {!details.isThresholdMet && (
                    <div className="mt-2 flex items-center gap-1 text-amber-400 text-[10px]">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Below {inputs.minimumExitThreshold}% threshold</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {exits.length === 0 && (
            <div className="p-4 text-center text-theme-text-muted text-sm border border-dashed border-theme-border rounded-lg">
              <Sparkles className="w-5 h-5 mx-auto mb-2 text-theme-accent" />
              <p>Add exit points to simulate selling during construction</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};