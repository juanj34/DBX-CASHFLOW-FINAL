import { useState, useCallback, useMemo } from "react";
import { LogOut, Plus, Trash2, Calendar, Sparkles, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ConfiguratorSectionProps } from "./types";
import { formatCurrency } from "../currencyUtils";
import { calculateExitScenario, ExitScenarioResult, constructionToMonth, monthToConstruction } from "../constructionProgress";
import { ROEBreakdownTooltip } from "../ROEBreakdownTooltip";
import { InfoTooltip } from "../InfoTooltip";

interface ExitScenario {
  id: string;
  monthsFromBooking: number;
}

export const ExitsSection = ({ inputs, setInputs, currency }: ConfiguratorSectionProps) => {
  const [exitScenariosEnabled, setExitScenariosEnabled] = useState(
    inputs.enabledSections?.exitStrategy ?? true
  );

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

  // Generate default exits based on timeline
  const handleGenerateDefaults = useCallback(() => {
    const newExits: ExitScenario[] = [];
    
    if (totalMonths >= 24) {
      const exit1 = Math.round(totalMonths * 0.40);
      const exit2 = Math.round(totalMonths * 0.70);
      newExits.push({ id: `exit-${Date.now()}-1`, monthsFromBooking: exit1 });
      newExits.push({ id: `exit-${Date.now()}-2`, monthsFromBooking: exit2 });
    } else if (totalMonths >= 12) {
      const exit1 = Math.round(totalMonths * 0.60);
      newExits.push({ id: `exit-${Date.now()}-1`, monthsFromBooking: exit1 });
    }
    
    setExits(newExits);
    syncExitsToInputs(newExits);
  }, [totalMonths, syncExitsToInputs]);

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
    }));
  };

  const handleAddExit = () => {
    let newMonth = Math.round(totalMonths * 0.5);
    
    while (exits.some(e => e.monthsFromBooking === newMonth) && newMonth < totalMonths - 1) {
      newMonth++;
    }
    
    if (newMonth > 0 && newMonth < totalMonths) {
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
    if (month > 0 && month < totalMonths && !exits.some(e => e.monthsFromBooking === month)) {
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
    if (newMonth > 0 && newMonth < totalMonths) {
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

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-theme-text mb-0.5">Exit Scenarios</h3>
        <p className="text-xs text-theme-text-muted">Configure when you might exit this investment</p>
      </div>

      {/* Instructions */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-300">
            <p className="font-medium mb-1">Understanding Exit Points:</p>
            <p className="text-blue-200/80">
              Exit points let you simulate selling during construction. Add points at different stages to compare returns based on appreciation and equity deployed.
            </p>
          </div>
        </div>
      </div>

      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-3 bg-theme-card rounded-lg border border-theme-border">
        <div className="flex items-center gap-2">
          <LogOut className="w-4 h-4 text-theme-accent" />
          <span className="text-sm text-theme-text-muted">Enable Exit Analysis</span>
        </div>
        <Switch checked={exitScenariosEnabled} onCheckedChange={handleToggle} className="data-[state=checked]:bg-theme-accent" />
      </div>

      {exitScenariosEnabled && (
        <>
          {/* Minimum Exit Threshold */}
          <div className="p-3 bg-theme-card rounded-xl border border-theme-border space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <label className="text-sm text-theme-text-muted">Minimum Exit Threshold</label>
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
            <div className="flex justify-between text-[10px] text-theme-text-muted">
              <span>20%</span>
              <span>Min % paid before developer allows resale</span>
              <span>80%</span>
            </div>
          </div>

          {/* Exit Costs Section */}
          <div className="p-3 bg-theme-card rounded-xl border border-theme-border space-y-3">
            <div className="flex items-center gap-1">
              <h4 className="text-sm font-medium text-theme-text">Exit Costs</h4>
              <InfoTooltip translationKey="tooltipExitCosts" />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-theme-text-muted">Agent Commission (2%)</span>
              <Switch 
                checked={inputs.exitAgentCommissionEnabled ?? false} 
                onCheckedChange={(checked) => setInputs(prev => ({ ...prev, exitAgentCommissionEnabled: checked }))}
                className="data-[state=checked]:bg-theme-accent"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-theme-text-muted">Developer NOC Fee</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-theme-text-muted">AED</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={inputs.exitNocFee || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                    setInputs(prev => ({ ...prev, exitNocFee: val }));
                  }}
                  className="w-24 h-8 text-sm bg-theme-bg-alt border-theme-border text-theme-text font-mono text-right"
                />
              </div>
            </div>
            
            <p className="text-[10px] text-theme-text-muted">
              These costs are deducted from your exit profit
            </p>
          </div>

          {/* Add Exit Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-theme-text">Add Exit Points</h4>
            
            {/* Quick Preset Buttons - Month Shortcuts */}
            <div className="space-y-2">
              <p className="text-xs text-theme-text-muted">Month shortcuts:</p>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddExitAtMonth(18)}
                  disabled={exits.some(e => e.monthsFromBooking === 18) || 18 >= totalMonths}
                  className="h-7 text-[10px] border-theme-border text-theme-text-muted hover:text-theme-text hover:border-theme-accent/50 disabled:opacity-30"
                >
                  18 months
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddExitAtMonth(24)}
                  disabled={exits.some(e => e.monthsFromBooking === 24) || 24 >= totalMonths}
                  className="h-7 text-[10px] border-theme-border text-theme-text-muted hover:text-theme-text hover:border-theme-accent/50 disabled:opacity-30"
                >
                  24 months
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddExitAtMonth(30)}
                  disabled={exits.some(e => e.monthsFromBooking === 30) || 30 >= totalMonths}
                  className="h-7 text-[10px] border-theme-border text-theme-text-muted hover:text-theme-text hover:border-theme-accent/50 disabled:opacity-30"
                >
                  30 months
                </Button>
              </div>
            </div>

            {/* Construction % Shortcuts */}
            <div className="space-y-2">
              <p className="text-xs text-theme-text-muted">Construction stage:</p>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const earlyMonth = constructionToMonth(30, totalMonths);
                    handleAddExitAtMonth(earlyMonth);
                  }}
                  className="h-7 text-[10px] border-theme-border text-theme-text-muted hover:text-theme-text hover:border-theme-accent/50"
                >
                  30% Build
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const midMonth = constructionToMonth(50, totalMonths);
                    handleAddExitAtMonth(midMonth);
                  }}
                  className="h-7 text-[10px] border-theme-border text-theme-text-muted hover:text-theme-text hover:border-theme-accent/50"
                >
                  50% Build
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nearHandover = constructionToMonth(80, totalMonths);
                    handleAddExitAtMonth(nearHandover);
                  }}
                  className="h-7 text-[10px] border-theme-border text-theme-text-muted hover:text-theme-text hover:border-theme-accent/50"
                >
                  80% Build
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddExitAtMonth(totalMonths - 1)}
                  disabled={exits.some(e => e.monthsFromBooking === totalMonths - 1)}
                  className="h-7 text-[10px] border-theme-border text-theme-text-muted hover:text-theme-text hover:border-theme-accent/50 disabled:opacity-30"
                >
                  At Handover
                </Button>
              </div>
            </div>

            {/* Add Exit Button */}
            <Button
              size="sm"
              onClick={handleAddExit}
              className="h-8 text-xs bg-theme-accent hover:bg-theme-accent/90 text-black font-medium"
            >
              <Plus className="w-3 h-3 mr-1.5" />
              Add Custom Exit
            </Button>
          </div>

          {/* Timeline Info */}
          <div className="flex items-center justify-between p-2 bg-theme-card/50 rounded-lg border border-theme-border/50">
            <div className="flex items-center gap-2 text-xs text-theme-text-muted">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{totalMonths} month construction</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-theme-accent" />
              <span className="text-xs text-theme-accent">{exits.length} exit{exits.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Exit Cards with Sliders */}
          <div className="space-y-3">
            {exits.map((exit, index) => {
              const details = getExitDetails(exit.monthsFromBooking);
              const displayROE = getDisplayROE(details);
              
              return (
                <div
                  key={exit.id}
                  className={`p-4 rounded-xl border bg-theme-card ${!details.isThresholdMet ? 'border-amber-500/50' : 'border-theme-border'}`}
                >
                  {/* Header with Exit Label and Delete */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-theme-accent">Exit {index + 1}</span>
                      <span className="text-xs text-theme-text-muted">• {getExitDate(exit.monthsFromBooking)}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveExit(exit.id)} 
                      className="h-7 w-7 p-0 text-theme-text-muted hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Month Slider */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-theme-text-muted">Exit Month</span>
                      <span className="text-sm font-mono font-semibold text-theme-text">{exit.monthsFromBooking} months</span>
                    </div>
                    <Slider
                      value={[exit.monthsFromBooking]}
                      onValueChange={([v]) => handleUpdateExitMonth(exit.id, v)}
                      min={6}
                      max={totalMonths - 1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-theme-text-muted">
                      <span>6mo</span>
                      <span>{totalMonths - 1}mo</span>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-theme-bg-alt rounded-lg p-2 text-center">
                      <div className="text-sm font-mono text-theme-text font-semibold">{formatCurrency(details.exitPrice, currency)}</div>
                      <div className="text-[10px] text-theme-text-muted">Exit Value</div>
                    </div>
                    <div className="bg-theme-bg-alt rounded-lg p-2 text-center">
                      <div className="text-sm font-mono text-green-400 font-semibold">+{details.appreciationPercent.toFixed(1)}%</div>
                      <div className="text-[10px] text-theme-text-muted">Appreciation</div>
                    </div>
                    <ROEBreakdownTooltip scenario={details} currency={currency}>
                      <div className="bg-theme-bg-alt rounded-lg p-2 text-center cursor-help hover:bg-theme-accent/10 transition-colors">
                        <div className="text-sm font-mono text-theme-accent font-semibold flex items-center justify-center gap-1">
                          {displayROE.toFixed(0)}%
                          <Info className="w-3 h-3 text-theme-text-muted" />
                        </div>
                        <div className="text-[10px] text-theme-text-muted">ROE</div>
                      </div>
                    </ROEBreakdownTooltip>
                  </div>

                  {/* Equity Info with Advance Warning */}
                  <div className="pt-3 border-t border-theme-border/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-theme-text-muted">
                        Equity: {formatCurrency(details.equityDeployed, currency)} ({details.equityPercent.toFixed(0)}%)
                      </span>
                      {details.isThresholdMet ? (
                        <span className="text-green-400 text-[10px]">✓ Above threshold</span>
                      ) : (
                        <span className="text-amber-400 text-[10px] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Below {inputs.minimumExitThreshold}% threshold
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};