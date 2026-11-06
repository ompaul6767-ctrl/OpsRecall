import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, WandSparkles } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import Badge from "./Badge.jsx";
import Button from "./Button.jsx";
import Card from "./Card.jsx";
import { staggerContainer } from "../utils/motion.js";
import { showErrorToast } from "../utils/toast.js";

function formatLine(line) {
  if (!line.trim()) return <div className="h-1" />;
  if (line.startsWith("#")) return <h4 className="pt-3 text-sm font-semibold tracking-tight text-blue-800">{line.replace(/^#+\s*/, "")}</h4>;
  const numberedStep = line.match(/^(\d+)\.\s+(.*)$/);
  if (numberedStep) return <div className="flex items-start gap-3 py-1"><span className="mt-0.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-50 font-mono text-[10px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">{numberedStep[1].padStart(2, "0")}</span><p className="pt-0.5 text-[13px] leading-6 text-slate-700">{numberedStep[2]}</p></div>;
  if (line.startsWith("- ")) return <p className="pl-4 text-[13px] leading-6 text-slate-700">{line}</p>;
  return <p className="text-[13px] leading-6 text-slate-700">{line}</p>;
}

export default function ResolutionPanel({ result, title = "AI suggested resolution", tone = "indigo" }) {
  const [copied, setCopied] = useState(false);
  const text = result?.generatedResolution || "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Resolution copied");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      showErrorToast("Clipboard access is unavailable in this browser.");
    }
  };
  return (
    <Card className="h-full overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5"><span className={`rounded-lg p-2 ${tone === "green" ? "bg-emerald-50 text-emerald-700" : tone === "red" ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"}`}><WandSparkles size={16} /></span><h3 className="truncate text-sm font-semibold text-slate-900">{title}</h3></div>
        <div className="flex items-center gap-2">{result?.latencyMs && <Badge>{result.latencyMs}ms</Badge>}<Button variant="subtle" className="!min-h-11 !w-11 !rounded-lg !p-2" onClick={copy} aria-label="Copy resolution"><AnimatePresence mode="wait" initial={false}><motion.span key={copied ? "copied" : "copy"} initial={{ opacity: 0, scale: .7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .7 }} transition={{ duration: .14 }}>{copied ? <Check size={16} className="text-emerald-700" /> : <Copy size={16} />}</motion.span></AnimatePresence></Button></div>
      </div>
      <motion.div key={text} variants={staggerContainer} initial="hidden" animate="show" className="space-y-2 px-4 py-5 sm:px-5">
        {text.split("\n").map((line, index) => <motion.div key={`${index}-${line.slice(0, 20)}`} variants={{ hidden: { opacity: 0, y: 5 }, show: { opacity: 1, y: 0, transition: { duration: .24 } } }}>{formatLine(line)}</motion.div>)}
      </motion.div>
    </Card>
  );
}
