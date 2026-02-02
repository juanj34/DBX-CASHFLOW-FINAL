import { Home } from "lucide-react";
import { RentSection } from "./RentSection";
import { ConfiguratorSectionProps } from "./types";

export const RentalSection = ({ inputs, setInputs, currency }: ConfiguratorSectionProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-theme-text mb-1">Rental Strategy</h3>
        <p className="text-sm text-theme-text-muted">Configure yield, service charges, and short-term rental comparison</p>
      </div>

      <div className="border border-theme-border rounded-xl overflow-hidden bg-theme-card p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-theme-rental/10">
            <Home className="w-4 h-4 text-theme-rental" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-theme-text">Long-Term & Short-Term Rental</h4>
            <p className="text-xs text-theme-text-muted">Configure rental income projections</p>
          </div>
        </div>
        
        <RentSection inputs={inputs} setInputs={setInputs} currency={currency} />
      </div>

      {/* Tip */}
      <div className="text-xs text-theme-text-muted px-1">
        <p>💡 Net yield accounts for service charges. Enable Airbnb comparison to see short-term rental potential.</p>
      </div>
    </div>
  );
};
