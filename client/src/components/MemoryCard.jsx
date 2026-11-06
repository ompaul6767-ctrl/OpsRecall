import { AnimatePresence, motion } from "framer-motion";
import { BrainCircuit, CalendarDays, ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";
import CountUp from "react-countup";
import Badge from "./Badge.jsx";
import Card from "./Card.jsx";
import { fadeUp } from "../utils/motion.js";

export default function MemoryCard({ memory, highlight = false }) {
  const [expanded, setExpanded] = useState(false);
  const score = typeof memory.relevanceScore === "number" ? Math.round(memory.relevanceScore * 100) : null;
  return (
    <motion.div variants={fadeUp} layout>
      <Card className={`overflow-hidden ${highlight ? "border-blue-200 shadow-[0_0_35px_rgba(37,99,235,0.1)]" : ""}`}>
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="relative rounded-xl border border-blue-100 bg-blue-50 p-2.5 text-blue-600"><BrainCircuit size={17} /><span className="absolute -inset-1 -z-10 rounded-xl bg-blue-100/70 blur-md" /></span>
              <div className="min-w-0"><h3 className="text-sm font-semibold leading-5 text-slate-900">{memory.title}</h3><div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500"><CalendarDays size={12} />{memory.date || "Recently retained"}{memory.service && <span className="ml-1 font-mono text-slate-500">· {memory.service}</span>}</div></div>
            </div>
            {highlight ? <Badge tone="green" className="animate-pulse"><Sparkles size={10} />NEW</Badge> : score !== null && <Badge tone="green">Recalled</Badge>}
          </div>
          <AnimatePresence initial={false}>
            {expanded && <motion.div initial={{ height: 0, opacity: 0, y: -4 }} animate={{ height: "auto", opacity: 1, y: 0 }} exit={{ height: 0, opacity: 0, y: -4 }} transition={{ duration: 0.24 }} className="overflow-hidden">
              <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                <div><p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">Root cause</p><p className="text-[13px] leading-6 text-slate-700">{memory.rootCause || "Not documented"}</p></div>
                <div><p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">Resolution playbook</p><p className="whitespace-pre-line text-[13px] leading-6 text-slate-600">{memory.resolutionSteps || "No resolution steps recorded."}</p></div>
              </div>
            </motion.div>}
          </AnimatePresence>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            {score !== null ? <div className="flex flex-1 items-center gap-2.5"><span className="shrink-0 text-[11px] text-slate-500">Relevance</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-blue-100"><motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: .85, ease: [.22, 1, .36, 1] }} className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400 shadow-[0_0_10px_rgba(37,99,235,0.3)]" /></div><span className="w-9 text-right font-mono text-[11px] text-blue-700"><CountUp end={score} duration={1.1} suffix="%" /></span></div> : <span className="text-[10px] font-medium uppercase tracking-[.12em] text-slate-500">{memory.learned ? "Learned from incident" : "Hindsight memory"}</span>}
            <button type="button" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded} className="ml-3 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60">{expanded ? "Collapse" : "Details"}<motion.span animate={{ rotate: expanded ? 180 : 0 }}><ChevronDown size={14} /></motion.span></button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
