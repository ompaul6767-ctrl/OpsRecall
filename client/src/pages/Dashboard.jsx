import { AlertCircle, ArrowRight, BarChart3, BrainCircuit, Check, CheckCircle2, Clock3, Database, GitCompareArrows, Layers3, RotateCw, Sparkles, TerminalSquare } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Badge from "../components/Badge.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Hero from "../components/Hero.jsx";
import MemoryCard from "../components/MemoryCard.jsx";
import ResolutionPanel from "../components/ResolutionPanel.jsx";
import StatCard from "../components/StatCard.jsx";
import Toggle from "../components/Toggle.jsx";
import { analyzeIncident, getStats, resolveIncident } from "../services/api.js";
import { staggerContainer } from "../utils/motion.js";

const samples = [
  { label: "502 Bad Gateway", value: "[2025-11-06T09:14:22Z] nginx: [error] upstream timed out (110: Connection timed out) while reading response header from upstream, client: 10.2.4.18, server: checkout.opsrecall.internal, request: \"POST /api/checkout HTTP/1.1\", upstream: \"http://checkout-api:8080/api/checkout\" — returned 502 Bad Gateway in ap-south-1." },
  { label: "Redis timeout", value: "[payments-service] RedisCommandTimeout: command GET timed out after 3000ms connecting to redis-cluster-prod-02.ap-south-1.internal:6379. Pool active=100 idle=0; retries exhausted for charge authorization." },
  { label: "OOMKilled pod", value: "Warning: pod/catalog-api-7c9f8d7b4-xk2mz in namespace production was OOMKilled (exit code 137). Container memory usage 1.04Gi exceeded 1Gi limit after deploy catalog-api-2025.11.06.2; CrashLoopBackOff." },
  { label: "Postgres pool exhausted", value: "[order-writer] ERROR: remaining connection slots are reserved for non-replication superuser connections. postgres orders-db-primary.ap-south-1; connection pool active=80 idle=0; requests timing out." },
];

const initialStats = [
  { key: "totalIncidents", label: "Incidents analyzed", note: "Across this workspace", icon: TerminalSquare, color: "text-blue-600" },
  { key: "resolvedIncidents", label: "Resolved", note: "Closed with engineer feedback", icon: CheckCircle2, color: "text-emerald-600" },
  { key: "memoriesStored", label: "Memories stored", note: "Available to recall", icon: Database, color: "text-sky-600" },
  { key: "avgResolutionImprovement", label: "Recall coverage", note: "Analysis with relevant memory", icon: BarChart3, color: "text-cyan-700", suffix: "%" },
];

const analysisSteps = ["Parsing log…", "Searching Hindsight memory…", "Generating resolution…"];

function LoadingPanel({ step }) {
  return (
    <Card className="min-h-[400px] overflow-hidden p-5 sm:p-6">
      <div className="flex items-center gap-3"><motion.span animate={{ scale: [1, 1.12, 1], opacity: [.65, 1, .65] }} transition={{ duration: 1.5, repeat: Infinity }} className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600"><BrainCircuit size={17} /></motion.span><div><p className="text-[12px] font-semibold text-slate-900">{analysisSteps[step]}</p><p className="mt-1 text-[10px] text-slate-500">Correlating production signals with prior incidents</p></div></div>
      <div className="mt-7 space-y-3">{[1, 2, 3].map((item) => <div key={item} className="shimmer h-16 rounded-xl border border-slate-100" />)}</div>
      <div className="mt-7 space-y-3">{[1, 2, 3, 4].map((item) => <div key={item} className="shimmer h-3 rounded-full" style={{ width: `${94 - item * 12}%` }} />)}</div>
      <div className="mt-8 h-1 overflow-hidden rounded-full bg-blue-100"><motion.div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400" animate={{ x: ["-100%", "300%"] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }} style={{ width: "38%" }} /></div>
    </Card>
  );
}

function EmptyAnalysis() {
  return (
    <Card className="flex min-h-[400px] flex-col items-center justify-center overflow-hidden p-6 text-center">
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-blue-100 bg-blue-50/60">
        <div className="absolute inset-2 rounded-full border border-dashed border-blue-300/70" />
        <BrainCircuit size={27} className="text-blue-500" />
        <span className="absolute right-2 top-5 h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" /><span className="absolute bottom-4 left-2 h-1 w-1 rounded-full bg-blue-600" />
      </div>
      <p className="mt-5 text-[13px] font-semibold text-slate-800">Your signal, understood.</p>
      <p className="mt-2 max-w-[260px] text-[11px] leading-5 text-slate-500">Run an analysis to see a resolution shaped by the incidents your team has already solved.</p>
      <div className="mt-6 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[.15em] text-slate-500"><span className="h-px w-8 bg-slate-200" />Awaiting signal<span className="h-px w-8 bg-slate-200" /></div>
    </Card>
  );
}

export default function Dashboard() {
  const [log, setLog] = useState("");
  const [useMemory, setUseMemory] = useState(true);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareResults, setCompareResults] = useState(null);
  const [compareBusy, setCompareBusy] = useState(false);
  const [stats, setStats] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [resolving, setResolving] = useState(false);
  const [retained, setRetained] = useState(false);
  const [apiError, setApiError] = useState("");
  const [analysisStep, setAnalysisStep] = useState(0);
  const textAreaRef = useRef(null);

  const refreshStats = useCallback(() => getStats().then(setStats).catch((error) => toast.error(error.message)), []);
  useEffect(() => { refreshStats(); }, [refreshStats]);
  useEffect(() => {
    if (!busy && !compareBusy) {
      setAnalysisStep(0);
      return undefined;
    }
    const timer = window.setInterval(() => setAnalysisStep((step) => (step + 1) % analysisSteps.length), 700);
    return () => window.clearInterval(timer);
  }, [busy, compareBusy]);

  const analyze = useCallback(async (memoryOverride = useMemory) => {
    if (!log.trim()) {
      toast.error("Paste an error log or load a sample before analyzing.");
      textAreaRef.current?.focus();
      return null;
    }
    setBusy(true);
    setApiError("");
    setResult(null);
    setRetained(false);
    setFeedback("");
    setRootCause("");
    try {
      const data = await analyzeIncident(log.trim(), memoryOverride);
      setResult(data);
      refreshStats();
      return data;
    } catch (error) {
      setApiError(error.message);
      toast.error(error.message);
      return null;
    } finally {
      setBusy(false);
    }
  }, [log, refreshStats, useMemory]);

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        if (!busy && !compareBusy) analyze();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [analyze, busy, compareBusy]);

  const runCompare = async () => {
    if (!log.trim()) {
      toast.error("Paste an error log before starting compare mode.");
      return;
    }
    setCompareBusy(true);
    setCompareResults(null);
    setApiError("");
    try {
      const [withoutMemory, withMemory] = await Promise.all([
        analyzeIncident(log.trim(), false),
        analyzeIncident(log.trim(), true),
      ]);
      setCompareResults({ withoutMemory, withMemory });
      refreshStats();
    } catch (error) {
      setApiError(error.message);
      toast.error(error.message);
    } finally {
      setCompareBusy(false);
    }
  };

  const markResolved = async (event) => {
    event.preventDefault();
    if (!result?.incidentId) return;
    if (!feedback.trim()) {
      toast.error("Describe the steps you took to fix the incident.");
      return;
    }
    setResolving(true);
    try {
      await resolveIncident(result.incidentId, feedback.trim(), rootCause.trim());
      setRetained(true);
      setResult((current) => ({ ...current, status: "Resolved" }));
      confetti({ particleCount: 85, spread: 64, origin: { y: .72 }, colors: ["#2563eb", "#0ea5e9", "#bfdbfe", "#ffffff"], disableForReducedMotion: true });
      toast.success("Learned! Memory retained in Hindsight", { icon: <BrainCircuit size={17} className="text-emerald-600" /> });
      refreshStats();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setResolving(false);
    }
  };

  const loadSample = (sample) => {
    setLog(sample.value);
    setApiError("");
    textAreaRef.current?.focus();
  };

  return (
    <div className="space-y-7 sm:space-y-9">
      <Hero />

      <motion.section variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {initialStats.map(({ key, ...item }) => <StatCard key={key} {...item} value={stats ? `${stats[key] ?? 0}${item.suffix || ""}` : "—"} />)}
      </motion.section>

      <section id="incident-workspace" className="scroll-mt-24">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[.18em] text-blue-700"><span className="h-px w-5 bg-blue-500" />Triage workspace</div><h2 className="mt-2 text-xl font-semibold tracking-[-.04em] text-slate-900">Investigate an incident</h2><p className="mt-1 text-[11px] text-slate-600">Paste a signal. Bring your team's experience to the response.</p></div>
          <Button variant="secondary" onClick={() => { setCompareOpen((open) => !open); setCompareResults(null); }}><GitCompareArrows size={14} />{compareOpen ? "Close compare" : "Compare memory impact"}</Button>
        </div>
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(330px,.86fr)_minmax(0,1.14fr)]">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
              <div className="flex items-center gap-2.5"><span className="rounded-lg border border-blue-100 bg-blue-50 p-2 text-blue-700"><TerminalSquare size={15} /></span><div><h3 className="text-[12px] font-semibold text-slate-900">Incident signal</h3><p className="mt-0.5 text-[9px] text-slate-500">Logs · traces · alerts</p></div></div>
              <span className="font-mono text-[9px] text-slate-500">01 / INPUT</span>
            </div>
            <div className="p-4 sm:p-5">
              <p className="mb-2.5 text-[9px] font-semibold uppercase tracking-[.15em] text-slate-500">Load a sample signal</p>
              <div className="mb-4 flex flex-wrap gap-1.5">{samples.map((sample) => <button key={sample.label} onClick={() => loadSample(sample)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[9px] font-medium text-slate-600 transition duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">+ {sample.label}</button>)}</div>
              <div className={`overflow-hidden rounded-xl border border-slate-700 bg-navy transition duration-300 focus-within:border-blue-400 focus-within:shadow-[0_0_0_3px_rgba(37,99,235,.16),0_0_30px_rgba(37,99,235,.1)] ${useMemory ? "memory-connected" : ""}`}>
                <div className="flex items-center justify-between border-b border-white/10 px-3 py-2"><div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-rose-400" /><span className="h-1.5 w-1.5 rounded-full bg-amber-300" /><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /></div><span className="font-mono text-[9px] text-slate-300/70">production.log</span><span className="w-8" /></div>
                <textarea ref={textAreaRef} value={log} onChange={(event) => { setLog(event.target.value); setApiError(""); }} placeholder={"Paste an error log here…\n\nExample: upstream timed out while connecting to checkout-api"} className="min-h-[178px] w-full resize-y border-l-2 border-blue-500/80 bg-navy p-3.5 font-mono text-[10px] leading-[1.85] text-slate-100 caret-sky-400 outline-none selection:bg-sky-500/40 selection:text-slate-100 placeholder:text-slate-400 sm:min-h-[216px]" spellCheck="false" />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <Toggle checked={useMemory} onChange={setUseMemory} />
                <Button onClick={() => analyze()} loading={busy} className="min-w-[155px] !px-3 !py-2.5 text-[11px]">{busy ? analysisSteps[analysisStep] : <>Analyze signal <ArrowRight size={14} /></>}</Button>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[9px] text-slate-500"><span className={`h-1.5 w-1.5 rounded-full ${useMemory ? "bg-emerald-500" : "bg-slate-400"}`} />Memory {useMemory ? "will search previous incidents" : "is off — generic response only"}<span className="ml-auto hidden font-mono text-[8px] sm:inline">CTRL + ENTER</span></div>
            </div>
          </Card>

          <div className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              {busy ? <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><LoadingPanel step={analysisStep} /></motion.div>
                : result ? <motion.div key={result.incidentId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .28 }} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Badge tone="indigo">{result.incidentId}</Badge><Badge tone={result.status === "Resolved" ? "green" : "amber"}>{result.status === "Resolved" && <Check size={10} />}{result.status}</Badge><span className="text-[9px] text-slate-500"><Clock3 size={10} className="mr-1 inline" />{result.latencyMs}ms</span></div>{result.useMemory && <Badge tone="green"><Sparkles size={10} />{result.memoriesRecalled.length} memories recalled</Badge>}</div>
                  <ResolutionPanel result={result} />
                  <Card className={`p-4 sm:p-5 ${result.useMemory ? "neural-grid border-emerald-200" : "border-slate-200 opacity-80"}`}>
                    <div className="mb-3 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Layers3 size={14} className={result.useMemory ? "text-emerald-600" : "text-slate-500"} /><h3 className="text-[11px] font-semibold text-slate-900">Memories recalled from Hindsight</h3></div>{result.useMemory && <Badge tone="green">{result.memoriesRecalled.length} recalled</Badge>}</div>
                    {!result.useMemory ? <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-center"><Badge tone="amber">No memory used</Badge><p className="mt-2 text-[11px] font-medium text-slate-800">Generic answer · memory is off</p><p className="mt-1 text-[10px] text-slate-600">Turn memory on and analyze again to compare with past incidents.</p></div> : result.memoriesRecalled.length ? <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-2">{result.memoriesRecalled.map((memory) => <MemoryCard key={memory.id} memory={memory} />)}</motion.div> : <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center"><Database className="mx-auto text-slate-400" size={18} /><p className="mt-2 text-[11px] text-slate-700">No matching memories yet</p><p className="mt-1 text-[9px] text-slate-500">Resolve this incident to teach OpsRecall a runbook.</p></div>}
                  </Card>
                </motion.div>
                : <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><EmptyAnalysis /></motion.div>}
            </AnimatePresence>
          </div>
        </div>

        {apiError && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} role="alert" className="mt-4 flex flex-col justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" /><div><p className="text-[11px] font-medium text-rose-800">Analysis could not be completed</p><p className="mt-1 text-[10px] text-slate-600">{apiError}</p></div></div><Button variant="secondary" onClick={() => analyze()}><RotateCw size={13} />Retry</Button></motion.div>}
      </section>

      <AnimatePresence>
        {result && <motion.section initial={{ opacity: 0, height: 0, y: 8 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <Card className="p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-600" /><h3 className="text-[12px] font-semibold text-slate-900">Close the loop</h3></div><p className="mt-1 text-[10px] text-slate-600">Document what worked to retain a reusable Hindsight memory.</p></div>{retained && <motion.div initial={{ scale: .8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="animate-pulse rounded-full"><Badge tone="green" className="!px-3 !py-1.5"><Sparkles size={11} />Memory retained ✓</Badge></motion.div>}</div>
            {!retained ? <form onSubmit={markResolved} className="mt-5 grid gap-3 lg:grid-cols-[1fr_.7fr_auto] lg:items-end">
              <label className="block text-[10px] font-medium text-slate-700">What steps did you take to fix it?<textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={3} placeholder="e.g. Rolled back checkout-api, then increased upstream timeout…" className="focus-glow mt-2 w-full resize-y rounded-xl border border-slate-200 bg-navy px-3 py-2.5 font-mono text-[10px] leading-5 text-slate-100 caret-sky-400 outline-none transition selection:bg-sky-500/40 selection:text-slate-100 placeholder:text-slate-400" /></label>
              <label className="block text-[10px] font-medium text-slate-700">Root cause <span className="text-slate-500">(optional)</span><input value={rootCause} onChange={(event) => setRootCause(event.target.value)} placeholder="e.g. Stale connection pool after deploy" className="focus-glow mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-[10px] text-slate-800 caret-blue-600 outline-none transition selection:bg-blue-300 selection:text-slate-900 placeholder:text-slate-500" /></label>
              <Button type="submit" variant="success" loading={resolving} className="mb-0.5"><CheckCircle2 size={14} />{resolving ? "Retaining…" : "Mark resolved"}</Button>
            </form> : <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[11px] text-emerald-800">Feedback saved. This incident is now available for future recall.</p>}
          </Card>
        </motion.section>}
      </AnimatePresence>

      <AnimatePresence>
        {compareOpen && <motion.section initial={{ opacity: 0, height: 0, y: 12 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-4 sm:p-5"><div><div className="flex items-center gap-2"><GitCompareArrows size={15} className="text-blue-600" /><h2 className="text-[12px] font-semibold text-slate-900">The memory advantage</h2></div><p className="mt-1 text-[10px] text-slate-600">Same signal. Two paths. See what your team's experience changes.</p></div><Button onClick={runCompare} loading={compareBusy}><GitCompareArrows size={14} />{compareBusy ? analysisSteps[analysisStep] : "Run comparison"}</Button></div>
            {compareBusy && <div className="grid gap-3 p-4 md:grid-cols-2"><LoadingPanel step={analysisStep} /><LoadingPanel step={analysisStep} /></div>}
            {compareResults && !compareBusy && <motion.div initial={{ opacity: 0, scale: .99 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .35 }} className="relative grid gap-3 p-4 md:grid-cols-2 sm:p-5">
              <div className="pointer-events-none absolute bottom-8 left-1/2 top-8 hidden w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent md:block" />
              <div className="space-y-3 rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/60 to-white p-3"><div className="flex items-center justify-between"><Badge tone="red"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" />WITHOUT MEMORY</Badge><span className="text-[9px] text-slate-500">Generic baseline</span></div><ResolutionPanel result={compareResults.withoutMemory} title="Context-free response" tone="red" /><p className="px-1 text-[9px] text-slate-500">No incident history · generic triage</p></div>
              <div className="space-y-3 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 to-white p-3 shadow-[0_10px_36px_rgba(37,99,235,.1)]"><div className="flex items-center justify-between"><Badge tone="green"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />WITH HINDSIGHT MEMORY</Badge><span className="text-[9px] text-emerald-700">{compareResults.withMemory.memoriesRecalled.length} relevant memories</span></div><ResolutionPanel result={compareResults.withMemory} title="Memory-informed response" tone="green" />{compareResults.withMemory.memoriesRecalled.length > 0 ? <div className="space-y-1.5">{compareResults.withMemory.memoriesRecalled.map((memory) => <div key={memory.id} className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-[10px]"><span className="truncate text-slate-700">{memory.title}</span><span className="ml-3 font-mono text-emerald-700">{Math.round(memory.relevanceScore * 100)}%</span></div>)}</div> : <p className="px-1 text-[9px] text-slate-500">A new incident — resolve it to create the first relevant memory.</p>}</div>
            </motion.div>}
          </Card>
        </motion.section>}
      </AnimatePresence>

      {!result && !busy && <div className="flex items-center justify-center gap-2 text-[9px] text-slate-500"><Clock3 size={11} />Sample logs are safe demo data <span className="text-slate-300">·</span> Press Ctrl+Enter to analyze</div>}
    </div>
  );
}
