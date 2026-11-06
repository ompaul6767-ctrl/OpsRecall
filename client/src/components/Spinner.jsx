import { motion } from "framer-motion";
import { LoaderCircle } from "lucide-react";

export default function Spinner({ label = "Loading..." }) {
  return (
    <div className="space-y-4 py-8">
      <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500"><LoaderCircle className="animate-spin text-blue-600" size={15} />{label}</div>
      <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">{[1, 2].map((item) => <div key={item} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card"><div className="shimmer h-3 w-1/3 rounded-full" /><div className="shimmer h-10 rounded-xl" /><div className="shimmer h-3 w-4/5 rounded-full" /></div>)}</div>
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }} className="mx-auto h-px max-w-xs origin-left bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
    </div>
  );
}
