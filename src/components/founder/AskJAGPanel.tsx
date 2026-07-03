"use client";

import { motion } from "framer-motion";
import { ArrowUp, Mic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { founderData } from "./data";

export function AskJAGPanel() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="pb-16 pt-4"
    >
      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
        <CardContent className="p-0">
          <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 shadow-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Ask JAG
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Your AI guide to everything happening in your organization
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-5 flex flex-wrap gap-2">
              {founderData.askJagPrompts.map((prompt) => (
                <button
                  key={prompt}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:bg-brand-950 dark:hover:text-brand-300"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <textarea
                rows={2}
                placeholder="Ask anything about your organization..."
                className="flex-1 resize-none bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
              />
              <div className="flex shrink-0 gap-2">
                <Button variant="ghost" size="icon" aria-label="Voice input">
                  <Mic className="h-5 w-5 text-slate-400" />
                </Button>
                <Button size="icon" variant="brand" className="h-10 w-10 rounded-xl">
                  <ArrowUp className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}
