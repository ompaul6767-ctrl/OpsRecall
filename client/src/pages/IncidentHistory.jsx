import { Activity, ArrowUpRight, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../components/Badge.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Spinner from "../components/Spinner.jsx";
import { getIncidents } from "../services/api.js";
import { staggerContainer } from "../utils/motion.js";
import { showErrorToast } from "../utils/toast.js";

export default function IncidentHistory() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [error, setError] = useState("");
  const load = () => {
    setLoading(true);
    setError("");
    getIncidents().then(setIncidents).catch((reason) => { setError(reason.message); showErrorToast(reason.message); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => incidents.filter((incident) => (status === "All" || incident.status === status) && `${incident.id} ${incident.title}`.toLowerCase().includes(search.toLowerCase())), [incidents, search, status]);
  return (
    <div className="space-y-6 sm:space-y-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Badge tone="indigo"><Activity size={11} />OPERATIONS</Badge>
        <h1 className="gradient-text mt-4 text-3xl font-semibold tracking-[-.055em] sm:text-4xl">Incident history</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">A searchable timeline of investigations, outcomes, and operational memory.</p>
      </motion.div>
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <label className="relative block w-full sm:max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Search incidents" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search incident ID or log…" className="focus-glow min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 caret-blue-600 outline-none selection:bg-blue-300 selection:text-slate-900 transition placeholder:text-slate-500" /></label>
          <label className="flex items-center gap-2"><span className="text-xs font-medium text-slate-600">Status</span><select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)} className="focus-glow min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"><option>All</option><option>Open</option><option>Resolved</option></select></label>
        </div>
        {loading ? <Spinner label="Loading incidents…" /> : error ? <div className="p-8 text-center"><p className="mb-4 text-[11px] text-slate-600">{error}</p><Button variant="secondary" onClick={load}>Retry</Button></div> : filtered.length === 0 ? <div className="py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-blue-100 bg-blue-50"><Activity className="text-blue-500" size={20} /></div><p className="mt-4 text-[12px] font-medium text-slate-800">No incidents found</p><p className="mt-1 text-[10px] text-slate-500">{incidents.length ? "Try changing the search or status filter." : "Analyze a production signal to start your history."}</p></div> : <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left"><thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 text-[10px] uppercase tracking-[.14em] text-slate-500 backdrop-blur"><tr><th className="px-5 py-4 font-semibold">Incident</th><th className="px-5 py-4 font-semibold">Signal</th><th className="px-5 py-4 font-semibold">Status</th><th className="px-5 py-4 font-semibold">Memory</th><th className="px-5 py-4 font-semibold">Created</th><th className="px-5 py-4" /></tr></thead>
            <motion.tbody variants={staggerContainer} initial="hidden" animate="show" className="divide-y divide-slate-100">{filtered.map((incident) => <motion.tr key={incident.id} variants={{ hidden: { opacity: 0, y: 5 }, show: { opacity: 1, y: 0, transition: { duration: .22 } } }} className="group transition-colors duration-200 hover:bg-blue-50/70"><td className="px-5 py-4"><Link className="font-mono text-xs font-medium text-blue-700 hover:text-blue-900" to={`/incidents/${encodeURIComponent(incident.id)}`}>{incident.id}</Link></td><td className="max-w-[360px] px-5 py-4"><Link className="block truncate text-sm text-slate-700" title={incident.title} to={`/incidents/${encodeURIComponent(incident.id)}`}>{incident.title || "Untitled signal"}</Link></td><td className="px-5 py-4"><Badge tone={incident.status === "Resolved" ? "green" : "amber"}><span className={`h-1.5 w-1.5 rounded-full ${incident.status === "Resolved" ? "bg-emerald-500" : "animate-pulse bg-amber-500"}`} />{incident.status}</Badge></td><td className="px-5 py-4">{incident.memoryUsed ? <Badge tone="green">Recalled</Badge> : <span className="text-xs text-slate-400">—</span>}</td><td className="px-5 py-4 text-xs text-slate-600">{incident.createdAt ? new Date(incident.createdAt).toLocaleString() : "—"}</td><td className="px-5 py-4 text-right"><Link to={`/incidents/${encodeURIComponent(incident.id)}`} aria-label={`View ${incident.id}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 group-hover:translate-x-0.5 group-hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"><ArrowUpRight size={17} /></Link></td></motion.tr>)}</motion.tbody>
          </table>
        </div>}
      </Card>
    </div>
  );
}
