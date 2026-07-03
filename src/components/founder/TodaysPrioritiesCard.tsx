"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { founderData, type Priority } from "./data";

const statusConfig = {
  urgent: { variant: "danger" as const, label: "Urgent" },
  critical: { variant: "danger" as const, label: "Critical" },
  normal: { variant: "default" as const, label: "Active" },
  watch: { variant: "warning" as const, label: "Watch" },
};

export function TodaysPrioritiesCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="col-span-12 md:col-span-6"
    >
      <Card className="h-full">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950">
            <ListChecks className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <CardTitle>Today&apos;s Priorities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {founderData.priorities.map((priority, i) => (
            <PriorityRow key={priority.id} priority={priority} index={i} />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PriorityRow({ priority, index }: { priority: Priority; index: number }) {
  const config = statusConfig[priority.status];

  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="group flex w-full items-start gap-4 rounded-xl border border-transparent p-4 text-left transition-all hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/50"
    >
      <div className="mt-0.5 text-slate-300 transition-colors group-hover:text-brand-500 dark:text-slate-600">
        <Circle className="h-5 w-5 group-hover:hidden" />
        <CheckCircle2 className="hidden h-5 w-5 group-hover:block" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-slate-900 dark:text-slate-100">
            {priority.title}
          </p>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {priority.description}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <motion.div
              className="h-full rounded-full bg-brand-500"
              initial={{ width: 0 }}
              whileInView={{ width: `${priority.progress}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
            />
          </div>
          <span className="shrink-0 text-xs text-slate-400">{priority.dueLabel}</span>
        </div>
      </div>
    </motion.button>
  );
}
