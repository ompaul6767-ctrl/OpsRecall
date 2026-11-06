import { BrainCircuit, Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Badge from "../components/Badge.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import MemoryCard from "../components/MemoryCard.jsx";
import Spinner from "../components/Spinner.jsx";
import { getMemories } from "../services/api.js";
import { staggerContainer } from "../utils/motion.js";

export default function MemoryBank() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const load = () => {
    setLoading(true);
    setError("");
    getMemories().then(setMemories).catch((reason) => { setError(reason.message); toast.error(reason.message); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => memories.filter((memory) => `${memory.title} ${memory.rootCause} ${memory.resolutionSteps} ${memory.service || ""}`.toLowerCase().includes(search.toLowerCase())), [memories, search]);
  const learnedCount = memories.filter((memory) => memory.learned).length;
  return (
    <div className="space-y-6 sm:space-y-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><Badge tone="green"><BrainCircuit size={11} />HINDSIGHT · LONG-TERM MEMORY</Badge><h1 className="gradient-text mt-4 text-3xl font-semibold tracking-[-.055em] sm:text-4xl">Memory bank</h1><p className="mt-2 max-w-xl text-[12px] leading-5 text-slate-500">Runbooks distilled from real incidents. Every learned resolution makes your next response smarter.</p></div>
        <div className="flex items-center gap-2"><Badge>{memories.length} memories</Badge>{learnedCount > 0 && <Badge tone="green"><Sparkles size={10} />{learnedCount} learned</Badge>}</div>
      </motion.div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full max-w-lg"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search services, causes, or runbook steps…" className="focus-glow w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-3 text-[10px] text-slate-800 caret-blue-600 outline-none selection:bg-blue-300 selection:text-slate-900 transition placeholder:text-slate-500" /></label>
        <span className="text-[9px] font-mono text-slate-500">{filtered.length} / {memories.length} RECORDS</span>
      </div>
      {loading ? <Spinner label="Loading stored memories…" /> : error ? <div className="py-10 text-center"><p className="mb-4 text-[11px] text-slate-600">{error}</p><Button variant="secondary" onClick={load}>Retry</Button></div> : filtered.length ? <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtered.map((memory) => <MemoryCard key={memory.id} memory={memory} highlight={memory.learned} />)}</motion.div> : <Card className="py-16 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600"><BrainCircuit size={23} /></div><p className="mt-4 text-[12px] font-medium text-slate-800">{memories.length ? "No memories match your search" : "Your memory bank is waiting"}</p><p className="mt-1 text-[10px] text-slate-500">{memories.length ? "Try another search term." : "Resolve your first incident to retain an operational memory."}</p></Card>}
    </div>
  );
}
