"use client";

import { motion } from "framer-motion";
import { HelpCircle, Lightbulb, ThumbsUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { founderData, type Recommendation } from "./data";

export function AIRecommendationsCard() {
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950">
            <Lightbulb className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          </div>
          <CardTitle>AI Recommendations™</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {founderData.recommendations.map((rec, i) => (
            <RecommendationCard key={rec.id} recommendation={rec} index={i} />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function RecommendationCard({
  recommendation,
  index,
}: {
  recommendation: Recommendation;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="rounded-xl border border-slate-100 p-5 dark:border-slate-800"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium leading-snug text-slate-900 dark:text-slate-100">
          {recommendation.title}
        </p>
        <div className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
          {recommendation.confidence}% confidence
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {recommendation.evidence}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="brand">
          <ThumbsUp className="h-3.5 w-3.5" />
          Approve
        </Button>
        <Button size="sm" variant="outline">
          <HelpCircle className="h-3.5 w-3.5" />
          Ask Why
        </Button>
        <Button size="sm" variant="ghost">
          <X className="h-3.5 w-3.5" />
          Dismiss
        </Button>
      </div>
    </motion.div>
  );
}
