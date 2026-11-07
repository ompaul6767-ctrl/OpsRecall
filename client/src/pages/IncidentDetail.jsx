import {
  ArrowLeft,
  FileText,
  Layers3,
  BrainCircuit,
  MessageSquare,
  CheckCircle2,
  Sparkles
} from "lucide-react";

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

    getIncident(id)
      .then((data) => {
        setIncident(data);
      })
      .catch((reason) => {
        setError(reason.message);
        showErrorToast(reason.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return <Spinner label="Loading incident detail..." />;
  }

  if (error || !incident) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="text-[11px] text-slate-600">
          {error || "Incident not found."}
        </p>

        <div className="mt-5 flex justify-center gap-3">
          <Button variant="secondary" onClick={load}>
            Retry
          </Button>

          <Link to="/incidents">
            <Button variant="subtle">
              Back to history
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const incidentId = incident._id || incident.incidentId || id;

  const memoryRetained = incident.memoryRetained === true;
  const memoryEnabled = incident.useMemory === true;

  const recalledMemories = Array.isArray(incident.memoriesRecalled)
    ? incident.memoriesRecalled
    : [];

  const recalledCount =
    incident.memoriesRecalledCount ?? recalledMemories.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 sm:space-y-7"
    >
      <Link
        to="/incidents"
        className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-sm text-slate-600 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
      >
        <ArrowLeft size={15} />
        Back to incident history
      </Link>

      {/* Incident information */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="indigo">{incidentId}</Badge>

        <Badge tone={incident.status === "Resolved" ? "green" : "amber"}>
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              incident.status === "Resolved"
                ? "bg-emerald-500"
                : "animate-pulse bg-amber-500"
            }`}
          />
          {incident.status}
        </Badge>

        {memoryEnabled && (
          <Badge tone="green">Memory enabled</Badge>
        )}

        <Badge tone={memoryRetained ? "green" : "amber"}>
          {memoryRetained ? "Memory retained" : "Not retained"}
        </Badge>

        <span className="text-xs text-slate-500">
          {incident.createdAt
            ? new Date(incident.createdAt).toLocaleString()
            : ""}
        </span>
      </div>

      <div>
        <h1 className="gradient-text text-3xl font-semibold tracking-[-.055em] sm:text-4xl">
          Incident detail
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Signal, generated guidance, recalled context, and engineer feedback.
        </p>
      </div>

      {/* Original error log */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4 sm:px-5">
          <FileText size={16} className="text-blue-600" />

          <h2 className="text-sm font-semibold text-slate-800">
            Original error log
          </h2>

          <span className="ml-auto font-mono text-[10px] uppercase tracking-[.14em] text-slate-500">
            Raw signal
          </span>
        </div>

        <pre className="overflow-x-auto whitespace-pre-wrap break-words border-l-2 border-blue-600 bg-navy p-4 font-mono text-xs leading-6 text-blue-50 sm:p-5">
          {incident.rawErrorLog || "No error log available."}
        </pre>
      </Card>

      {/* AI Resolution */}
      <div className="grid items-start gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <ResolutionPanel result={incident} />

        {/* Memory information */}
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Layers3 size={16} className="text-emerald-600" />

            <h2 className="text-sm font-semibold text-slate-900">
              Memory information
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Memory enabled
              </span>

              <Badge tone={memoryEnabled ? "green" : "amber"}>
                {memoryEnabled ? "Yes" : "No"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Memories recalled
              </span>

              <span className="text-sm font-semibold text-slate-800">
                {recalledCount}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Memory retained
              </span>

              <Badge tone={memoryRetained ? "green" : "amber"}>
                {memoryRetained ? "Retained" : "Not retained"}
              </Badge>
            </div>

            <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
              <BrainCircuit size={15} className="text-blue-600" />

              <p className="text-xs leading-5 text-slate-600">
                {memoryRetained
                  ? "This resolved incident was successfully retained in Hindsight."
                  : "This incident has not been confirmed as retained in Hindsight."}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Root cause */}
      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-600" />

          <h2 className="text-sm font-semibold text-slate-900">
            Root cause
          </h2>
        </div>

        <p className="text-sm leading-6 text-slate-700">
          {incident.rootCause || "Root cause has not been documented."}
        </p>
      </Card>

      {/* Engineer feedback */}
      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <MessageSquare size={15} className="text-blue-600" />

          <h2 className="text-sm font-semibold text-slate-900">
            Engineer feedback
          </h2>
        </div>

        <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
          {incident.engineerFeedback || "No engineer feedback recorded."}
        </p>
      </Card>

      {/* Recalled memories */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BrainCircuit size={16} className="text-blue-600" />

              <h2 className="text-sm font-semibold text-slate-900">
                Recalled memories
              </h2>

              <Badge tone="indigo">
                {recalledMemories.length}
              </Badge>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Past incident knowledge retrieved by Hindsight.
            </p>
          </div>

          {recalledMemories.length > 0 && (
            <Badge tone="green">
              <Sparkles size={10} />
              Memory context available
            </Badge>
          )}
        </div>

        {recalledMemories.length > 0 ? (
          <div className="space-y-3">
            {recalledMemories.map((memory, index) => (
              <MemoryCard
                key={memory.id || memory._id || index}
                memory={memory}
              />
            ))}
          </div>
        ) : (
          <Card className="p-5 text-center">
            <BrainCircuit
              size={24}
              className="mx-auto text-slate-400"
            />

            <p className="mt-3 text-sm font-medium text-slate-700">
              No detailed recalled memories available.
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {recalledCount > 0
                ? `${recalledCount} memories were recalled, but their detailed records are not available for this incident.`
                : "No memories were recalled during this analysis."}
            </p>
          </Card>
        )}
      </section>
    </motion.div>
  );
}