"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularGauge } from "./CircularGauge";
import { AnimatedNumber } from "./AnimatedNumber";
import { founderData } from "./data";

export function OrganizationHealthCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="col-span-12 lg:col-span-5"
    >
      <Card className="h-full">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
              <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle>Organization Health™</CardTitle>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              <AnimatedNumber value={founderData.organization.healthScore} suffix="%" />
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">+2% this week</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-y-6 gap-x-4 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
            {founderData.healthMetrics.map((metric, i) => (
              <CircularGauge
                key={metric.label}
                label={metric.label}
                value={metric.value}
                color={metric.color}
                size={i === 0 ? 80 : 68}
                delay={i * 0.06}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
