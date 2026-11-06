import { motion } from "framer-motion";
import { ArrowDownRight, Sparkles } from "lucide-react";
import Badge from "./Badge.jsx";

const nodes = [
  { cx: 118, cy: 39, r: 3, delay: 0 },
  { cx: 174, cy: 75, r: 4, delay: .4 },
  { cx: 104, cy: 104, r: 4, delay: .8 },
  { cx: 222, cy: 126, r: 3, delay: .2 },
  { cx: 164, cy: 157, r: 3, delay: .6 },
  { cx: 65, cy: 151, r: 2.5, delay: 1 },
  { cx: 242, cy: 63, r: 2.5, delay: .5 },
];

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden rounded-[28px] border border-blue-100/90 bg-gradient-to-br from-white via-white to-blue-50/70 px-5 py-7 shadow-[0_18px_48px_rgba(37,99,235,0.09)] sm:px-8 sm:py-9 lg:px-10 lg:py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_5%,rgba(59,130,246,0.13),transparent_44%)]" />
      <div className="absolute -right-4 -top-5 -z-10 hidden h-48 w-48 opacity-70 sm:right-6 sm:top-1 sm:block sm:h-64 sm:w-64">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 90, repeat: Infinity, ease: "linear" }} className="absolute inset-2 rounded-full border border-dashed border-blue-300/35" />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 64, repeat: Infinity, ease: "linear" }} className="absolute inset-9 rounded-full border border-sky-300/40" />
        <svg viewBox="0 0 300 190" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          <g stroke="rgba(37,99,235,.22)" strokeWidth="1">
            <path d="M118 39 174 75 104 104 222 126 164 157 65 151 104 104 118 39 242 63 174 75 222 126" fill="none" />
          </g>
          {nodes.map((node) => <motion.circle key={`${node.cx}-${node.cy}`} cx={node.cx} cy={node.cy} r={node.r} fill={node.delay % 2 ? "#0ea5e9" : "#2563eb"} initial={{ opacity: .35 }} animate={{ opacity: [.35, 1, .35], scale: [1, 1.25, 1] }} transition={{ duration: 3.6, delay: node.delay, repeat: Infinity, ease: "easeInOut" }} />)}
        </svg>
        <motion.div animate={{ y: [0, -8, 0], scale: [1, 1.04, 1] }} transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }} className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-blue-200 bg-gradient-to-br from-white to-blue-50 text-blue-600 shadow-[0_0_45px_rgba(37,99,235,0.2)] backdrop-blur-xl"><Sparkles size={21} /><span className="absolute inset-[-9px] rounded-full border border-blue-300/30" /></motion.div>
      </div>
      <div className="relative max-w-[780px]">
        <Badge tone="indigo"><span className="h-1 w-1 rounded-full bg-blue-500" />OPS INTELLIGENCE · HINDSIGHT MEMORY</Badge>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, ease: [.22, 1, .36, 1] }} className="mt-5 max-w-[760px] text-[clamp(2.5rem,5vw,3.75rem)] font-semibold leading-[1.04] tracking-[-.065em] text-slate-900">Never debug the <span className="gradient-text">same outage twice.</span></motion.h1>
        <p className="mt-5 max-w-[580px] text-sm leading-7 text-slate-600 sm:text-base">Your team's operational memory, ready when production isn't. Turn incidents into learning and find the fix that worked before.</p>
        <a href="#incident-workspace" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-blue-700 transition hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60">Start an investigation <ArrowDownRight size={16} /></a>
      </div>
      <div className="absolute bottom-4 right-5 hidden items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 font-mono text-[9px] text-slate-500 backdrop-blur sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_9px_rgba(16,185,129,.35)]" />LEARNING SYSTEM ACTIVE</div>
    </section>
  );
}
