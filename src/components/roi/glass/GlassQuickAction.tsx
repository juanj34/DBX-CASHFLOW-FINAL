import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlassQuickActionProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  color?: "sky" | "purple" | "amber" | "emerald";
}

const colorMap = {
  sky: "bg-sky-500/20 text-sky-300",
  purple: "bg-purple-500/20 text-purple-300",
  amber: "bg-amber-500/20 text-amber-300",
  emerald: "bg-emerald-500/20 text-emerald-300",
};

export const GlassQuickAction = ({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  color = "sky",
}: GlassQuickActionProps) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "glass-card rounded-2xl p-4 flex flex-col items-center gap-2 transition-all w-full",
        disabled
          ? "opacity-40 cursor-not-allowed"
          : "hover:scale-105 hover:border-white/20 cursor-pointer"
      )}
      whileHover={!disabled ? { y: -2 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
    >
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", colorMap[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs font-medium text-white/70">{label}</span>
    </motion.button>
  );
};
