"use client";

import { Bell, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { founderData } from "./data";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function FounderHeader() {
  const today = formatDate(new Date());

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-[#fafbfc]/80 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 dark:bg-white">
            <span className="text-sm font-bold tracking-tight text-white dark:text-slate-900">
              JAG
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              Founder Operating Center™
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Jimmy&apos;s Academy Group
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <time className="hidden text-sm text-slate-500 md:block dark:text-slate-400">
            {today}
          </time>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="text-slate-500" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brand-500" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings className="text-slate-500" />
            </Button>
          </div>

          <div className="flex items-center gap-3 border-l border-slate-200 pl-4 dark:border-slate-800">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-xs">
                {founderData.user.avatarInitials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {founderData.user.fullName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {founderData.user.title}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
