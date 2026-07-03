"use client";

import { motion } from "framer-motion";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedNumber, formatCompactCurrency } from "./AnimatedNumber";
import { founderData } from "./data";

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export function FinancialIntelligenceCard() {
  const { financial } = founderData;
  const chartData = financial.cashFlow.map((d) => ({
    ...d,
    label: d.month,
    display: d.value,
  }));

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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <CardTitle>Financial Intelligence™</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MetricBox
              label="Revenue YTD"
              value={financial.revenue.actual}
              sub={`+${financial.revenue.ytdGrowth}% vs budget`}
              positive
            />
            <MetricBox
              label="Expenses YTD"
              value={financial.expenses.actual}
              sub={`${financial.expenses.variance}% under budget`}
              positive
            />
            <MetricBox
              label="EBITDA"
              value={financial.ebitda.value}
              sub={`${financial.ebitda.margin}% margin`}
              positive
            />
            <MetricBox
              label="Budget Remaining"
              value={financial.budget.remaining}
              sub="Q1 allocation"
            />
          </div>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-400">
              Cash Flow — 6 Month Trend
            </p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickFormatter={(v) => `$${v / 1000}K`}
                    width={48}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      fontSize: 13,
                    }}
                    formatter={(value) => [formatCurrency(Number(value)), "Cash Flow"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="display"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fill="url(#cashGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[
              { q: "Q2", val: financial.forecast.q2 },
              { q: "Q3", val: financial.forecast.q3 },
              { q: "Q4", val: financial.forecast.q4 },
            ].map((f) => (
              <div
                key={f.q}
                className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50"
              >
                <p className="text-xs text-slate-400">{f.q} Forecast</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(f.val)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MetricBox({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: number;
  sub: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
        <AnimatedNumber
          value={value}
          prefix="$"
          format={formatCompactCurrency}
        />
      </p>
      <p
        className={`mt-0.5 flex items-center gap-1 text-xs ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}
      >
        {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {sub}
      </p>
    </div>
  );
}
