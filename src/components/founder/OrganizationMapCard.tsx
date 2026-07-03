"use client";

import { motion } from "framer-motion";
import { AlertTriangle, MapPin, School } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedNumber } from "./AnimatedNumber";
import { founderData, type School as SchoolType } from "./data";

const statusBadge = {
  healthy: { variant: "success" as const, label: "Healthy" },
  watch: { variant: "warning" as const, label: "Watch" },
};

export function OrganizationMapCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="col-span-12 lg:col-span-7"
    >
      <Card className="h-full">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950">
            <MapPin className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </div>
          <CardTitle>Organization Map™</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {founderData.schools.map((school, i) => (
              <SchoolCard key={school.id} school={school} index={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SchoolCard({ school, index }: { school: SchoolType; index: number }) {
  const badge = statusBadge[school.status];
  const enrollmentPct = Math.round((school.enrollment / school.capacity) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group rounded-xl border border-slate-100 p-4 transition-all hover:border-slate-200 hover:shadow-md dark:border-slate-800 dark:hover:border-slate-700"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
            <School className="h-4 w-4 text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {school.location}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{school.name}</p>
          </div>
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-slate-400">Enrollment</p>
          <p className="font-medium text-slate-900 dark:text-slate-100">
            <AnimatedNumber value={school.enrollment} />
            <span className="text-slate-400"> / {school.capacity}</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Attendance</p>
          <p className="font-medium text-slate-900 dark:text-slate-100">
            <AnimatedNumber value={school.attendance} decimals={1} suffix="%" />
          </p>
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <motion.div
          className={`h-full rounded-full ${enrollmentPct >= 90 ? "bg-emerald-500" : enrollmentPct >= 80 ? "bg-amber-500" : "bg-rose-500"}`}
          initial={{ width: 0 }}
          whileInView={{ width: `${enrollmentPct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
      </div>

      {school.alerts > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          {school.alerts} active alert{school.alerts > 1 ? "s" : ""}
        </div>
      )}
    </motion.div>
  );
}
