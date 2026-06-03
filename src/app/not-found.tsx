import { SearchX } from "lucide-react";
import Link from "next/link";

import { SectionPanel } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="grid min-h-[52vh] place-items-center">
      <SectionPanel className="max-w-2xl p-6 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-md border border-cyan-300 bg-cyan-50 text-cyan-800 dark:border-cyan-500/50 dark:bg-cyan-950/40 dark:text-cyan-200">
          <SearchX className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-3xl font-black text-slate-950 dark:text-slate-50">
          Page not found
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          This NDL page may have moved, been retired, or never existed.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-cyan-700 px-4 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
          >
            Back to ranked list
          </Link>
          <Link
            href="/rules"
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950/50"
          >
            View rules
          </Link>
        </div>
      </SectionPanel>
    </div>
  );
}
