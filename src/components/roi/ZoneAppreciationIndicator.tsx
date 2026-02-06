import { getZoneAppreciationProfile, ZoneAppreciationProfile } from "./useOICalculations";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Building, Home, Shield } from "lucide-react";

interface ZoneAppreciationIndicatorProps {
  maturityLevel: number;
  zoneName?: string;
  compact?: boolean;
}

const getRiskBadgeColor = (riskLevel: ZoneAppreciationProfile['riskLevel']) => {
  switch (riskLevel) {
    case 'high':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'medium-high':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'low-medium':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'low':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
  }
};

const getMaturityLabel = (level: number): string => {
  if (level <= 25) return 'Emerging';
  if (level <= 50) return 'Developing';
  if (level <= 75) return 'Growing';
  if (level <= 90) return 'Mature';
  return 'Established';
};

export const ZoneAppreciationIndicator = ({ maturityLevel, zoneName, compact = false }: ZoneAppreciationIndicatorProps) => {
  const profile = getZoneAppreciationProfile(maturityLevel);
  
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-[#1a1f2e] rounded-lg border border-[#2a3142]">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Zone:</span>
          <span className="text-xs font-medium text-white">{maturityLevel}%</span>
        </div>
        <div className="h-3 w-px bg-[#2a3142]" />
        <div className="flex gap-1 text-xs">
          <span className="text-orange-400">{profile.constructionAppreciation}%</span>
          <span className="text-gray-500">→</span>
          <span className="text-green-400">{profile.growthAppreciation}%</span>
          <span className="text-gray-500">→</span>
          <span className="text-blue-400">{profile.matureAppreciation}%</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-[#1a1f2e] rounded-xl border border-[#2a3142] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#CCFF00]" />
          <span className="text-sm font-medium text-white">Zone Appreciation Profile</span>
        </div>
        {zoneName && (
          <span className="text-xs text-gray-400">{zoneName}</span>
        )}
      </div>
      
      {/* Maturity Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Zone Maturity</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{getMaturityLabel(maturityLevel)}</span>
            <span className="text-sm font-bold text-[#CCFF00]">{maturityLevel}%</span>
          </div>
        </div>
        <Progress value={maturityLevel} className="h-2 bg-[#2a3142]" />
      </div>
      
      {/* Phases Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
          <Building className="w-4 h-4 text-orange-400 mx-auto mb-1" />
          <div className="text-xs text-gray-400">Under Construction</div>
          <div className="text-lg font-bold text-orange-400">{profile.constructionAppreciation}%</div>
        </div>
        <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/30">
          <TrendingUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <div className="text-xs text-gray-400">Post Handover ({profile.growthPeriodYears}y)</div>
          <div className="text-lg font-bold text-green-400">{profile.growthAppreciation}%</div>
        </div>
        <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <Home className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <div className="text-xs text-gray-400">Zone Maturity</div>
          <div className="text-lg font-bold text-blue-400">{profile.matureAppreciation}%</div>
        </div>
      </div>
      
      {/* Risk Badge */}
      <div className="flex items-center justify-between pt-2 border-t border-[#2a3142]">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400">Risk Level</span>
        </div>
        <Badge 
          variant="outline" 
          className={`text-xs ${getRiskBadgeColor(profile.riskLevel)}`}
        >
          {profile.description}
        </Badge>
      </div>
    </div>
  );
};
