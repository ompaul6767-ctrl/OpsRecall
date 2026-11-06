import CountUp from "react-countup";
import { motion } from "framer-motion";
import { fadeUp } from "../utils/motion.js";
import Card from "./Card.jsx";

function Sparkline({ color }) {
  return <svg viewBox="0 0 88 30" className={`h-8 w-[88px] opacity-70 ${color}`} aria-hidden="true"><path d="M1 22C9 21 11 12 19 16s10 7 17 2 9-12 17-9 10 8 17 4 9-9 17-9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M1 22C9 21 11 12 19 16s10 7 17 2 9-12 17-9 10 8 17 4 9-9 17-9v26H1Z" fill="currentColor" opacity=".08" /></svg>;
}

export default function StatCard({ label, value, note, icon: Icon, color = "text-blue-600" }) {
  const parsedValue = Number.parseFloat(String(value ?? "").replace(/[^\d.-]/g, ""));
  const suffix = String(value ?? "").replace(/[\d.,-]/g, "");
  const hasNumber = Number.isFinite(parsedValue);
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -3, transition: { duration: 0.2 } }}>
      <Card className="group h-full p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0"><p className="text-xs font-medium text-slate-600">{label}</p><p className="mt-3 text-3xl font-semibold leading-none tracking-[-.045em] text-slate-900 sm:text-[32px]">{hasNumber ? <CountUp end={parsedValue} duration={1.35} separator="," suffix={suffix} /> : value ?? "—"}</p><p className="mt-2 text-xs text-slate-500">{note}</p></div>
          {Icon && <motion.span whileHover={{ scale: 1.08, rotate: 4 }} className={`rounded-xl border border-blue-100 bg-blue-50 p-2.5 ${color}`}><Icon size={16} /></motion.span>}
        </div>
        <div className="mt-3 flex items-end justify-between"><span className={`text-[10px] font-semibold uppercase tracking-[.14em] ${color}`}>Live insight</span><Sparkline color={color} /></div>
      </Card>
    </motion.div>
  );
}
