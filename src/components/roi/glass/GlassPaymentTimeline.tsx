import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineNode {
  label: string;
  percentage: number;
  completed?: boolean;
  current?: boolean;
}

interface GlassPaymentTimelineProps {
  nodes: TimelineNode[];
}

export const GlassPaymentTimeline = ({ nodes }: GlassPaymentTimelineProps) => {
  return (
    <motion.div
      className="glass-card rounded-3xl p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-5">
        Payment Schedule
      </h3>

      <div className="relative">
        {/* Progress line background */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/10" />
        
        {/* Progress line filled */}
        <motion.div 
          className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-theme-accent to-theme-accent-secondary"
          initial={{ width: 0 }}
          animate={{ 
            width: `${(nodes.filter(n => n.completed).length / nodes.length) * 100}%` 
          }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        />

        {/* Nodes */}
        <div className="relative flex justify-between">
          {nodes.map((node, index) => (
            <motion.div
              key={node.label}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              {/* Node circle */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  node.completed
                    ? "bg-gradient-to-br from-theme-accent to-theme-accent-secondary shadow-lg"
                    : node.current
                    ? "bg-white/20 border-2 border-theme-accent"
                    : "bg-white/10 border border-white/20"
                )}
              >
                {node.completed ? (
                  <Check className="w-4 h-4 text-black" />
                ) : (
                  <span className="text-xs font-bold text-white/60">
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Percentage badge */}
              <div className={cn(
                "mt-2 px-2 py-0.5 rounded-full text-xs font-semibold",
                node.completed || node.current
                  ? "bg-theme-accent/20 text-theme-accent"
                  : "bg-white/5 text-white/50"
              )}>
                {node.percentage}%
              </div>

              {/* Label */}
              <span className={cn(
                "mt-1.5 text-[10px] uppercase tracking-wider text-center max-w-[60px]",
                node.completed || node.current ? "text-white/70" : "text-white/40"
              )}>
                {node.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
