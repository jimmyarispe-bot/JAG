"use client";

import { motion } from "framer-motion";
import { Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { founderData, type FocusItem } from "./data";

export function ExecutiveFocusRibbon() {
  return (
    <section className="pb-10">
      <div className="grid gap-4 md:grid-cols-3">
        {founderData.focusItems.map((item, index) => (
          <FocusCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}

function FocusCard({ item, index }: { item: FocusItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="group h-full transition-all duration-300 hover:border-slate-300 hover:shadow-lg dark:hover:border-slate-700">
        <CardContent className="flex h-full flex-col p-6">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold leading-snug text-slate-900 dark:text-slate-50">
              {item.title}
            </h3>
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Clock className="h-3 w-3" />
              {item.estimatedTime}
            </span>
          </div>

          <div className="mt-4 flex items-start gap-2">
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {item.impact}
            </p>
          </div>

          <div className="mt-auto pt-6">
            <Button variant="brand" size="sm" className="w-full sm:w-auto">
              {item.action}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
