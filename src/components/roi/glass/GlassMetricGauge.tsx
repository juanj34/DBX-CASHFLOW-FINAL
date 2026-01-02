import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassMetricGaugeProps {
  value: number;
  maxValue?: number;
  label: string;
  suffix?: string;
  color?: "emerald" | "amber" | "sky" | "purple";
  size?: "sm" | "md" | "lg";
}

const colorMap = {
  emerald: { stroke: "hsl(142, 71%, 45%)", glow: "hsla(142, 71%, 45%, 0.3)" },
  amber: { stroke: "hsl(38, 92%, 50%)", glow: "hsla(38, 92%, 50%, 0.3)" },
  sky: { stroke: "hsl(199, 89%, 48%)", glow: "hsla(199, 89%, 48%, 0.3)" },
  purple: { stroke: "hsl(271, 91%, 65%)", glow: "hsla(271, 91%, 65%, 0.3)" },
};

const sizeMap = {
  sm: { size: 80, strokeWidth: 6, fontSize: "text-lg" },
  md: { size: 100, strokeWidth: 8, fontSize: "text-2xl" },
  lg: { size: 120, strokeWidth: 10, fontSize: "text-3xl" },
};

export const GlassMetricGauge = ({
  value,
  maxValue = 100,
  label,
  suffix = "%",
  color = "emerald",
  size = "md",
}: GlassMetricGaugeProps) => {
  const { size: dimensions, strokeWidth, fontSize } = sizeMap[size];
  const { stroke, glow } = colorMap[color];
  
  const radius = (dimensions - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min((value / maxValue) * 100, 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className="relative"
        style={{ width: dimensions, height: dimensions }}
      >
        {/* Glow effect */}
        <div 
          className="absolute inset-0 rounded-full blur-xl opacity-50"
          style={{ background: glow }}
        />
        
        {/* SVG Gauge */}
        <svg
          width={dimensions}
          height={dimensions}
          className="transform -rotate-90"
        >
          {/* Background track */}
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            r={radius}
            fill="none"
            stroke="hsla(0, 0%, 100%, 0.1)"
            strokeWidth={strokeWidth}
          />
          
          {/* Animated progress arc */}
          <motion.circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          />
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span 
            className={cn("font-bold text-white", fontSize)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {value.toFixed(1)}{suffix}
          </motion.span>
        </div>
      </div>
      
      {/* Label */}
      <span className="text-xs text-white/60 font-medium uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
};
