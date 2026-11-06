import { ArrowLeft, FileText, Layers3 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Badge from "../components/Badge.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import MemoryCard from "../components/MemoryCard.jsx";
import ResolutionPanel from "../components/ResolutionPanel.jsx";
import Spinner from "../components/Spinner.jsx";
import { getIncident } from "../services/api.js";
import { showErrorToast } from "../utils/toast.js";

export default function IncidentDetail() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = () => {
    setLoading(true);
    setError("");
    getIncident(id).then(setIncident).catch((reason) => { setError(reason.message); showErrorToast(reason.message); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [id]);
  if (loading) return <Spinner label="Loading incident detail…" />;
  if (error || !incident) return <div className="mx-auto max-w-xl py-16 text-center"><p className="text-[11px] text-slate-600">{error || "Incident not found."}</p><div className="mt-5 flex justify-center gap-3"><Button variant="secondary" onClick={load}>Retry</Button><Link to="/incidents"><Button variant="subtle">Back to history</Button></Link></div></div>;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 sm:space-y-7">
      <Link to="/incidents" className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-sm text-slate-600 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"><ArrowLeft size={15} />Back to incident history</Link>
      <div className="flex flex-wrap items-center gap-2"><Badge tone="indigo">{incident.incidentId}</Badge><Badge tone={incident.status === "Resolved" ? "green" : "amber"}><span className={`h-1.5 w-1.5 rounded-full ${incident.status === "Resolved" ? "bg-emerald-500" : "animate-pulse bg-amber-500"}`} />{incident.status}</Badge>{incident.useMemory && <Badge tone="green">Memory enabled</Badge>}<span className="text-xs text-slate-500">{incident.createdAt ? new Date(incident.createdAt).toLocaleString() : ""}</span></div>
      <div><h1 className="gradient-text text-3xl font-semibold tracking-[-.055em] sm:text-4xl">Incident detail</h1><p className="mt-2 text-sm text-slate-600">Signal, generated guidance, recalled context, and engineer feedback.</p></div>
      <Card className="overflow-hidden"><div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4 sm:px-5"><FileText size={16} className="text-blue-600" /><h2 className="text-sm font-semibold text-slate-800">Original error log</h2><span className="ml-auto font-mono text-[10px] uppercase tracking-[.14em] text-slate-500">Raw signal</span></div><pre className="overflow-x-auto whitespace-pre-wrap break-words border-l-2 border-blue-600 bg-navy p-4 font-mono text-xs leading-6 text-blue-50 sm:p-5">{incident.rawErrorLog}</pre></Card>
      <div className="grid items-start gap-5 xl:grid-cols-[1.1fr_0.9fr]"><ResolutionPanel result={incident} /><Card className="p-4 sm:p-5"><div className="mb-4 flex items-center gap-2"><Layers3 size={16} className="text-emerald-600" /><h2 className="text-sm font-semibold text-slate-900">Recalled memories</h2></div>{incident.memoriesRecalled?.length ? <div className="space-y-3">{incident.memoriesRecalled.map((memory) => <MemoryCard key={memory.id} memory={memory} />)}</div> : <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">No memories were used for this analysis.</p>}</Card></div>
      {incident.engineerFeedback && <Card className="p-4 sm:p-5"><div className="mb-3 flex items-center gap-2"><Badge tone="green">LEARNED FIX</Badge><h2 className="text-sm font-semibold text-slate-900">Engineer feedback</h2></div>{incident.rootCause && <p className="mb-3 text-sm text-slate-600"><span className="font-medium text-slate-500">Root cause · </span>{incident.rootCause}</p>}<p className="whitespace-pre-line text-sm leading-7 text-slate-700">{incident.engineerFeedback}</p></Card>}
    </motion.div>
  );
}
