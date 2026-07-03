"use client";

import { motion } from "framer-motion";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { founderData } from "./data";

function renderBrief(text: string) {
  return text.split("\n\n").map((paragraph, i) => {
    const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="mb-4 last:mb-0 leading-relaxed text-slate-600 dark:text-slate-300">
        {parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={j} className="font-semibold text-slate-900 dark:text-slate-100">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        })}
      </p>
    );
  });
}

export function AIBriefCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="col-span-12 lg:col-span-7"
    >
      <Card className="h-full">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950">
              <Bot className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <CardTitle>AI Executive Brief</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Updated overnight · 6:00 AM
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl bg-slate-50 p-5 dark:bg-slate-800/50">
            <div className="text-[15px]">{renderBrief(founderData.aiBrief)}</div>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
            <input
              type="text"
              placeholder="Ask a follow-up question..."
              className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
            />
            <Button size="icon" variant="brand" className="h-8 w-8 shrink-0">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
