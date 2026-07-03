"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "./AnimatedNumber";

interface CircularGaugeProps {
  label: string;
  value: number;
  color: string;
  size?: number;
  delay?: number;
}

export function CircularGauge({
  label,
  value,
  color,
  size = 72,
  delay = 0,
}: CircularGaugeProps) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, delay: delay + 0.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            <AnimatedNumber value={value} suffix="%" />
          </span>
        </div>
      </div>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </span>
    </motion.div>
  );
}
