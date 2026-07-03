"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { founderData } from "./data";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function FounderHero() {
  const greeting = getGreeting();

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="pt-12 pb-8"
    >
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl dark:text-slate-50">
        {greeting}, {founderData.user.firstName}.
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-500 dark:text-slate-400">
        {founderData.overnightSummary.message}
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" className="group">
          Review My Day
          <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
        </Button>
        <Button size="lg" variant="outline" className="group">
          <Sparkles className="text-brand-600" />
          Ask JAG
        </Button>
      </div>

      <div className="mt-10 flex flex-wrap gap-8 text-sm text-slate-500 dark:text-slate-400">
        <Stat label="Organization Health" value={`${founderData.organization.healthScore}%`} />
        <Stat label="Students" value={String(founderData.organization.students)} />
        <Stat label="Employees" value={String(founderData.organization.employees)} />
        <Stat label="Schools" value={String(founderData.organization.schools)} />
        <Stat
          label="Cash Runway"
          value={`${founderData.organization.cashFlowDays} days`}
          highlight
        />
      </div>
    </motion.section>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-base font-semibold ${highlight ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-slate-100"}`}
      >
        {value}
      </p>
    </div>
  );
}
