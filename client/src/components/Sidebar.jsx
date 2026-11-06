import { Activity, BrainCircuit, LayoutDashboard, Server, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import clsx from "clsx";

const links = [
  { to: "/", label: "Analyze incident", icon: LayoutDashboard, end: true },
  { to: "/incidents", label: "Incident history", icon: Activity },
  { to: "/memory", label: "Memory bank", icon: BrainCircuit },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-[248px] shrink-0 border-r border-slate-200/80 bg-white/85 backdrop-blur-2xl lg:flex lg:flex-col">
      <div className="flex h-[76px] items-center gap-3 border-b border-slate-200/80 px-6">
        <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-[0_4px_14px_rgba(37,99,235,0.22)]"><BrainCircuit size={17} strokeWidth={2.2} /><span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/30" /></span>
        <div><div className="text-[15px] font-semibold tracking-tight text-slate-900">OpsRecall</div><div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[.2em] text-slate-500">Incident intelligence</div></div>
      </div>
      <div className="px-3 pt-7"><p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[.2em] text-slate-600">Workspace</p>
        <nav className="space-y-1">{links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => clsx("group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors", isActive ? "font-medium text-blue-700" : "text-slate-600 hover:text-slate-900")}>{({ isActive }) => <>{isActive && <motion.span layoutId="sidebar-active" className="absolute inset-0 rounded-xl border border-blue-100 bg-blue-50" transition={{ type: "spring", stiffness: 430, damping: 34 }} />}<motion.span whileHover={{ scale: 1.12, rotate: isActive ? 0 : -5 }} className={clsx("relative z-10", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600")}><Icon size={16} /></motion.span><span className="relative z-10">{label}</span>{isActive && <span className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />}</>}</NavLink>)}</nav>
      </div>
      <div className="mt-auto p-4"><div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/90 to-white p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-800"><ShieldCheck size={15} className="text-emerald-600" />Operational memory</div>
        <p className="mt-2 text-[11px] leading-5 text-slate-600">Every incident is an opportunity to make the next response faster.</p>
        <div className="mt-4 flex items-center gap-2 border-t border-blue-100 pt-3 text-[9px] font-semibold uppercase tracking-[.14em] text-slate-500"><Server size={12} />Powered by Hindsight</div>
      </div></div>
    </aside>
  );
}
