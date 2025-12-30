import { useState, useCallback, useMemo } from "react";
import { LogOut, Plus, Trash2, Calendar, Sparkles, Save, FolderOpen, AlertTriangle, RotateCcw, Wand2, ArrowUpRight, Info, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfiguratorSectionProps } from "./types";
import { formatCurrency } from "../currencyUtils";
import { useExitPresets, ExitPreset } from "@/hooks/useExitPresets";
import { calculateExitScenario, ExitScenarioResult } from "../constructionProgress";
import { ROEBreakdownTooltip } from "../ROEBreakdownTooltip";

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

  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  
  const { presets, saving: savingPresets, savePreset, deletePreset, applyPreset } = useExitPresets();

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
    // Add a new exit at ~50% of timeline, or between existing exits
    let newMonth = Math.round(totalMonths * 0.5);
    
    // Find a unique month
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

  const handleRemoveExit = (exitId: string) => {
    const newExits = exits.filter((e) => e.id !== exitId);
    setExits(newExits);
    syncExitsToInputs(newExits);
  };

  const handleUpdateExitMonth = (exitId: string, newMonth: number) => {
    if (newMonth > 0 && newMonth < totalMonths) {
      // Check if another exit already exists at this month
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

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    const exitMonths = exits.map(e => e.monthsFromBooking);
    const success = await savePreset(presetName.trim(), { exitMonths, minimumExitThreshold: inputs.minimumExitThreshold });
    if (success) { setIsSavingPreset(false); setPresetName(''); }
  };

  const handleLoadPreset = (preset: ExitPreset) => {
    const values = applyPreset(preset);
    const loadedExits: ExitScenario[] = values.exitMonths.map((months, index) => ({
      id: `preset-${Date.now()}-${index}`,
      monthsFromBooking: months,
    }));
    setExits(loadedExits);
    setInputs((prev) => ({
      ...prev,
      minimumExitThreshold: values.minimumExitThreshold,
      _exitScenarios: values.exitMonths.slice().sort((a, b) => a - b),
    }));
  };

  const handleDeletePreset = async (e: React.MouseEvent, presetId: string) => {
    e.stopPropagation();
    await deletePreset(presetId);
  };

  const handleThresholdChange = (value: number[]) => {
    setInputs(prev => ({ ...prev, minimumExitThreshold: value[0] }));
  };

  const handleResetToDefaults = () => {
    setExits([]);
    setInputs((prev) => ({ ...prev, minimumExitThreshold: 30, _exitScenarios: [] }));
  };

  // Get the ROE to display (net if exit costs, otherwise true)
  const getDisplayROE = (details: ExitScenarioResult) => {
    return details.exitCosts > 0 ? details.netROE : details.trueROE;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-theme-text mb-0.5">Exit Scenarios</h3>
        <p className="text-xs text-theme-text-muted">Configure when you might exit this investment</p>
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
              <label className="text-sm text-theme-text-muted">Minimum Exit Threshold</label>
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
            <h4 className="text-sm font-medium text-theme-text">Exit Costs</h4>
            
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
                  type="number"
                  value={inputs.exitNocFee ?? 5000}
                  onChange={(e) => setInputs(prev => ({ ...prev, exitNocFee: parseFloat(e.target.value) || 0 }))}
                  className="w-24 h-8 text-sm bg-theme-bg-alt border-theme-border text-theme-text font-mono text-right"
                  min={0}
                  step={1000}
                />
              </div>
            </div>
            
            <p className="text-[10px] text-theme-text-muted">
              These costs are deducted from your exit profit
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const earlyMonth = Math.min(12, totalMonths - 1);
                if (earlyMonth > 0 && !exits.some(e => e.monthsFromBooking === earlyMonth)) {
                  const newExit = { id: `exit-${Date.now()}`, monthsFromBooking: earlyMonth };
                  const newExits = [...exits, newExit].sort((a, b) => a.monthsFromBooking - b.monthsFromBooking);
                  setExits(newExits);
                  syncExitsToInputs(newExits);
                }
              }}
              className="h-7 text-[10px] border-theme-border text-theme-text-muted hover:text-theme-text hover:border-theme-accent/50"
            >
              Early (12m)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const midMonth = Math.round(totalMonths / 2);
                if (midMonth > 0 && !exits.some(e => e.monthsFromBooking === midMonth)) {
                  const newExit = { id: `exit-${Date.now()}`, monthsFromBooking: midMonth };
                  const newExits = [...exits, newExit].sort((a, b) => a.monthsFromBooking - b.monthsFromBooking);
                  setExits(newExits);
                  syncExitsToInputs(newExits);
                }
              }}
              className="h-7 text-[10px] border-theme-border text-theme-text-muted hover:text-theme-text hover:border-theme-accent/50"
            >
              Mid-Build
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const nearHandover = Math.max(6, totalMonths - 3);
                if (!exits.some(e => e.monthsFromBooking === nearHandover)) {
                  const newExit = { id: `exit-${Date.now()}`, monthsFromBooking: nearHandover };
                  const newExits = [...exits, newExit].sort((a, b) => a.monthsFromBooking - b.monthsFromBooking);
                  setExits(newExits);
                  syncExitsToInputs(newExits);
                }
              }}
              className="h-7 text-[10px] border-theme-border text-theme-text-muted hover:text-theme-text hover:border-theme-accent/50"
            >
              Near Handover
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const atHandover = totalMonths - 1;
                if (atHandover > 0 && !exits.some(e => e.monthsFromBooking === atHandover)) {
                  const newExit = { id: `exit-${Date.now()}`, monthsFromBooking: atHandover };
                  const newExits = [...exits, newExit].sort((a, b) => a.monthsFromBooking - b.monthsFromBooking);
                  setExits(newExits);
                  syncExitsToInputs(newExits);
                }
              }}
              className="h-7 text-[10px] border-theme-border text-theme-text-muted hover:text-theme-text hover:border-theme-accent/50"
            >
              At Handover
            </Button>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Auto Generate Button */}
            <Button
              variant={exits.length === 0 ? "default" : "outline"}
              size="sm"
              onClick={handleGenerateDefaults}
              className={exits.length === 0 
                ? "h-8 text-xs bg-theme-accent hover:bg-theme-accent/90 text-black" 
                : "h-8 text-xs border-theme-border text-theme-text-muted hover:text-theme-text"}
            >
              <Wand2 className="w-3 h-3 mr-1.5" />
              {exits.length === 0 ? 'Auto Generate' : 'Regenerate'}
            </Button>

            {/* Add Exit Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddExit}
              className="h-8 text-xs border-theme-accent/50 text-theme-accent hover:bg-theme-accent/10"
            >
              <Plus className="w-3 h-3 mr-1.5" />
              Add Exit
            </Button>
            
            {/* Preset Loading */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs bg-theme-bg-alt border-theme-border text-theme-text-muted">
                  <FolderOpen className="w-3 h-3 mr-1.5" />
                  Load preset
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-theme-card border-theme-border">
                {presets.length === 0 ? (
                  <div className="px-2 py-2 text-xs text-theme-text-muted">No presets saved</div>
                ) : (
                  presets.map(preset => (
                    <DropdownMenuItem key={preset.id} className="flex items-center justify-between group" onSelect={() => handleLoadPreset(preset)}>
                      <span className="text-xs">{preset.name} ({preset.exit_months.length} exits)</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeletePreset(e, preset.id)}
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-theme-text-muted hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Save and Reset */}
            {exits.length > 0 && (
              <>
                {!isSavingPreset ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSavingPreset(true)}
                      className="h-8 text-xs border-theme-border text-theme-text-muted hover:text-theme-text"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetToDefaults}
                      className="h-8 w-8 p-0 text-theme-text-muted hover:text-theme-text"
                      title="Clear all exits"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="Preset name"
                      className="w-28 h-8 text-xs bg-theme-bg-alt border-theme-border text-theme-text"
                    />
                    <Button size="sm" onClick={handleSavePreset} disabled={!presetName.trim() || savingPresets} className="h-8 px-2 bg-theme-accent text-black hover:bg-theme-accent/90">
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setIsSavingPreset(false); setPresetName(''); }} className="h-8 px-2 text-theme-text-muted">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </>
            )}
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
                        <span className="flex items-center gap-1 text-green-400 text-[10px]">
                          ✓ Threshold met
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-400">
                          <AlertTriangle className="w-3 h-3" />
                          Advance required
                        </span>
                      )}
                    </div>
                    
                    {/* Advance payment details */}
                    {!details.isThresholdMet && details.advanceRequired > 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" />
                            Advance to reach {inputs.minimumExitThreshold}%:
                          </span>
                          <span className="text-xs text-amber-300 font-mono font-semibold">
                            {formatCurrency(details.advanceRequired, currency)}
                          </span>
                        </div>
                        {details.advancedPayments.length > 0 && (
                          <div className="text-[10px] text-theme-text-muted space-y-0.5">
                            {details.advancedPayments.map((p, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{p.milestone.label || `${p.milestone.type === 'time' ? `Month ${p.milestone.triggerValue}` : `${p.milestone.triggerValue}% construction`}`}</span>
                                <span className="font-mono">{formatCurrency(p.amountAdvanced, currency)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="text-[9px] text-amber-400/70 italic">
                          Plan paid: {details.planEquityPercent.toFixed(0)}% → Need: {inputs.minimumExitThreshold}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {exits.length === 0 && (
            <div className="text-center py-8 text-theme-text-muted">
              <LogOut className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No exit scenarios configured</p>
              <p className="text-xs mt-1">Click "Auto Generate" or "Add Exit" to get started</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
