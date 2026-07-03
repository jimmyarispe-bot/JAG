"use client";

import { motion } from "framer-motion";
import { ClipboardCheck, FileText, Shield, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { founderData, type GovernanceItem } from "./data";

const typeIcons = {
  "Policy Review": FileText,
  Delegation: UserCheck,
  Exception: Shield,
  "Pending Approval": ClipboardCheck,
};

export function GovernanceQueueCard() {
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
            <ClipboardCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle>Governance Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {founderData.governance.map((item, i) => (
            <GovernanceRow key={item.id} item={item} index={i} />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function GovernanceRow({ item, index }: { item: GovernanceItem; index: number }) {
  const Icon = typeIcons[item.type as keyof typeof typeIcons] ?? FileText;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="flex w-full items-center gap-4 rounded-xl p-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {item.type}
        </p>
        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
          {item.title}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {item.requester} · {item.age} ago
        </p>
      </div>
      <span className="shrink-0 text-xs text-slate-400">Review →</span>
    </motion.button>
  );
}
