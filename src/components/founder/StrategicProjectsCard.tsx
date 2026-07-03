"use client";

import { motion } from "framer-motion";
import { FolderKanban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { founderData, type Project } from "./data";

const riskConfig = {
  low: { variant: "success" as const, label: "Low Risk" },
  medium: { variant: "warning" as const, label: "Medium Risk" },
  high: { variant: "danger" as const, label: "High Risk" },
};

export function StrategicProjectsCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="col-span-12 lg:col-span-5"
    >
      <Card className="h-full">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950">
            <FolderKanban className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <CardTitle>Strategic Projects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {founderData.projects.map((project, i) => (
            <ProjectRow key={project.id} project={project} index={i} />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ProjectRow({ project, index }: { project: Project; index: number }) {
  const risk = riskConfig[project.risk];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="rounded-xl border border-slate-100 p-4 dark:border-slate-800"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {project.name}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Owner: {project.owner}
          </p>
        </div>
        <Badge variant={risk.variant}>{risk.label}</Badge>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-indigo-500"
            initial={{ width: 0 }}
            whileInView={{ width: `${project.completion}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15 + index * 0.08 }}
          />
        </div>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {project.completion}%
        </span>
      </div>
    </motion.div>
  );
}
