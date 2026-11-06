import { Activity, BrainCircuit, LayoutDashboard, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { getHealth } from "../services/api.js";
import Badge from "./Badge.jsx";
import Sidebar from "./Sidebar.jsx";
import { pageTransition } from "../utils/motion.js";

const mobileLinks = [
  { to: "/", label: "Analyze", icon: LayoutDashboard, end: true },
  { to: "/incidents", label: "Incidents", icon: Activity },
  { to: "/memory", label: "Memory", icon: BrainCircuit },
];

export default function Layout() {
  const [connected, setConnected] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    let active = true;
    const check = () => getHealth().then((data) => { if (active) setConnected(Boolean(data.ok)); }).catch(() => { if (active) setConnected(false); });
    check();
    const timer = window.setInterval(check, 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  const title = location.pathname.startsWith("/incidents/") ? "Incident detail" : location.pathname.startsWith("/incidents") ? "Incident history" : location.pathname.startsWith("/memory") ? "Memory bank" : location.pathname === "/404" ? "Page not found" : "Incident analysis";
  return (
    <div className="relative min-h-screen overflow-x-clip bg-transparent text-slate-900">
      <div className="app-aurora" aria-hidden="true" /><div className="app-grid" aria-hidden="true" />
      <div className="relative z-10 flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 shadow-[0_1px_8px_rgba(15,23,42,0.03)] backdrop-blur-2xl sm:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 lg:hidden">{mobileOpen ? <X size={18} /> : <Menu size={18} />}</button>
              <span className="hidden h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-[0_0_22px_rgba(37,99,235,0.2)] lg:flex"><BrainCircuit size={16} /></span>
              <div className="min-w-0"><p className="truncate text-sm font-semibold tracking-tight text-slate-900">{title}</p><p className="hidden text-xs text-slate-500 sm:block">OpsRecall <span className="px-1 text-slate-300">/</span> Incident response workspace</p></div>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-4">
              <Badge tone={connected ? "green" : "amber"} className="!px-3 !py-2">
                <span className={`relative mr-0.5 flex h-1.5 w-1.5 ${connected ? "animate-pulse" : ""}`}><span className={`absolute h-full w-full rounded-full ${connected ? "bg-emerald-300/50" : "bg-amber-300/40"}`} /><span className={`relative h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-300" : "bg-amber-300"}`} /></span>
                <span className="hidden sm:inline">Memory:</span> {connected ? "Connected" : "Disconnected"} <span className="hidden sm:inline">(Hindsight)</span>
              </Badge>
              <span className="hidden h-7 w-px bg-slate-200 sm:block" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-100 bg-gradient-to-br from-blue-50 to-sky-100 text-[10px] font-bold text-blue-700" aria-label="User avatar">SR</div>
            </div>
          </header>
          <AnimatePresence initial={false}>
            {mobileOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 lg:hidden">
              <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-slate-950/25 backdrop-blur-[2px]" />
              <motion.nav initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 360, damping: 34 }} aria-label="Main navigation" className="absolute inset-y-0 left-0 flex w-[min(84vw,320px)] flex-col border-r border-slate-200 bg-white p-5 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-glow"><BrainCircuit size={18} /></span>
                  <div><p className="text-sm font-semibold text-slate-900">OpsRecall</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">Incident intelligence</p></div>
                </div>
                <p className="mb-3 mt-7 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Workspace</p>
                <div className="space-y-1">{mobileLinks.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}><Icon size={17} />{label}</NavLink>)}</div>
                <div className="mt-auto rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4"><p className="text-xs font-semibold text-slate-800">Operational memory</p><p className="mt-2 text-xs leading-5 text-slate-600">Never debug the same outage twice.</p></div>
              </motion.nav>
            </motion.div>}
          </AnimatePresence>
          <AnimatePresence mode="wait" initial={false}>
            <motion.main key={location.pathname} variants={pageTransition} initial="initial" animate="animate" exit="exit" className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-6 sm:px-7 sm:py-9 xl:px-10">
              <Outlet />
            </motion.main>
          </AnimatePresence>
          <footer className="border-t border-slate-200/80 px-5 py-5 text-center text-[10px] font-medium uppercase tracking-[.14em] text-slate-500">OpsRecall <span className="mx-1.5 text-slate-300">·</span> Never debug the same outage twice</footer>
        </div>
      </div>
    </div>
  );
}
