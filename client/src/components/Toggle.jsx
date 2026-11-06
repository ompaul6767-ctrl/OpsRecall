import { AnimatePresence, motion } from "framer-motion";
import { BrainCircuit, Network, Sparkles } from "lucide-react";
import { softSpring } from "../utils/motion.js";

export default function Toggle({ checked, onChange, label = "Memory" }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="group relative inline-flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-4 focus-visible:ring-offset-white">
      <span className="relative flex h-9 w-[62px] items-center">
        <motion.span animate={{ backgroundColor: checked ? "#2563eb" : "#e2e8f0", boxShadow: checked ? "0 0 22px rgba(37,99,235,.28)" : "0 0 0 rgba(0,0,0,0)" }} transition={softSpring} className="absolute inset-0 rounded-full border border-slate-200" />
        <AnimatePresence>{checked && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="neural-grid absolute inset-0 rounded-full" />}</AnimatePresence>
        <motion.span layout transition={softSpring} animate={{ x: checked ? 29 : 4 }} className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full shadow-lg ${checked ? "bg-white text-blue-600 shadow-blue-900/20" : "bg-white text-slate-500"}`}>
          <BrainCircuit size={14} />
        </motion.span>
        <AnimatePresence>{checked && <motion.span initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }} className="absolute -right-1 -top-1 text-blue-700"><Sparkles size={11} /></motion.span>}</AnimatePresence>
      </span>
      <span><span className={`flex items-center gap-1.5 text-[13px] font-semibold ${checked ? "text-blue-700" : "text-slate-500"}`}>{label} {checked ? "ON" : "OFF"}{checked && <Network size={12} className="text-blue-500" />}</span><span className="mt-0.5 block text-[10px] text-slate-500">{checked ? "Recall past incidents" : "Generic analysis only"}</span></span>
    </button>
  );
}
