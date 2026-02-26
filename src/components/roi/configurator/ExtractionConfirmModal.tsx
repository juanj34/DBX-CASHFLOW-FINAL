import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Sparkles,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  Building2,
  CalendarDays,
  Banknote,
  ListChecks,
  ShieldCheck,
  Key,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AIPaymentPlanResult,
  AIExtractedMilestone,
} from "@/lib/aiExtractionTypes";
import { months, years } from "./types";

// ── Loading phase step labels ─────────────────────────────────────
const LOADING_STEPS = [
  "Reading document...",
  "Analyzing payment structure...",
  "Extracting property details...",
  "Structuring data...",
];

// ── Unit type options ─────────────────────────────────────────────
const UNIT_TYPES = [
  { value: "studio", label: "Studio" },
  { value: "1br", label: "1 Bedroom" },
  { value: "2br", label: "2 Bedrooms" },
  { value: "3br", label: "3 Bedrooms" },
  { value: "4br", label: "4 Bedrooms" },
  { value: "penthouse", label: "Penthouse" },
  { value: "townhouse", label: "Townhouse" },
  { value: "villa", label: "Villa" },
  { value: "commercial", label: "Commercial" },
];

const MILESTONE_TYPES = [
  { value: "time", label: "Month #" },
  { value: "construction", label: "% Built" },
  { value: "post-handover", label: "Post-HO" },
];

// ── Props ─────────────────────────────────────────────────────────
interface ExtractionConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = still extracting */
  data: AIPaymentPlanResult | null;
  error: string | null;
  onApply: (
    data: AIPaymentPlanResult,
    bookingDate: { month: number; year: number }
  ) => void;
  onCancel: () => void;
  existingBookingMonth?: number;
  existingBookingYear?: number;
}

export const ExtractionConfirmModal = ({
  open,
  onOpenChange,
  data,
  error,
  onApply,
  onCancel,
  existingBookingMonth,
  existingBookingYear,
}: ExtractionConfirmModalProps) => {
  // ── Local editable state ────────────────────────────────────────
  const [editedData, setEditedData] = useState<AIPaymentPlanResult | null>(
    null
  );
  const [bookingMonth, setBookingMonth] = useState(
    existingBookingMonth || new Date().getMonth() + 1
  );
  const [bookingYear, setBookingYear] = useState(
    existingBookingYear || new Date().getFullYear()
  );

  // Loading step animation
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (data) {
      // Keep all milestones including isHandover — the user can toggle which is completion
      setEditedData({ ...data });
    }
  }, [data]);

  // Cycle loading steps
  useEffect(() => {
    if (data || error) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [data, error]);

  // Reset loading step when modal opens
  useEffect(() => {
    if (open && !data) setLoadingStep(0);
  }, [open, data]);

  // ── Field updaters ──────────────────────────────────────────────
  const updateField = (field: keyof AIPaymentPlanResult, value: unknown) => {
    if (!editedData) return;
    setEditedData({ ...editedData, [field]: value });
  };

  const updateMilestone = (
    index: number,
    field: keyof AIExtractedMilestone,
    value: unknown
  ) => {
    if (!editedData) return;
    const updated = [...editedData.milestones];
    updated[index] = { ...updated[index], [field]: value };
    setEditedData({ ...editedData, milestones: updated });
  };

  const addMilestone = () => {
    if (!editedData) return;
    const newMilestone: AIExtractedMilestone = {
      type: "time",
      triggerValue: 1,
      paymentPercent: 5,
    };
    setEditedData({
      ...editedData,
      milestones: [...editedData.milestones, newMilestone],
    });
  };

  const removeMilestone = (index: number) => {
    if (!editedData) return;
    setEditedData({
      ...editedData,
      milestones: editedData.milestones.filter((_, i) => i !== index),
    });
  };

  // ── Validation ──────────────────────────────────────────────────
  const explicitHandover = useMemo(() => {
    if (!editedData) return undefined;
    return editedData.milestones.find((m) => m.isHandover);
  }, [editedData]);

  const preHandoverMilestoneTotal = useMemo(() => {
    if (!editedData) return 0;
    return editedData.milestones
      .filter((m) => m.type !== "post-handover" && !m.isHandover)
      .reduce((sum, m) => sum + (m.paymentPercent || 0), 0);
  }, [editedData]);

  const postHandoverMilestoneTotal = useMemo(() => {
    if (!editedData) return 0;
    return editedData.milestones
      .filter((m) => m.type === "post-handover")
      .reduce((sum, m) => sum + (m.paymentPercent || 0), 0);
  }, [editedData]);

  const preHandoverTotal = useMemo(() => {
    if (!editedData) return 0;
    return (editedData.downpaymentPercent || 0) + preHandoverMilestoneTotal;
  }, [editedData, preHandoverMilestoneTotal]);

  // Handover balance: explicit isHandover milestone > onHandoverPercent > auto-calc
  const handoverBalance = useMemo(() => {
    if (!editedData) return 0;
    if (explicitHandover) return explicitHandover.paymentPercent || 0;
    if (editedData.hasPostHandover) return editedData.onHandoverPercent || 0;
    return Math.max(0, 100 - preHandoverTotal);
  }, [editedData, explicitHandover, preHandoverTotal]);

  const totalPercent = useMemo(() => {
    if (!editedData) return 0;
    if (editedData.hasPostHandover || explicitHandover) {
      return preHandoverTotal + handoverBalance + postHandoverMilestoneTotal;
    }
    // Standard plan: pre-handover + implicit handover balance always = 100%
    return preHandoverTotal + handoverBalance;
  }, [
    editedData,
    explicitHandover,
    preHandoverTotal,
    handoverBalance,
    postHandoverMilestoneTotal,
  ]);

  const isValidTotal = (editedData?.hasPostHandover || explicitHandover)
    ? Math.abs(totalPercent - 100) < 0.5
    : preHandoverTotal > 0 && preHandoverTotal <= 100;

  // ── Apply ───────────────────────────────────────────────────────
  const handleApply = () => {
    if (!editedData || !isValidTotal) return;
    onApply(editedData, { month: bookingMonth, year: bookingYear });
  };

  // ── Render: Loading phase ───────────────────────────────────────
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-16 px-8 gap-8">
      {/* Animated orb */}
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full bg-theme-accent/10 animate-ping" style={{ animationDuration: "2s" }} />
        <div className="absolute inset-1 rounded-full border-2 border-theme-accent/20" />
        <div className="absolute inset-1 rounded-full border-2 border-theme-accent border-t-transparent animate-spin" style={{ animationDuration: "1.5s" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-theme-accent" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs space-y-3">
        <div className="h-2 rounded-full bg-theme-bg overflow-hidden border border-theme-border/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-theme-accent to-theme-accent/70 transition-all duration-1000 ease-out"
            style={{
              width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%`,
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-theme-text-muted">
            {LOADING_STEPS[loadingStep]}
          </p>
          <span className="text-xs text-theme-text-muted font-mono">
            {loadingStep + 1}/{LOADING_STEPS.length}
          </span>
        </div>
      </div>
    </div>
  );

  // ── Render: Error phase ─────────────────────────────────────────
  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-16 px-8 gap-5">
      <div className="w-16 h-16 rounded-full bg-theme-negative/10 border border-theme-negative/20 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-theme-negative" />
      </div>
      <div className="text-center space-y-1.5">
        <p className="text-sm font-semibold text-theme-negative">
          Extraction Failed
        </p>
        <p className="text-xs text-theme-text-muted max-w-sm leading-relaxed">
          {error}
        </p>
      </div>
    </div>
  );

  // ── Render: Review phase ────────────────────────────────────────
  const renderReview = () => {
    if (!editedData) return null;

    return (
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 custom-scrollbar">
        {/* Confidence bar */}
        <div className="p-3 rounded-xl bg-theme-bg/50 border border-theme-border/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className={cn(
                "w-4 h-4",
                editedData.confidence >= 85 ? "text-theme-positive" :
                editedData.confidence >= 60 ? "text-yellow-400" : "text-theme-negative"
              )} />
              <span className="text-xs font-medium text-theme-text">
                AI Confidence
              </span>
            </div>
            <span
              className={cn(
                "text-sm font-bold font-mono",
                editedData.confidence >= 85 ? "text-theme-positive" :
                editedData.confidence >= 60 ? "text-yellow-400" : "text-theme-negative"
              )}
            >
              {editedData.confidence}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-theme-bg overflow-hidden border border-theme-border/30">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                editedData.confidence >= 85 ? "bg-theme-positive" :
                editedData.confidence >= 60 ? "bg-yellow-500" : "bg-theme-negative"
              )}
              style={{ width: `${editedData.confidence}%` }}
            />
          </div>
          {/* Warnings */}
          {editedData.warnings?.length > 0 && (
            <div className="mt-2.5 space-y-1">
              {editedData.warnings.map((w, i) => (
                <div
                  key={i}
                  className="flex items-start gap-1.5 text-[11px] text-yellow-400/90"
                >
                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Property Info ──────────────────────────────────────── */}
        <section className="p-3 rounded-xl bg-theme-bg/50 border border-theme-border/50">
          <SectionHeader icon={Building2} label="Property Info" />
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            <FieldInput
              label="Developer"
              value={editedData.developer || ""}
              onChange={(v) => updateField("developer", v)}
            />
            <FieldInput
              label="Project"
              value={editedData.projectName || ""}
              onChange={(v) => updateField("projectName", v)}
            />
            <FieldInput
              label="Unit"
              value={editedData.unitNumber || ""}
              onChange={(v) => updateField("unitNumber", v)}
            />
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-theme-text-muted uppercase tracking-wider">
                Type
              </label>
              <Select
                value={editedData.unitType || ""}
                onValueChange={(v) => updateField("unitType", v)}
              >
                <SelectTrigger className="h-8 text-xs bg-theme-bg border-theme-border text-theme-text">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-theme-card border-theme-border">
                  {UNIT_TYPES.map((t) => (
                    <SelectItem
                      key={t.value}
                      value={t.value}
                      className="text-xs text-theme-text"
                    >
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FieldInput
              label="Size (sqft)"
              type="number"
              value={editedData.sizeSqFt?.toString() || ""}
              onChange={(v) => updateField("sizeSqFt", parseFloat(v) || 0)}
            />
            <FieldInput
              label="Price (AED)"
              type="number"
              value={editedData.purchasePrice?.toString() || ""}
              onChange={(v) =>
                updateField("purchasePrice", parseFloat(v) || 0)
              }
            />
            <FieldInput
              label="Oqood / Admin (AED)"
              type="number"
              value={editedData.oqoodFee?.toString() || ""}
              onChange={(v) =>
                updateField("oqoodFee", parseFloat(v) || 0)
              }
            />
          </div>
        </section>

        {/* ── Booking Date ───────────────────────────────────────── */}
        <section className="p-3 rounded-xl bg-theme-bg/50 border border-theme-border/50">
          <SectionHeader icon={CalendarDays} label="Booking Date" />
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            <Select
              value={bookingMonth.toString()}
              onValueChange={(v) => setBookingMonth(parseInt(v))}
            >
              <SelectTrigger className="h-8 text-xs bg-theme-bg border-theme-border text-theme-text">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-theme-card border-theme-border">
                {months.map((m) => (
                  <SelectItem
                    key={m.value}
                    value={m.value.toString()}
                    className="text-xs text-theme-text"
                  >
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={bookingYear.toString()}
              onValueChange={(v) => setBookingYear(parseInt(v))}
            >
              <SelectTrigger className="h-8 text-xs bg-theme-bg border-theme-border text-theme-text">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-theme-card border-theme-border">
                {years.map((y) => (
                  <SelectItem
                    key={y}
                    value={y.toString()}
                    className="text-xs text-theme-text"
                  >
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-[10px] text-theme-text-muted mt-2">
            All payment dates are calculated relative to this booking date
          </p>
        </section>

        {/* ── Payment Structure ───────────────────────────────────── */}
        <section className="p-3 rounded-xl bg-theme-bg/50 border border-theme-border/50">
          <SectionHeader icon={Banknote} label="Payment Structure" />
          <div className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-2.5">
              <FieldInput
                label="Downpayment %"
                type="number"
                value={(editedData.downpaymentPercent ?? "").toString()}
                onChange={(v) =>
                  updateField("downpaymentPercent", parseFloat(v) || 0)
                }
              />
              <FieldInput
                label="Handover (months from booking)"
                type="number"
                value={(
                  editedData.handoverMonthFromBooking ?? ""
                ).toString()}
                onChange={(v) =>
                  updateField(
                    "handoverMonthFromBooking",
                    parseInt(v) || 0
                  )
                }
              />
            </div>

            {/* Post-handover toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-theme-card border border-theme-border/50">
              <span className="text-xs font-medium text-theme-text">
                Post-handover payments
              </span>
              <Switch
                checked={editedData.hasPostHandover}
                onCheckedChange={(v) => updateField("hasPostHandover", v)}
              />
            </div>

            {editedData.hasPostHandover && (
              <FieldInput
                label="On Handover %"
                type="number"
                value={(editedData.onHandoverPercent ?? "").toString()}
                onChange={(v) =>
                  updateField("onHandoverPercent", parseFloat(v) || 0)
                }
              />
            )}
          </div>
        </section>

        {/* ── Milestones Table ────────────────────────────────────── */}
        <section className="p-3 rounded-xl bg-theme-bg/50 border border-theme-border/50">
          <div className="flex items-center justify-between">
            <SectionHeader icon={ListChecks} label="Installments" />
            <Button
              variant="ghost"
              size="sm"
              onClick={addMilestone}
              className="h-7 px-2.5 text-[11px] text-theme-accent hover:text-theme-accent hover:bg-theme-accent/10 gap-1"
            >
              <Plus className="w-3 h-3" />
              Add
            </Button>
          </div>

          {editedData.milestones.length === 0 ? (
            <p className="text-xs text-theme-text-muted text-center py-6 bg-theme-card/50 rounded-lg border border-dashed border-theme-border/50 mt-3">
              No installments — typical for simple plans (e.g. 20/80)
            </p>
          ) : (
            <div className="space-y-1 mt-3">
              {/* Header */}
              <div className="grid grid-cols-[90px_60px_60px_1fr_28px_28px] gap-1.5 text-[10px] font-medium text-theme-text-muted uppercase tracking-wider px-1 pb-1 border-b border-theme-border/30">
                <span>Type</span>
                <span>Trigger</span>
                <span>%</span>
                <span>Label</span>
                <span />
                <span />
              </div>

              {/* Rows */}
              {editedData.milestones.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "grid grid-cols-[90px_60px_60px_1fr_28px_28px] gap-1.5 items-center rounded-lg px-1 py-1 transition-colors",
                    m.type === "construction" && "bg-orange-500/8 border border-orange-500/15",
                    m.type === "post-handover" && "bg-theme-accent/8 border border-theme-accent/15",
                    m.type === "time" && "bg-theme-card/50 border border-theme-border/30"
                  )}
                >
                  <Select
                    value={m.type}
                    onValueChange={(v) =>
                      updateMilestone(
                        i,
                        "type",
                        v as AIExtractedMilestone["type"]
                      )
                    }
                  >
                    <SelectTrigger className="h-7 text-[11px] bg-transparent border-theme-border/40 text-theme-text px-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-theme-card border-theme-border">
                      {MILESTONE_TYPES.map((t) => (
                        <SelectItem
                          key={t.value}
                          value={t.value}
                          className="text-xs text-theme-text"
                        >
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    value={m.triggerValue}
                    onChange={(e) =>
                      updateMilestone(
                        i,
                        "triggerValue",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="h-7 text-[11px] bg-transparent border-theme-border/40 text-theme-text px-1.5"
                  />

                  <Input
                    type="number"
                    value={m.paymentPercent}
                    onChange={(e) =>
                      updateMilestone(
                        i,
                        "paymentPercent",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="h-7 text-[11px] bg-transparent border-theme-border/40 text-theme-text px-1.5 font-semibold"
                  />

                  <Input
                    value={m.label || ""}
                    onChange={(e) =>
                      updateMilestone(i, "label", e.target.value)
                    }
                    placeholder="e.g. Month 6"
                    className="h-7 text-[11px] bg-transparent border-theme-border/40 text-theme-text px-1.5"
                  />

                  <button
                    onClick={() => {
                      if (!editedData) return;
                      const updated = editedData.milestones.map((ms, j) => ({
                        ...ms,
                        isHandover: j === i ? !ms.isHandover : false,
                      }));
                      setEditedData({ ...editedData, milestones: updated });
                    }}
                    className={cn(
                      "p-1 rounded transition-colors",
                      m.isHandover
                        ? "text-[#C9A04A] bg-[#C9A04A]/20 hover:bg-[#C9A04A]/30"
                        : "text-theme-text-muted/40 hover:text-[#C9A04A] hover:bg-[#C9A04A]/10"
                    )}
                    title="Mark as completion/handover payment"
                  >
                    <Key className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => removeMilestone(i)}
                    className="p-1 rounded-md hover:bg-theme-negative/20 text-theme-text-muted hover:text-theme-negative transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Handover balance display */}
          {editedData && !editedData.hasPostHandover && !explicitHandover && (
            <div className="mt-3 px-3 py-2.5 rounded-lg bg-blue-500/8 border border-blue-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-xs font-medium text-blue-300">
                  Handover Balance
                </span>
                <span className="text-[10px] text-blue-400/60">(auto-calculated)</span>
              </div>
              <span className="text-sm font-bold font-mono text-blue-400">
                {handoverBalance.toFixed(1)}%
              </span>
            </div>
          )}
          {editedData && explicitHandover && (
            <div className="mt-3 px-3 py-2.5 rounded-lg bg-[#C9A04A]/10 border border-[#C9A04A]/25 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-[#C9A04A]" />
                <span className="text-xs font-medium text-[#C9A04A]">
                  Completion Payment
                </span>
                <span className="text-[10px] text-[#C9A04A]/60">(marked with key icon)</span>
              </div>
              <span className="text-sm font-bold font-mono text-[#C9A04A]">
                {(explicitHandover.paymentPercent || 0).toFixed(1)}%
              </span>
            </div>
          )}

          {/* Total validation */}
          <div
            className={cn(
              "mt-2 px-3 py-2.5 rounded-lg flex items-center justify-between",
              isValidTotal
                ? "bg-theme-positive/8 border border-theme-positive/25"
                : "bg-theme-negative/8 border border-theme-negative/25"
            )}
          >
            <span className="text-xs font-medium text-theme-text">Total</span>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm font-bold font-mono",
                  isValidTotal ? "text-theme-positive" : "text-theme-negative"
                )}
              >
                {totalPercent.toFixed(1)}%
              </span>
              {isValidTotal ? (
                <CheckCircle2 className="w-4 h-4 text-theme-positive" />
              ) : (
                <span className="text-[10px] text-theme-negative font-medium">
                  {totalPercent > 100
                    ? `+${(totalPercent - 100).toFixed(1)}% over`
                    : `${(100 - totalPercent).toFixed(1)}% under`}
                </span>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  };

  const isLoading = !data && !error;
  const isError = !!error;
  const isReview = !!data && !!editedData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-theme-card border-theme-border text-theme-text p-0 gap-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-theme-border/50">
          <DialogTitle className="flex items-center gap-2.5 text-base">
            <div className="w-7 h-7 rounded-lg bg-theme-accent/15 border border-theme-accent/25 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-theme-accent" />
            </div>
            <span>
              {isLoading
                ? "Extracting Payment Plan..."
                : isError
                ? "Extraction Failed"
                : "Review Extracted Data"}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="px-5 py-4">
          {isLoading && renderLoading()}
          {isError && renderError()}
          {isReview && renderReview()}
        </div>

        {/* Footer */}
        <DialogFooter className="px-5 pb-5 pt-3 border-t border-theme-border/50 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="border-theme-border text-theme-text-muted hover:bg-theme-bg hover:text-theme-text"
          >
            Cancel
          </Button>
          {isReview && (
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!isValidTotal}
              className="bg-gradient-to-r from-theme-accent to-theme-accent/80 hover:from-theme-accent/90 hover:to-theme-accent/70 text-white gap-2 shadow-lg shadow-theme-accent/20 font-semibold disabled:opacity-40"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Apply to Plan
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Section header helper ─────────────────────────────────────────
const SectionHeader = ({
  icon: Icon,
  label,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
}) => (
  <div className="flex items-center gap-2">
    <Icon className="w-4 h-4 text-theme-accent/70" />
    <h4 className="text-xs font-semibold text-theme-text uppercase tracking-wider">
      {label}
    </h4>
  </div>
);

// ── Tiny field input helper ───────────────────────────────────────
const FieldInput = ({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) => (
  <div className="space-y-1">
    <label className="text-[10px] font-medium text-theme-text-muted uppercase tracking-wider">
      {label}
    </label>
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 text-xs bg-theme-bg border-theme-border text-theme-text"
    />
  </div>
);
